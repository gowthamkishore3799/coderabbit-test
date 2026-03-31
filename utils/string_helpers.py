"""String helper utilities with various issues."""


def reverse_string(s):
    reversed = ""
    for i in range(len(s) - 1, -1, -1):
        reversed += s[i]
    return reversed


def count_vowels(text):
    vowels = "aeiou"
    count = 0
    for char in text:
        if char in vowels:
            count += 1
    # Bug: doesn't count uppercase vowels
    return count


def truncate(text, max_length):
    if len(text) > max_length:
        return text[:max_length] + "..."
    return text


def is_palindrome(s):
    s = s.lower()
    # Bug: doesn't strip non-alphanumeric characters
    return s == s[::-1]


def capitalize_words(sentence):
    words = sentence.split(" ")
    result = []
    for word in words:
        result.append(word[0].upper() + word[1:])  # Bug: crashes on empty strings
    return " ".join(result)


def repeat_string(s, n):
    result = ""
    for i in range(n):  # Inefficient: should use s * n
        result = result + s
    return result


def find_longest_word(sentence):
    words = sentence.split()
    longest = ""
    for word in words:
        if len(word) >= len(longest):  # Off-by-one: >= means last longest wins
            longest = word
    return longest


def levenshtein_distance(s1, s2):
    """Calculate edit distance between two strings."""
    if len(s1) == 0:
        return len(s2)
    if len(s2) == 0:
        return len(s1)

    matrix = [[0] * (len(s2) + 1) for _ in range(len(s1) + 1)]

    for i in range(len(s1) + 1):
        matrix[i][0] = i
    for j in range(len(s2) + 1):
        matrix[0][j] = j

    for i in range(1, len(s1) + 1):
        for j in range(1, len(s2) + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            )

    return matrix[len(s1)][len(s2)]


def caesar_cipher(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord("a") if char.islower() else ord("A")
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result


def remove_duplicates(s):
    seen = []
    result = ""
    for char in s:
        if char not in seen:  # Bug: O(n) lookup, should use set
            seen.append(char)
            result += char
    return result
