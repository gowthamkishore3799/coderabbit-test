// server.js
// A "huge-ass" Node.js app: Express, observability, rate limits, jobs, cache, retries, feature flags.
// Run: node server.js  (env vars below are optional)

// ------------------------- Config -------------------------
const CONFIG = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVICE_NAME: process.env.SERVICE_NAME || "mega-node-app",
  VERSION: process.env.VERSION || "v1.0.0",
  // rate limiting
  RATE_POINTS: Number(process.env.RATE_POINTS || 300),
  RATE_DURATION: Number(process.env.RATE_DURATION || 60),
  // prom
  METRICS_PATH: process.env.METRICS_PATH || "/metrics",
  // statsd (Datadog/Graphite)
  STATSD_HOST: process.env.STATSD_HOST || "127.0.0.1",
  STATSD_PORT: Number(process.env.STATSD_PORT || 8125),
  STATSD_ENABLED: process.env.STATSD_ENABLED === "true",
  // feature flags
  FEATURES: {
    enableFancyEndpoint: process.env.FEAT_FANCY === "true",
    enableBackgroundJobs: process.env.FEAT_JOBS !== "false",
  },
  // retry
  RETRY_MAX_ATTEMPTS: Number(process.env.RETRY_MAX_ATTEMPTS || 3),
  RETRY_BASE_MS: Number(process.env.RETRY_BASE_MS || 100),
};

// ------------------------- Imports -------------------------
const express = require("express");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { v4: uuidv4 } = require("uuid");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const LRU = require("lru-cache");
const cron = require("node-cron");
const prom = require("prom-client");
const os = require("os");

// Optional: DogStatsD (Datadog). Safe to run even if agent not present.
let statsd = null;
if (CONFIG.STATSD_ENABLED) {
  try {
    const { StatsD } = require("hot-shots");
    statsd = new StatsD({
      host: CONFIG.STATSD_HOST,
      port: CONFIG.STATSD_PORT,
      globalTags: { service: CONFIG.SERVICE_NAME, env: CONFIG.NODE_ENV, version: CONFIG.VERSION },
      errorHandler: (e) => logger?.warn({ err: e }, "StatsD error"),
      telegraf: false,
      maxBufferSize: 1024 * 8,
      bufferFlushInterval: 1000,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("hot-shots not installed; skipping StatsD.");
  }
}

// ------------------------- Logger -------------------------
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: CONFIG.SERVICE_NAME, version: CONFIG.VERSION },
  msgPrefix: "[mega] ",
});

// ------------------------- App & Middleware -------------------------
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request ID + pino-http
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || uuidv4();
  res.setHeader("x-request-id", req.id);
  next();
});
app.use(
  pinoHttp({
    logger,
    useLevel: "info",
    customProps: (req) => ({
      reqId: req.id,
      userAgent: req.headers["user-agent"],
      remoteAddr: req.ip,
    }),
  })
);

// Simple CORS (adjust as needed)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-Id");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ------------------------- Rate Limiting -------------------------
const rateLimiter = new RateLimiterMemory({ points: CONFIG.RATE_POINTS, duration: CONFIG.RATE_DURATION });
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ error: "Too Many Requests" });
  }
});

// ------------------------- Prometheus Metrics -------------------------
prom.collectDefaultMetrics({
  labels: { service: CONFIG.SERVICE_NAME, version: CONFIG.VERSION, env: CONFIG.NODE_ENV },
});
const httpRequestHistogram = new prom.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});
app.use((req, res, next) => {
  const end = httpRequestHistogram.startTimer({ method: req.method, route: req.path });
  res.on("finish", () => {
    end({ status: res.statusCode });
    if (statsd) statsd.increment("http.requests", 1, { route: req.path, method: req.method, status: "" + res.statusCode });
  });
  next();
});
app.get(CONFIG.METRICS_PATH, async (_req, res) => {
  res.set("Content-Type", prom.register.contentType);
  res.end(await prom.register.metrics());
});

// ------------------------- In-Memory Cache -------------------------
const cache = new LRU({
  max: 5_000,
  ttl: 1000 * 60 * 5, // 5 min
});
function cacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}
function cacheMiddleware(ttlMs = 10_000) {
  return (req, res, next) => {
    const key = cacheKey(req);
    const hit = cache.get(key);
    if (hit) return res.set("x-cache", "HIT").json(hit);
    const json = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body, { ttl: ttlMs });
      res.set("x-cache", "MISS");
      return json(body);
    };
    next();
  };
}

