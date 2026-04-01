"""A calculator module with several bugs and code issues."""

import os
import sys
import json
import random
import threading


def add(a, b):
    return a + b


def divide(x, y):
    if y == 0:
        raise ValueError("Cannot divide by zero")
    return x / y


def get_user_data(user_input):
    # Security issue: SQL injection vulnerability
    query = "SELECT * FROM users WHERE name = '" + user_input + "'"
    return query


def parse_config(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data


def calculate_average(numbers):
    if not numbers:
        raise ValueError("Cannot calculate average of an empty list")
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)


def find_maximum(lst):
    max_val = lst[0]
    for item in lst:
        if item > max_val:
            max_val = item
    return max_val


def process_items(items):
    return [item for item in items if item % 2 != 0]


def recursive_factorial(n):
    if n <= 1:
        return 1
    return n * recursive_factorial(n - 1)


def fetch_data(url):
    try:
        import urllib.request
        response = urllib.request.urlopen(url)
        return response.read()
    except Exception as e:
        raise RuntimeError(f"Failed to fetch data from {url}") from e


def unsafe_eval(expression):
    # Security issue: using eval on user input
    result = eval(expression)
    return result


password = os.environ.get("APP_PASSWORD")
API_KEY = os.environ.get("API_KEY")


class DatabaseConnection:
    def __init__(self):
        self.connection = None
        self.connected = False

    def connect(self, host, port):
        self.connection = f"{host}:{port}"
        self.connected = True

    def execute_query(self, query):
        if not self.connected:
            raise RuntimeError("Not connected to the database")
        return f"Executing: {query}"

    def __del__(self):
        if self.connection:
            self.connection = None
            self.connected = False


def race_condition_counter():
    """Increment a shared counter from multiple threads in a thread-safe manner using a lock."""
    counter = {"value": 0}
    lock = threading.Lock()

    def increment():
        for _ in range(100000):
            with lock:
                current = counter["value"]
                counter["value"] = current + 1

    threads = [threading.Thread(target=increment) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return counter["value"]


if __name__ == "__main__":
    print(add(5, 3))             # 8
    print(divide(10, 2))         # 5.0
    print(calculate_average([1, 2, 3]))  # 2.0
    print(find_maximum([3, 7, 1, 9]))    # 9
    print(recursive_factorial(5))        # 120
