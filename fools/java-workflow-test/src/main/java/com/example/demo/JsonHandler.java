package com.example.demo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

/**
 * JsonHandler demonstrates usage of Jackson library for JSON serialization,
 * deserialization, and manipulation.
 */
public class JsonHandler {

    private final ObjectMapper objectMapper;

    public JsonHandler() {
        this.objectMapper = new ObjectMapper();
        // Register JavaTimeModule for Java 8 date/time types
        this.objectMapper.registerModule(new JavaTimeModule());
        // Configure pretty printing
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        // Disable writing dates as timestamps
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public static void main(String[] args) {
        JsonHandler handler = new JsonHandler();
        handler.demonstrateJsonOperations();
    }

    public void demonstrateJsonOperations() {
        try {
            // Create a user object
            User user = new User("john.doe", "john@example.com", 30, LocalDateTime.now());

            // Serialize object to JSON string
            String jsonString = objectMapper.writeValueAsString(user);
            System.out.println("Serialized JSON:");
            System.out.println(jsonString);

            // Deserialize JSON string to object
            User deserializedUser = objectMapper.readValue(jsonString, User.class);
            System.out.println("\nDeserialized User: " + deserializedUser);

            // Working with JSON tree model
            JsonNode rootNode = objectMapper.readTree(jsonString);
            String username = rootNode.get("username").asText();
            System.out.println("\nUsername from JSON tree: " + username);

            // Create JSON programmatically
            ObjectNode personNode = objectMapper.createObjectNode();
            personNode.put("name", "Jane Smith");
            personNode.put("age", 28);
            personNode.put("active", true);

            ArrayNode hobbiesArray = objectMapper.createArrayNode();
            hobbiesArray.add("reading");
            hobbiesArray.add("coding");
            hobbiesArray.add("hiking");
            personNode.set("hobbies", hobbiesArray);

            System.out.println("\nProgrammatically created JSON:");
            System.out.println(objectMapper.writeValueAsString(personNode));

            // Convert JSON to Map
            Map<String, Object> userMap = objectMapper.convertValue(user, Map.class);
            System.out.println("\nUser as Map: " + userMap);

            // Convert List to JSON
            List<User> users = new ArrayList<>();
            users.add(new User("alice", "alice@example.com", 25, LocalDateTime.now()));
            users.add(new User("bob", "bob@example.com", 35, LocalDateTime.now()));

            String usersJson = objectMapper.writeValueAsString(users);
            System.out.println("\nUsers list as JSON:");
            System.out.println(usersJson);

        } catch (JsonProcessingException e) {
            System.err.println("JSON processing error: " + e.getMessage());
        }
    }

    public <T> T readFromFile(File file, Class<T> clazz) throws IOException {
        return objectMapper.readValue(file, clazz);
    }

    public void writeToFile(File file, Object object) throws IOException {
        objectMapper.writeValue(file, object);
    }

    public String toJson(Object object) throws JsonProcessingException {
        return objectMapper.writeValueAsString(object);
    }

    public <T> T fromJson(String json, Class<T> clazz) throws JsonProcessingException {
        return objectMapper.readValue(json, clazz);
    }

    // Inner class for demonstration
    public static class User {
        private String username;
        private String email;
        private int age;
        private LocalDateTime registeredAt;

        public User() {
            // Default constructor for Jackson
        }

        public User(String username, String email, int age, LocalDateTime registeredAt) {
            this.username = username;
            this.email = email;
            this.age = age;
            this.registeredAt = registeredAt;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public LocalDateTime getRegisteredAt() {
            return registeredAt;
        }

        public void setRegisteredAt(LocalDateTime registeredAt) {
            this.registeredAt = registeredAt;
        }

        @Override
        public String toString() {
            return "User{username='" + username + "', email='" + email + "', age=" + age + ", registeredAt=" + registeredAt + '}';
        }
    }
}
