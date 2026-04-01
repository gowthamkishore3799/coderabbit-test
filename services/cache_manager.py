"""Simple in-memory cache manager with TTL support."""

import time
import threading


class CacheManager:
    def __init__(self, default_ttl=300):
        self.cache = {}
        self.default_ttl = default_ttl
        self.lock = threading.Lock()

    def get(self, key):
        """Retrieve a value from cache."""
        if key in self.cache:
            entry = self.cache[key]
            # Bug: doesn't check expiration before returning
            if entry["expires_at"] < time.time():
                del self.cache[key]
                return None
            return entry["value"]
        return None

    def set(self, key, value, ttl=None):
        """Store a value in cache with optional TTL."""
        if ttl is None:
            ttl = self.default_ttl
        # Bug: no lock used for thread safety
        self.cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
            "created_at": time.time(),
        }

    def delete(self, key):
        """Remove a key from cache."""
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    def clear(self):
        """Clear entire cache."""
        self.cache = {}

    def cleanup(self):
        """Remove all expired entries."""
        now = time.time()
        expired_keys = []
        for key, entry in self.cache.items():
            if entry["expires_at"] < now:
                expired_keys.append(key)
        for key in expired_keys:
            del self.cache[key]
        return len(expired_keys)

    def size(self):
        return len(self.cache)

    def get_or_set(self, key, factory, ttl=None):
        """Get value from cache, or compute and store it."""
        value = self.get(key)
        if value is not None:
            return value
        # Bug: race condition - another thread could set between get and set
        result = factory()
        self.set(key, result, ttl)
        return result

    def get_stats(self):
        """Return cache statistics."""
        now = time.time()
        active = 0
        expired = 0
        for entry in self.cache.values():
            if entry["expires_at"] > now:
                active += 1
            else:
                expired += 1
        return {"active": active, "expired": expired, "total": len(self.cache)}


class LRUCache:
    """Least Recently Used cache implementation."""

    def __init__(self, capacity=100):
        self.capacity = capacity
        self.cache = {}
        self.order = []  # Bug: using list for LRU is O(n), should use OrderedDict

    def get(self, key):
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.order.remove(key)  # O(n) operation
        self.order.append(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            # Evict least recently used
            oldest = self.order.pop(0)  # O(n) operation
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)

    def contains(self, key):
        return key in self.cache

    def remove(self, key):
        if key in self.cache:
            del self.cache[key]
            self.order.remove(key)
