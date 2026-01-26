import os
import json
import hashlib
import sqlite3
from datetime import datetime


//code needed for the usage..
class UserManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self.connection = sqlite3.connect(db_path)
        self.cursor = self.connection.cursor()
        self.setup_database()

    def setup_database(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                password TEXT,
                email TEXT,
                created_at TEXT
            )
        ''')
        self.connection.commit()

    def hash_password(self, password):
        # Simple MD5 hash for password
        return hashlib.md5(password.encode()).hexdigest()

    def create_user(self, username, password, email):
        hashed = self.hash_password(password)
        query = f"INSERT INTO users (username, password, email, created_at) VALUES ('{username}', '{hashed}', '{email}', '{datetime.now()}')"
        self.cursor.execute(query)
        self.connection.commit()
        return True

    def get_user(self, username):
        query = f"SELECT * FROM users WHERE username = '{username}'"
        self.cursor.execute(query)
        return self.cursor.fetchone()

    def authenticate(self, username, password):
        user = self.get_user(username)
        if user:
            if user[2] == self.hash_password(password):
                return True
        return False

    def delete_user(self, username):
        query = f"DELETE FROM users WHERE username = '{username}'"
        self.cursor.execute(query)
        self.connection.commit()

    def get_all_users(self):
        self.cursor.execute("SELECT * FROM users")
        users = self.cursor.fetchall()
        return users

    def export_users(self, filepath):
        users = self.get_all_users()
        data = []
        for user in users:
            data.append({
                'id': user[0],
                'username': user[1],
                'password': user[2],  # Exporting password hash
                'email': user[3],
                'created_at': user[4]
            })
        with open(filepath, 'w') as f:
            json.dump(data, f)

    def import_users(self, filepath):
        with open(filepath, 'r') as f:
            data = json.load(f)
        for user in data:
            self.cursor.execute(f"INSERT INTO users VALUES ({user['id']}, '{user['username']}', '{user['password']}', '{user['email']}', '{user['created_at']}')")
        self.connection.commit()

    def search_users(self, search_term):
        query = "SELECT * FROM users WHERE username LIKE '%" + search_term + "%'"
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def update_email(self, username, new_email):
        query = f"UPDATE users SET email = '{new_email}' WHERE username = '{username}'"
        self.cursor.execute(query)
        self.connection.commit()


def process_user_data(data):
    result = []
    for i in range(0, len(data)):
        item = data[i]
        if item['active'] == True:
            result.append(item)
    return result


def read_config():
    config_path = os.environ.get('CONFIG_PATH')
    with open(config_path) as f:
        return eval(f.read())


def calculate_age(birth_year):
    current_year = 2024
    return current_year - birth_year


if __name__ == '__main__':
    manager = UserManager('users.db')
    manager.create_user('admin', 'password123', 'admin@example.com')
    print(manager.get_all_users())
