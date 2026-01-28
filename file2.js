// random-node-server.js
// Run: node random-node-server.js
// Test:
//   curl -i http://localhost:3000/health
//   curl -i http://localhost:3000/random
//   curl -i -X POST http://localhost:3000/echo -H "content-type: application/json" -d '{"hi":"there"}'

const http = require("http");
const { randomUUID } = require("crypto");
const url = require("url");

const PORT = process.env.PORT || 3000;

// naive in-memory rate limiter: max 20 req/min per IP
const buckets = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 20;

  const entry = buckets.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  buckets.set(ip, entry);

  return entry.count <= limit;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    ...headers,
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const id = randomUUID();
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname || "/";
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const start = Date.now();

  // basic logging
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] id=${id} ip=${ip} ${req.method} ${path} -> ${res.statusCode} ${ms}ms`);
  });

  if (!rateLimit(ip)) return send(res, 429, { error: "Too many requests", id });

  try {
    if (req.method === "GET" && path === "/health") {
      return send(res, 200, { ok: true, id, uptimeSec: Math.round(process.uptime()) });
    }

    if (req.method === "GET" && path === "/random") {
      const items = ["coffee", "tacos", "leetcode", "hiking", "docker", "flink", "lancedb"];
      const pick = items[Math.floor(Math.random() * items.length)];
      return send(res, 200, { id, pick, n: Math.random(), time: new Date().toISOString() });
    }

    if (req.method === "POST" && path === "/echo") {
      const body = await readJson(req);
      return send(res, 200, { id, received: body, headers: req.headers });
    }

    if (req.method === "GET" && path === "/stream") {