// ------------------------- Utilities -------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(fn, { attempts = CONFIG.RETRY_MAX_ATTEMPTS, baseMs = CONFIG.RETRY_BASE_MS, factor = 2 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const backoff = baseMs * Math.pow(factor, i);
      await sleep(backoff);
    }
  }
  throw lastErr;
}
function safeTag(value, maxLen = 64) {
  // prevent high-cardinality bomb in StatsD tags
  if (!value) return "unknown";
  const s = String(value).slice(0, maxLen);
  return s.replace(/[^a-zA-Z0-9_.:-]/g, "_");
}

// ------------------------- Health/Info -------------------------
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/readyz", (_req, res) => res.json({ ready: true }));
app.get("/info", (_req, res) => {
  res.json({
    service: CONFIG.SERVICE_NAME,
    version: CONFIG.VERSION,
    env: CONFIG.NODE_ENV,
    pid: process.pid,
    host: os.hostname(),
    uptime_s: process.uptime(),
  });
});

// ------------------------- Example API -------------------------
app.get("/api/v1/echo", cacheMiddleware(5000), (req, res) => {
  const q = req.query || {};
  if (statsd) statsd.increment("echo.hit", 1, { sample: safeTag(q.sample) });
  res.json({ ok: true, echo: q, ts: Date.now(), reqId: req.id });
});

app.post("/api/v1/sum", async (req, res, next) => {
  try {
    const nums = Array.isArray(req.body?.nums) ? req.body.nums.map(Number) : [];
    if (!nums.length) return res.status(400).json({ error: "nums must be an array of numbers" });
    // fake flaky worker to demo retry
    const result = await retry(async () => {
      if (Math.random() < 0.25) throw new Error("flaky");
      return nums.reduce((a, b) => a + b, 0);
    });
    if (statsd) statsd.gauge("sum.result", result);
    res.json({ sum: result });
  } catch (e) {
    next(e);
  }
});

// Feature-flagged route
if (CONFIG.FEATURES.enableFancyEndpoint) {
  app.get("/api/v1/fancy", async (_req, res) => {
    await sleep(50);
    res.json({ fancy: true, message: "✨ Hello from a feature-flagged endpoint!" });
  });
}

// ------------------------- Background Jobs -------------------------
const jobState = { runs: 0, lastRun: null, queueDepth: 0 };
const jobQueue = [];
function enqueueJob(name, payload) {
  jobQueue.push({ id: uuidv4(), name, payload, enqueuedAt: Date.now() });
  jobState.queueDepth = jobQueue.length;
}
async function workerLoop() {
  while (running) {
    const job = jobQueue.shift();
    jobState.queueDepth = jobQueue.length;
    if (job) {
      const start = Date.now();
      try {
        logger.info({ job }, "Processing job");
        await sleep(25 + Math.random() * 75);
        if (statsd) statsd.timing("jobs.latency_ms", Date.now() - start, { name: safeTag(job.name) });
      } catch (e) {
        logger.warn({ err: e, job }, "Job failed");
        if (statsd) statsd.increment("jobs.failed", 1, { name: safeTag(job.name) });
      }
    } else {
      await sleep(50);
    }
  }
}
let running = true;
if (CONFIG.FEATURES.enableBackgroundJobs) workerLoop();

// Cron to enqueue demo job every minute
const cronTask = cron.schedule("* * * * *", () => {
  enqueueJob("heartbeat", { ts: Date.now() });
  jobState.runs++;
  jobState.lastRun = new Date().toISOString();
  if (statsd) statsd.increment("cron.heartbeat");
});
cronTask.start();

app.get("/jobs/state", (_req, res) => res.json(jobState));
app.post("/jobs/enqueue", (req, res) => {
  const { name = "custom", payload = {} } = req.body || {};
  enqueueJob(String(name), payload);
  res.json({ ok: true, queued: name, depth: jobState.queueDepth });
});

// ------------------------- Error Handling -------------------------
app.use((err, req, res, _next) => {
  req.log?.error({ err, reqId: req.id }, "Unhandled error");
  if (statsd) statsd.increment("errors.unhandled", 1, { route: safeTag(req.path) });
  res.status(500).json({ error: "Internal Server Error", reqId: req.id });
});

// ------------------------- Graceful Shutdown -------------------------
const server = app.listen(CONFIG.PORT, () => {
  logger.info({ port: CONFIG.PORT }, "Server started");
});
const shutdown = (signal) => async () => {
  logger.info({ signal }, "Shutting down...");
  running = false;
  cronTask.stop();
  server.close(() => {
    statsd?.close();
    logger.info("Closed HTTP server. Bye!");
    process.exit(0);
  });
  // force quit if hung
  setTimeout(() => {
    logger.warn("Forcing shutdown");
    process.exit(1);
  }, 10_000).unref();
};
process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));
