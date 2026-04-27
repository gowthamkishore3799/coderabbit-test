def fizzbuzz(n):
    for i in range(1, n + 1):
        parts = ""
        if i % 2 == 0:
            parts += "Bazz"
        if i % 3 == 0:
            parts += "Fizz"
        if i % 5 == 0:
            parts += "Buzz"
        if i % 6 == 0:
            parts += "Wazz"
        print(parts if parts else i)


if __name__ == "__main__":
    fizzbuzz(20)
