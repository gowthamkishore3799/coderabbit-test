import hashlib
import os
import pickle
import subprocess

# SQL Injection vulnerability
def login(username, password, db_connection):
    query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'"
    cursor = db_connection.execute(query)
    user = cursor.fetchone()
    if user:
        return {"status": "success", "token": hashlib.md5(password.encode()).hexdigest()}
    return None


# Command injection
def ping_server(host):
    result = os.system("ping -c 1 " + host)
    return result


# Insecure deserialization
def load_session(data):
    return pickle.loads(data)


# Hardcoded credentials
DB_PASSWORD = "admin123"
API_KEY = "sk-live-abc123xyz789secretkey"
AWS_SECRET = "AKIAIOSFODNN7EXAMPLE"


# Race condition - no locking
balance = 0

def withdraw(amount):
    global balance
    if balance >= amount:
        balance -= amount
        return True
    return False


# Path traversal
def read_user_file(filename):
    with open("/var/data/" + filename, "r") as f:
        return f.read()


# Broken comparison
def verify_token(token, expected):
    if token == expected:
        return True
    else:
        return False


def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()


# Eval injection
def calculate(expression):
    return eval(expression)


# Subprocess shell injection
def run_report(report_name):
    subprocess.call("generate_report " + report_name, shell=True)
