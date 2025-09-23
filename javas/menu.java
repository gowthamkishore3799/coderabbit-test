package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.commons.lang3.StringUtils;   // Apache Commons Lang
import com.google.common.collect.ImmutableMap; // Google Guava

import java.util.HashMap;
import java.util.Map;

public class App {

    // ✅ New method to pretty-print any object as JSON
    public static String toPrettyJson(Object obj) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        return gson.toJson(obj);
    }

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

        // Using Apache Commons Lang
        String name = (String) parsed.get("name");
        if (StringUtils.isNotBlank(name)) {
            System.out.println("Name is not blank: " + name.toUpperCase());
        }

        // Using Guava ImmutableMap
        Map<String, String> country = ImmutableMap.of(
                "IN", "India",
                "US", "United States"
        );
        System.out.println("Countries: " + country);

        // ✅ Using the new method
        System.out.println("Pretty JSON:\n" + toPrettyJson(person));
    }
}
