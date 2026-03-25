<?php

// SQL injection
function getUser($id) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $result = $conn->query("SELECT * FROM users WHERE id = $id");
    return $result->fetch_assoc();
}

// XSS vulnerability
function displayProfile($user) {
    echo "<h1>Welcome, " . $user['name'] . "</h1>";
    echo "<p>Bio: " . $user['bio'] . "</p>";
    echo "<img src='" . $user['avatar'] . "'>";
}

// File upload without validation
function uploadAvatar() {
    $target = "uploads/" . $_FILES["avatar"]["name"];
    move_uploaded_file($_FILES["avatar"]["tmp_name"], $target);
    return $target;
}

// Insecure session handling
function loginUser($username, $password) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $result = $conn->query("SELECT * FROM users WHERE username = '$username' AND password = '$password'");
    if ($result->num_rows > 0) {
        $_SESSION['user'] = $username;
        $_SESSION['is_admin'] = $result->fetch_assoc()['is_admin'];
        setcookie("remember_me", $username, time() + 86400 * 30, "/");
        return true;
    }
    return false;
}

// Path traversal
function getDocument($filename) {
    return file_get_contents("documents/" . $filename);
}

// Insecure direct object reference
function deleteUser($userId) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $conn->query("DELETE FROM users WHERE id = $userId");
    return true;
}

// Open redirect
function redirectAfterLogin($url) {
    header("Location: " . $url);
    exit();
}

// Sensitive data exposure
function getUserData($id) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $result = $conn->query("SELECT * FROM users WHERE id = $id");
    $user = $result->fetch_assoc();
    return json_encode($user); // exposes password hash, SSN, etc.
}

// Weak password hashing
function registerUser($username, $password) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $hash = md5($password);
    $conn->query("INSERT INTO users (username, password) VALUES ('$username', '$hash')");
    return true;
}

// CSRF vulnerability - no token check
function updateEmail($newEmail) {
    $conn = new mysqli("localhost", "root", "password123", "mydb");
    $userId = $_SESSION['user_id'];
    $conn->query("UPDATE users SET email = '$newEmail' WHERE id = $userId");
    return true;
}

// Information disclosure
function handleError($e) {
    echo "<pre>";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString();
    echo "</pre>";
}

?>
