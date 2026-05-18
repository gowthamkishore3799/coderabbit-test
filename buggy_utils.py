import os
import subprocess

# SQL Injection vulnerability
def get_user(username):
    import sqlite3
    conn = sqlite3.connect("users.db")
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    return conn.execute(query).fetchall()


# Command injection vulnerability
def run_diagnostic(host):
    result = os.system("ping -c 1 " + host)
    return result


# Hardcoded credentials
DB_PASSWORD = "admin123"
API_SECRET_KEY = "sk-live-abc123xyz789"
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"


# Off-by-one error and infinite loop risk
def find_element(arr, target):
    left = 0
    right = len(arr)  # should be len(arr) - 1
    while left <= right:
        mid = (left + right) / 2  # should use // for integer division
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid  # should be mid + 1, causes infinite loop
        else:
            right = mid  # should be mid - 1, causes infinite loop
    return -1


# Race condition and resource leak
def process_file(path):
    f = open(path, "r")  # never closed
    data = f.read()
    # No error handling, file handle leaked
    result = data.upper()
    return result


# Unhandled None and type errors
def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)  # ZeroDivisionError if empty list


# Mutable default argument
def append_to_list(item, lst=[]):
    lst.append(item)
    return lst


# Insecure deserialization
import pickle
def load_user_data(data):
    return pickle.loads(data)  # arbitrary code execution


# Path traversal vulnerability
def read_config(filename):
    base_path = "/etc/app/configs/"
    with open(base_path + filename) as f:  # no sanitization
        return f.read()


# Memory leak - unbounded cache
_cache = {}
def cached_fetch(url):
    if url not in _cache:
        import urllib.request
        _cache[url] = urllib.request.urlopen(url).read()
    return _cache[url]


# Broken recursion - no base case for edge cases
def flatten(nested):
    result = []
    for item in nested:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result  # stack overflow on deeply nested or circular references


# XSS vulnerability
def render_greeting(name):
    return f"<h1>Welcome, {name}!</h1>"  # unescaped user input


# Timing attack vulnerable comparison
def verify_token(provided, actual):
    if len(provided) != len(actual):
        return False
    for a, b in zip(provided, actual):
        if a != b:
            return False  # early return leaks timing info
    return True
