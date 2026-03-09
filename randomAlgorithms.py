import random
from collections import defaultdict


def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


def fibonacci(n):
    if n <= 0:
        return []
    if n == 1:
        return [0]
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[i - 1] + seq[i - 2])
    return seq


def caesar_cipher(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result


def word_frequency(text):
    words = text.lower().split()
    freq = defaultdict(int)
    for word in words:
        freq[word] += 1
    return dict(sorted(freq.items(), key=lambda x: x[1], reverse=True))


def matrix_multiply(a, b):
    rows_a, cols_a = len(a), len(a[0])
    rows_b, cols_b = len(b), len(b[0])
    if cols_a != rows_b:
        raise ValueError("Incompatible matrix dimensions")
    result = [[0] * cols_b for _ in range(rows_a)]
    for i in range(rows_a):
        for j in range(cols_b):
            for k in range(cols_a):
                result[i][j] += a[i][k] * b[k][j]
    return result


def generate_password(length=16):
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    return "".join(random.choice(chars) for _ in range(length))


def is_palindrome(s):
    cleaned = "".join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]


def flatten_list(nested):
    flat = []
    for item in nested:
        if isinstance(item, list):
            flat.extend(flatten_list(item))
        else:
            flat.append(item)
    return flat


if __name__ == "__main__":
    print("Sorted:", bubble_sort([64, 34, 25, 12, 22, 11, 90]))
    print("Fibonacci:", fibonacci(10))
    print("Cipher:", caesar_cipher("Hello World", 3))
    print("Palindrome:", is_palindrome("A man a plan a canal Panama"))
    print("Password:", generate_password())
    print("Flattened:", flatten_list([1, [2, [3, 4], 5], [6, 7]]))
