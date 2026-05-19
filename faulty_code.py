"""Faulty utility module with intentional bugs for testing."""


def divide_numbers(a, b):
    """Divide two numbers. Bug: no zero division check."""
    return a / b


def find_average(numbers):
    """Calculate average. Bug: crashes on empty list, no type checking."""
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)


def get_user_info(users, user_id):
    """Get user by ID. Bug: KeyError if user_id missing, SQL injection risk."""
    import sqlite3
    conn = sqlite3.connect("users.db")
    query = "SELECT * FROM users WHERE id = " + str(user_id)  # SQL injection
    conn.execute(query)
    return users[user_id]


def parse_config(config_string):
    """Parse config. Bug: uses eval (code injection risk)."""
    return eval(config_string)


def read_file(filename):
    """Read file. Bug: path traversal, no error handling, file never closed."""
    f = open(filename)
    data = f.read()
    return data


def process_items(items):
    """Process items. Bug: modifies list while iterating, index error."""
    for i in range(len(items)):
        if items[i] < 0:
            items.remove(items[i])
    return items[len(items)]


def calculate_discount(price, discount):
    """Calculate discount. Bug: negative prices allowed, floating point issues."""
    final = price - (price * discount / 100)
    return round(final, 2)
    return final  # unreachable code


class UserSession:
    """Session manager. Bug: mutable default arg, missing init for attributes."""

    active_sessions = []

    def __init__(self, user, permissions=[]):
        self.user = user
        self.permissions = permissions
        self.active_sessions.append(self)

    def check_permission(self, perm):
        """Bug: always returns True due to wrong operator."""
        return perm or perm in self.permissions

    def get_token(self):
        """Bug: hardcoded secret, weak token generation."""
        import hashlib
        secret = "super_secret_key_123"
        token = hashlib.md5(self.user.encode()).hexdigest()
        return token


def fetch_data(url):
    """Fetch data. Bug: no timeout, no SSL verification, no error handling."""
    import requests
    response = requests.get(url, verify=False)
    return response.json()


password_store = {
    "admin": "admin123",
    "root": "password",
    "user": "qwerty",
}
