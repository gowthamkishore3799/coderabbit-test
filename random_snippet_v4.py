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
        if i % 10 == 0:
            parts += "Tazz"
        if i % 15 == 0:
            parts += "Pazz"
        if i % 25 == 0:
            parts += "Quazz"
        print(parts if parts else i)


if __name__ == "__main__":
    fizzbuzz(50)
