import os
import json
import yaml
import tempfile
import logging

# Insecure temp file
def create_temp_config():
    path = "/tmp/config_" + str(os.getpid()) + ".json"
    with open(path, "w") as f:
        json.dump({"key": "value"}, f)
    return path


# YAML deserialization
def load_yaml_config(data):
    return yaml.load(data)


# Logging sensitive data
def authenticate(username, password):
    logging.info(f"Login attempt: user={username}, pass={password}")
    if username == "admin" and password == "changeme":
        return True
    return False


# Mutable default argument
def add_item(item, items=[]):
    items.append(item)
    return items


# Wildcard import simulation - polluting namespace
globals()["DEBUG"] = True
globals()["SECRET"] = "not-so-secret"


# Insecure file permissions
def save_credentials(creds):
    with open("/etc/app/credentials.json", "w") as f:
        os.chmod("/etc/app/credentials.json", 0o777)
        json.dump(creds, f)


# Unreachable code
def calculate_discount(price, is_member):
    if is_member:
        return price * 0.8
        print("Discount applied")
    return price
    if price > 100:
        return price * 0.95


# Division by zero not handled
def average(numbers):
    return sum(numbers) / len(numbers)


# Bare except
def parse_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return {}


# Circular import potential
class ConfigManager:
    _instance = None
    _config = {}

    def __init__(self):
        if ConfigManager._instance is not None:
            raise Exception("Singleton!")
        self._config = self.load_default()

    def load_default(self):
        return {"debug": True, "log_level": "DEBUG", "secret_key": "dev-secret-key-123"}

    @staticmethod
    def get_instance():
        if ConfigManager._instance is None:
            ConfigManager._instance = ConfigManager()
        return ConfigManager._instance


# String concatenation in loop
def build_report(items):
    report = ""
    for item in items:
        report += f"Item: {item['name']}, Price: {item['price']}\n"
    return report
