/**
 * A longer Node.js example: production-ish Express API with:
 * - request ID + structured logging
 * - input validation (tiny custom)
 * - in-memory TTL cache
 * - rate limiting
 * - graceful shutdown
 * - background job loop
 *
 * Run:
 *   npm i express
 *   node server.js
 */

"use strict";

const http = require("http");
const crypto = require("crypto");
const express = require("express");

// -------------------------
// Config
// -------------------------
const CONFIG = {
  port: parseInt(process.env.PORT || "3000", 10),
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  rateLimit: {
    windowMs: 30_000,
    maxRequests: 120,
  },
  cache: {
    defaultTtlMs: 30_000,
    maxEntries: 5_000,
  },
  jobs: {
    intervalMs: 5_000,
  },
};

// -------------------------
// Tiny structured logger
// -------------------------
const LOG_LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
function nowIso() {
  return new Date().toISOString();
}
function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ msg: "failed_to_stringify_log" });
  }
}
function createLogger(level = "info") {
  const threshold = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  function log(lvl, msg, extra = {}) {
    const sev = LOG_LEVELS[lvl] ?? LOG_LEVELS.info;
    if (sev < threshold) return;

    const entry = {
      ts: nowIso(),
      level: lvl,
      msg,
      ...extra,
    };
    const line = safeJson(entry);
    // stderr for warn/error, stdout otherwise
    if (sev >= LOG_LEVELS.warn) process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
  }

  return {
    debug: (msg, extra) => log("debug", msg, extra),
    info: (msg, extra) => log("info", msg, extra),
    warn: (msg, extra) => log("warn", msg, extra),
    error: (msg, extra) => log("error", msg, extra),
  };
}

const logger = createLogger(CONFIG.logLevel);

// -------------------------
// Utilities
// -------------------------
function makeRequestId() {
  return crypto.randomBytes(8).toString("hex");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------------------------
// In-memory TTL cache
// -------------------------
class TtlCache {
  constructor({ defaultTtlMs, maxEntries }) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.map = new Map(); // key -> { value, expiresAt }
    this.hits = 0;
    this.misses = 0;
  }

  _now() {
    return Date.now();
  }

  _evictExpired() {
    const now = this._now();
    let removed = 0;
    for (const [key, entry] of this.map.entries()) {
      if (entry.expiresAt <= now) {
        this.map.delete(key);
        removed++;
      }
    }
    return removed;
  }

  _evictIfTooLarge() {
    if (this.map.size <= this.maxEntries) return 0;
    // naive eviction: remove oldest inserted (Map preserves insertion order)
    let removed = 0;
    while (this.map.size > this.maxEntries) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
      removed++;
    }
    return removed;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (entry.expiresAt <= this._now()) {
      this.map.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = this._now() + Math.max(1, ttlMs);
    this.map.set(key, { value, expiresAt });
    this._evictExpired();
    this._evictIfTooLarge();
  }

  del(key) {
    return this.map.delete(key);
  }

  stats() {
    return {
      size: this.map.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses === 0 ? 0 : this.hits / (this.hits + this.misses),
    };
  }
}

const cache = new TtlCache({
  defaultTtlMs: CONFIG.cache.defaultTtlMs,
  maxEntries: CONFIG.cache.maxEntries,
});

// -------------------------
// Simple rate limiter (in-memory)
// -------------------------
class RateLimiter {
  constructor({ windowMs, maxRequests }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.buckets = new Map(); // key -> { count, resetAt }
  }

  _now() {
    return Date.now();
  }

  check(key) {
    const now = this._now();
    let b = this.buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, b);
    }
    b.count++;
    const remaining = Math.max(0, this.maxRequests - b.count);
    const allowed = b.count <= this.maxRequests;
    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      resetMs: Math.max(0, b.resetAt - now),
    };
  }

  sweep() {
    const now = this._now();
    let removed = 0;
    for (const [k, b] of this.buckets.entries()) {
      if (b.resetAt <= now) {
        this.buckets.delete(k);
        removed++;
      }
    }
    return removed;
  }
}

const limiter = new RateLimiter(CONFIG.rateLimit);

// -------------------------
// Minimal validation helpers
// -------------------------
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function isPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}
function validate(schema, obj) {
  // schema: { fieldName: (value)=>boolean }
  const errors = [];
  for (const [k, fn] of Object.entries(schema)) {
    const ok = fn(obj[k]);
    if (!ok) errors.push({ field: k, message: `Invalid ${k}` });
  }
  return { ok: errors.length === 0, errors };
}

// -------------------------
// Fake "DB" + service layer
// -------------------------
const db = {
  users: new Map(), // id -> { id, name, createdAt }
};

function createUser({ name }) {
  const id = crypto.randomUUID();
  const user = { id, name: name.trim(), createdAt: new Date().toISOString() };
  db.users.set(id, user);
  return user;
}

