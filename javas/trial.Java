package com.example;

import com.google.gson.Gson;
import java.util.HashMap;
import java.util.Map;

public class App {
    public static void main(String[] args) {
        // Using external Gson library
        Gson gson = new Gson();

        Map<String, Object> person = new HashMap<>();
        person.put("name", "Gowtham");
        person.put("age", 25);

        // Convert object → JSON
        String json = gson.toJson(person);
        System.out.println("Serialized JSON: " + json);

        // Convert JSON → object
        @SuppressWarnings("unchecked")
        Map<String, Object> parsed = gson.fromJson(json, Map.class);
        System.out.println("Parsed back: " + parsed);
    }
}
