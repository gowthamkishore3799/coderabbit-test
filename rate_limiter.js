/**
 * Token-bucket rate limiter.
 * Each key gets `capacity` tokens refilled at `refillRate` tokens/sec.
 */
class RateLimiter {
  constructor({ capacity = 10, refillRate = 1 } = {}) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this._buckets = new Map(); // key -> { tokens, lastRefill }
  }

  _getBucket(key) {
    if (!this._buckets.has(key)) {
      this._buckets.set(key, { tokens: this.capacity, lastRefill: Date.now() });
    }
    return this._buckets.get(key);
  }

  _refill(bucket) {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;
  }

  /** Returns true if the request is allowed, false if rate-limited. */
  allow(key, cost = 1) {
    const bucket = this._getBucket(key);
    this._refill(bucket);
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    return false;
  }

  /** Remaining tokens for a key (after refill). */
  remaining(key) {
    const bucket = this._getBucket(key);
    this._refill(bucket);
    return Math.floor(bucket.tokens);
  }

  /** Reset a specific key or all keys. */
  reset(key) {
    if (key) {
      this._buckets.delete(key);
    } else {
      this._buckets.clear();
    }
  }
}

module.exports = RateLimiter;