function getUser(id) {
  return db.users.get(id) || null;
}

function listUsers({ limit = 20 }) {
  const arr = Array.from(db.users.values());
  // newest first
  arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return arr.slice(0, limit);
}

// -------------------------
// Express app
// -------------------------
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Request ID + request logging
app.use((req, res, next) => {
  const reqId = req.get("x-request-id") || makeRequestId();
  req.reqId = reqId;
  res.setHeader("x-request-id", reqId);

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info("http_request", {
      reqId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
      ip: req.ip,
      ua: req.get("user-agent") || "",
    });
  });

  next();
});

// Rate limiter (per-IP)
app.use((req, res, next) => {
  const key = req.ip || "unknown";
  const r = limiter.check(key);

  res.setHeader("x-ratelimit-limit", String(r.limit));
  res.setHeader("x-ratelimit-remaining", String(r.remaining));
  res.setHeader("x-ratelimit-reset-ms", String(r.resetMs));

  if (!r.allowed) {
    return res.status(429).json({
      error: "rate_limited",
      message: "Too many requests. Try again later.",
      reqId: req.reqId,
    });
  }
  next();
});

// Health
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    env: CONFIG.env,
    uptimeSec: Math.floor(process.uptime()),
    cache: cache.stats(),
  });
});

// Create user
app.post("/users", (req, res) => {
  const { ok, errors } = validate({ name: isNonEmptyString }, req.body || {});
  if (!ok) return res.status(400).json({ error: "bad_request", errors, reqId: req.reqId });

  const user = createUser({ name: req.body.name });
  res.status(201).json({ user, reqId: req.reqId });
});

// Get user (cached)
app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  const cacheKey = `user:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ user: cached, cached: true, reqId: req.reqId });
  }

  const user = getUser(id);
  if (!user) return res.status(404).json({ error: "not_found", reqId: req.reqId });

  cache.set(cacheKey, user, 20_000);
  return res.json({ user, cached: false, reqId: req.reqId });
});

// List users (optional ?limit=)
app.get("/users", (req, res) => {
  const limit = req.query.limit == null ? 20 : Number(req.query.limit);
  if (!isPositiveInt(limit) || limit > 200) {
    return res.status(400).json({
      error: "bad_request",
      message: "limit must be a positive integer <= 200",
      reqId: req.reqId,
    });
  }
  const users = listUsers({ limit });
  res.json({ users, count: users.length, reqId: req.reqId });
});

// Example expensive endpoint with caching
app.get("/compute/fibonacci", async (req, res) => {
  const n = Number(req.query.n ?? 35);
  if (!isPositiveInt(n) || n > 45) {
    return res.status(400).json({
      error: "bad_request",
      message: "n must be a positive integer <= 45",
      reqId: req.reqId,
    });
  }

  const cacheKey = `fib:${n}`;
  const cached = cache.get(cacheKey);
  if (cached != null) {
    return res.json({ n, value: cached, cached: true, reqId: req.reqId });
  }

  // intentionally slow-ish
  function fib(x) {
    if (x <= 1) return x;
    return fib(x - 1) + fib(x - 2);
  }

  const value = fib(n);
  cache.set(cacheKey, value, 60_000);
  res.json({ n, value, cached: false, reqId: req.reqId });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl, reqId: req.reqId });
});

// Error handler (must have 4 args)
app.use((err, req, res, _next) => {
  logger.error("unhandled_error", {
    reqId: req?.reqId,
    message: err?.message,
    stack: CONFIG.env === "development" ? err?.stack : undefined,
  });
  res.status(500).json({ error: "internal_error", reqId: req?.reqId });
});

// -------------------------
// Background job loop
// -------------------------
let stopping = false;
async function jobLoop() {
  while (!stopping) {
    try {
      const removedBuckets = limiter.sweep();
      const removedCache = cache._evictExpired();

      logger.debug("background_maintenance", {
        removedBuckets,
        removedCache,
        cacheSize: cache.stats().size,
      });
    } catch (e) {
      logger.warn("background_job_failed", { message: e?.message });
    }
    await sleep(CONFIG.jobs.intervalMs);
  }
}

// -------------------------
// Server + graceful shutdown
// -------------------------
const server = http.createServer(app);

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  logger.warn("shutdown_start", { signal });

  // stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error("shutdown_server_close_error", { message: err.message });
      process.exitCode = 1;
    } else {
      logger.info("shutdown_server_closed");
    }
  });

  // hard timeout to exit
  setTimeout(() => {
    logger.warn("shutdown_forced_exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.listen(CONFIG.port, () => {
  logger.info("server_listening", { port: CONFIG.port, env: CONFIG.env });
  jobLoop().catch((e) => logger.error("jobLoop_crashed", { message: e?.message }));
});
