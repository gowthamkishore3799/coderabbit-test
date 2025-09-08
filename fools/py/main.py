"""
huge_app.py
A large demo Python file with various utilities, algorithms, and OOP patterns.
No external libraries used, only standard library.
"""

import math
import random
import datetime
import json
import functools
import itertools
import string


# -----------------------------
# Utility functions
# -----------------------------

def factorial(n: int) -> int:
    """Recursive factorial."""
    return 1 if n <= 1 else n * factorial(n - 1)


def fibonacci(n: int) -> int:
    """Recursive Fibonacci."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def is_prime(n: int) -> bool:
    """Check if a number is prime."""
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True


def generate_random_string(length=8) -> str:
    return ''.join(random.choice(string.ascii_letters) for _ in range(length))


# -----------------------------
# Data structures
# -----------------------------

class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        return self._items.pop() if self._items else None

    def peek(self):
        return self._items[-1] if self._items else None

    def is_empty(self):
        return len(self._items) == 0

    def __repr__(self):
        return f"Stack({self._items})"


class Queue:
    def __init__(self):
        self._items = []

    def enqueue(self, item):
        self._items.insert(0, item)

    def dequeue(self):
        return self._items.pop() if self._items else None

    def __repr__(self):
        return f"Queue({self._items})"


# -----------------------------
# OOP examples with inheritance
# -----------------------------

class Shape:
    def area(self):
        raise NotImplementedError("Subclasses must implement area()")

    def perimeter(self):
        raise NotImplementedError("Subclasses must implement perimeter()")


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2

    def perimeter(self):
        return 2 * math.pi * self.radius


# -----------------------------
# Algorithms
# -----------------------------

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1


# -----------------------------
# Decorators and higher-order functions
# -----------------------------

def logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"[{datetime.datetime.now()}] Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"[{datetime.datetime.now()}] {func.__name__} returned {result}")
        return result
    return wrapper


@logger
def add(a, b):
    return a + b


# -----------------------------
# File I/O helpers
# -----------------------------

def save_to_file(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f)


def load_from_file(filename):
    with open(filename, "r") as f:
        return json.load(f)


# -----------------------------
# Demo / main program
# -----------------------------

if __name__ == "__main__":
    print("=== Utilities ===")
    print("Factorial(5):", factorial(5))
    print("Fibonacci(10):", fibonacci(10))
    print("Is 29 prime?", is_prime(29))
    print("Random string:", generate_random_string(12))

    print("\n=== Data Structures ===")
    s = Stack()
    s.push(1); s.push(2); s.push(3)
    print("Stack:", s, "Popped:", s.pop())

    q = Queue()
    q.enqueue("a"); q.enqueue("b"); q.enqueue("c")
    print("Queue:", q, "Dequeued:", q.dequeue())

    print("\n=== OOP ===")
    r = Rectangle(4, 6)
    c = Circle(3)
    print("Rectangle area:", r.area(), "perimeter:", r.perimeter())
    print("Circle area:", c.area(), "perimeter:", c.perimeter())

    print("\n=== Algorithms ===")
    arr = [5, 2, 9, 1, 5, 6]
    print("Bubble sort:", bubble_sort(arr))
    print("Binary search (find 5):", binary_search(sorted(arr), 5))

    print("\n=== Decorators ===")
    add(10, 20)

    print("\n=== File I/O ===")
    sample_data = {"user": "Alice", "score": 42}
    save_to_file("sample.json", sample_data)
    print("Loaded from file:", load_from_file("sample.json"))
