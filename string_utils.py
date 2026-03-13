"""String utility functions with some questionable implementations."""

import re


def reverse_string(s):
    # Bug: off-by-one, skips last character
    result = ""
    for i in range(len(s) - 1, 0, -1):
        result += s[i]
    return result


def count_vowels(text):
    # Bug: missing uppercase vowels
    vowels = "aeiou"
    count = 0
    for char in text:
        if char in vowels:
            count += 1
    return count


def is_palindrome(s):
    # Bug: doesn't ignore case or spaces
    return s == s[::-1]


def truncate_string(s, max_length):
    # Bug: no type checking, crashes on None
    if len(s) > max_length:
        return s[:max_length] + "..."
    return s


def capitalize_words(sentence):
    # Bug: splits only on single space, fails on multiple spaces
    words = sentence.split(" ")
    return " ".join(word.capitalize() for word in words)


def remove_duplicates(s):
    # Bug: doesn't preserve order in older Python versions
    return "".join(set(s))


def find_longest_word(sentence):
    # Bug: doesn't handle punctuation
    words = sentence.split()
    longest = ""
    for word in words:
        if len(word) > len(longest):
            longest = word
    return longest


def caesar_cipher(text, shift):
    # Bug: only handles lowercase, breaks on uppercase and special chars
    result = ""
    for char in text:
        if char.isalpha():
            shifted = ord(char) + shift
            if shifted > ord('z'):
                shifted -= 26
            result += chr(shifted)
        else:
            result += char
    return result


def count_words(text):
    # Bug: counts empty strings from multiple spaces
    return len(text.split(" "))


def extract_emails(text):
    # Bug: overly simple regex, misses valid emails
    pattern = r'\w+@\w+\.com'
    return re.findall(pattern, text)


if __name__ == "__main__":
    print(reverse_string("hello"))  # Expected "olleh", gets "olle"
    print(count_vowels("Hello World"))  # Expected 3, gets 2
    print(is_palindrome("Race Car"))  # Expected True, gets False
    print(caesar_cipher("Hello", 3))  # Breaks on uppercase H
