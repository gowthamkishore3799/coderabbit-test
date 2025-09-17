package com.example;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.*;

public class App {

    public static void main(String[] args) throws IOException {
        String filePath = "build.gradle"; // adjust if needed
        String content = Files.readString(Paths.get(filePath));

        Map<String, String> dependencies = new LinkedHashMap<>();

        Pattern pattern = Pattern.compile("^(implementation|api|compile)\\s*[\"'(]([^\"'()]{1,200})[\"')]");
        for (String line : content.split("\\R")) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty() || trimmedLine.startsWith("//") || trimmedLine.startsWith("/*")) {
                continue;
            }

            Matcher matcher = pattern.matcher(trimmedLine);
            if (matcher.find()) {
                String depString = matcher.group(2); // e.g. com.google.code.gson:gson:2.11.0
                String packageName = depString.split(":")[0];
                if (!packageName.isEmpty() && packageName.length() < 100) {
                    dependencies.put(packageName, "");
                }
            }
        }

        System.out.println("Parsed dependencies:");
        dependencies.keySet().forEach(System.out::println);
    }
}
