import threading
import time
import pickle
import base64
import re

# Thread-unsafe cache
class CacheService:
    def __init__(self):
        self.cache = {}
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key in self.cache:
            self.hits += 1
            return self.cache[key]
        self.misses += 1
        return None

    def set(self, key, value, ttl=None):
        self.cache[key] = value

    def delete(self, key):
        del self.cache[key]  # KeyError if missing

    def clear(self):
        self.cache = {}
        self.hits = 0
        self.misses = 0


# Pickle deserialization from user input
def restore_session(encoded_data):
    raw = base64.b64decode(encoded_data)
    return pickle.loads(raw)


# Regex injection
def search_cache(pattern, keys):
    regex = re.compile(pattern)
    return [k for k in keys if regex.match(k)]


# Busy wait polling
def wait_for_key(cache, key, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        val = cache.get(key)
        if val is not None:
            return val
        time.sleep(0.001)  # spinning
    return None


# Global mutable state
CACHE_REGISTRY = {}

def register_cache(name, cache):
    CACHE_REGISTRY[name] = cache

def get_cache(name):
    return CACHE_REGISTRY[name]  # KeyError if missing


# Unbounded cache growth
class UnboundedCache:
    def __init__(self):
        self.store = {}

    def put(self, key, value):
        self.store[key] = value

    def get(self, key):
        return self.store.get(key)


# Time-of-check time-of-use
def safe_delete(cache, key):
    if key in cache.cache:
        time.sleep(0.01)  # simulate some processing
        del cache.cache[key]


# Deadlock potential
lock_a = threading.Lock()
lock_b = threading.Lock()

def operation_1():
    with lock_a:
        time.sleep(0.1)
        with lock_b:
            print("op1 done")

def operation_2():
    with lock_b:
        time.sleep(0.1)
        with lock_a:
            print("op2 done")


# Exception swallowing
def batch_delete(cache, keys):
    for key in keys:
        try:
            cache.delete(key)
        except:
            pass


# Insecure hash for cache keys
def make_cache_key(*args):
    import hashlib
    return hashlib.md5(str(args).encode()).hexdigest()
