package com.example.demo;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.List;
import java.util.ArrayList;

/**
 * SpringBeanManager demonstrates usage of Spring Framework for dependency injection,
 * bean management, and application context configuration.
 */
public class SpringBeanManager {

    public static void main(String[] args) {
        // Create Spring application context
        AnnotationConfigApplicationContext context =
            new AnnotationConfigApplicationContext(AppConfig.class);

        // Get beans from context
        UserService userService = context.getBean(UserService.class);
        userService.displayUsers();

        NotificationService notificationService = context.getBean(NotificationService.class);
        notificationService.sendNotification("System started successfully");

        // Close context
        context.close();
    }

    /**
     * Spring Configuration class
     */
    @Configuration
    @ComponentScan(basePackages = "com.example.demo")
    public static class AppConfig {

        @Bean
        public DatabaseConfig databaseConfig() {
            DatabaseConfig config = new DatabaseConfig();
            config.setUrl("jdbc:postgresql://localhost:5432/mydb");
            config.setUsername("admin");
            config.setMaxConnections(10);
            return config;
        }

        @Bean
        public CacheManager cacheManager() {
            return new CacheManager();
        }
    }

    /**
     * Configuration POJO
     */
    public static class DatabaseConfig {
        private String url;
        private String username;
        private int maxConnections;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public int getMaxConnections() {
            return maxConnections;
        }

        public void setMaxConnections(int maxConnections) {
            this.maxConnections = maxConnections;
        }

        @Override
        public String toString() {
            return "DatabaseConfig{url='" + url + "', username='" + username +
                   "', maxConnections=" + maxConnections + '}';
        }
    }

    /**
     * Repository component
     */
    @Component
    public static class UserRepository {

        @Autowired
        private DatabaseConfig databaseConfig;

        @PostConstruct
        public void init() {
            System.out.println("UserRepository initialized with: " + databaseConfig);
        }

        public List<String> findAllUsers() {
            List<String> users = new ArrayList<>();
            users.add("Alice");
            users.add("Bob");
            users.add("Charlie");
            return users;
        }

        public void saveUser(String username) {
            System.out.println("Saving user: " + username);
        }

        @PreDestroy
        public void cleanup() {
            System.out.println("UserRepository cleanup");
        }
    }

    /**
     * Service component with dependency injection
     */
    @Service
    public static class UserService {

        private final UserRepository userRepository;
        private final CacheManager cacheManager;

        @Autowired
        public UserService(UserRepository userRepository, CacheManager cacheManager) {
            this.userRepository = userRepository;
            this.cacheManager = cacheManager;
            System.out.println("UserService created with dependencies");
        }

        public void displayUsers() {
            List<String> users = userRepository.findAllUsers();
            System.out.println("All users: " + users);
            cacheManager.put("users", users);
        }

        public void createUser(String username) {
            userRepository.saveUser(username);
            cacheManager.invalidate("users");
        }
    }

    /**
     * Notification service component
     */
    @Service
    public static class NotificationService {

        private final CacheManager cacheManager;

        @Autowired
        public NotificationService(CacheManager cacheManager) {
            this.cacheManager = cacheManager;
        }

        public void sendNotification(String message) {
            System.out.println("Notification: " + message);
            cacheManager.put("lastNotification", message);
        }

        public String getLastNotification() {
            return (String) cacheManager.get("lastNotification");
        }
    }

    /**
     * Cache manager bean
     */
    public static class CacheManager {

        private final java.util.Map<String, Object> cache = new java.util.HashMap<>();

        @PostConstruct
        public void init() {
            System.out.println("CacheManager initialized");
        }

        public void put(String key, Object value) {
            cache.put(key, value);
            System.out.println("Cached: " + key);
        }

        public Object get(String key) {
            return cache.get(key);
        }

        public void invalidate(String key) {
            cache.remove(key);
            System.out.println("Cache invalidated: " + key);
        }

        @PreDestroy
        public void cleanup() {
            cache.clear();
            System.out.println("CacheManager cleanup");
        }
    }
}
