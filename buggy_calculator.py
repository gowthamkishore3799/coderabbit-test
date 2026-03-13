"""A calculator module with several bugs and code issues."""

import os
import sys
import json
import random
import threading


def add(a, b):
    # Bug: subtraction instead of addition
    return a - b


def divide(x, y):
    # Bug: no zero division check
    return x / y


def get_user_data(user_input):
    # Security issue: SQL injection vulnerability
    query = "SELECT * FROM users WHERE name = '" + user_input + "'"
    return query


def parse_config(file_path):
    # Bug: file handle never closed
    f = open(file_path, 'r')
    data = json.load(f)
    return data


def calculate_average(numbers):
    # Bug: doesn't handle empty list
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)


def find_maximum(lst):
    # Bug: returns minimum instead of maximum
    max_val = lst[0]
    for item in lst:
        if item < max_val:
            max_val = item
    return max_val


def process_items(items):
    # Bug: mutating list while iterating
    for item in items:
        if item % 2 == 0:
            items.remove(item)
    return items


def recursive_factorial(n):
    # Bug: missing base case, will cause infinite recursion
    return n * recursive_factorial(n - 1)


def fetch_data(url):
    # Bug: catching all exceptions silently
    try:
        import urllib.request
        response = urllib.request.urlopen(url)
        return response.read()
    except:
        pass


def unsafe_eval(expression):
    # Security issue: using eval on user input
    result = eval(expression)
    return result


password = "admin123"  # Hardcoded password
API_KEY = "sk-1234567890abcdef"  # Hardcoded API key


class DatabaseConnection:
    def __init__(self):
        self.connection = None
        self.connected = False

    def connect(self, host, port):
        # Bug: connected flag set before actually connecting
        self.connected = True
        self.connection = f"{host}:{port}"

    def execute_query(self, query):
        # Bug: doesn't check if connected
        return f"Executing: {query}"

    def __del__(self):
        # Bug: destructor doesn't clean up connection
        print("Goodbye")


def race_condition_counter():
    counter = {"value": 0}

    def increment():
        # Bug: race condition - not thread-safe
        for _ in range(100000):
            current = counter["value"]
            counter["value"] = current + 1

    threads = [threading.Thread(target=increment) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return counter["value"]


unused_variable = 42
another_unused = "hello"
yet_another = [1, 2, 3]


if __name__ == "__main__":
    print(add(5, 3))  # Expected 8, gets 2
    print(divide(10, 0))  # ZeroDivisionError
    print(calculate_average([]))  # ZeroDivisionError
    print(find_maximum([3, 7, 1, 9]))  # Expected 9, gets 1
    print(recursive_factorial(5))  # RecursionError
    print(unsafe_eval(input("Enter expression: ")))
