package com.example.demo;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.io.FileUtils;
import com.google.common.collect.Lists;
import com.google.common.collect.ImmutableMap;
import com.google.common.base.Joiner;
import com.google.common.hash.Hashing;
import com.google.common.io.Files;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * DataProcessor demonstrates usage of Apache Commons and Google Guava libraries
 * for string manipulation, collection operations, and file handling.
 */
public class DataProcessor {

    public static void main(String[] args) {
        DataProcessor processor = new DataProcessor();
        processor.processData();
    }

    public void processData() {
        // Apache Commons Lang - String operations
        String input = "  hello world  ";
        String capitalized = StringUtils.capitalize(input.trim());
        System.out.println("Capitalized: " + capitalized);

        // Check if string is blank
        boolean isBlank = StringUtils.isBlank(input);
        System.out.println("Is blank: " + isBlank);

        // Apache Commons Collections - Collection utilities
        List<String> list1 = Lists.newArrayList("apple", "banana", "cherry");
        List<String> list2 = Lists.newArrayList("banana", "cherry", "date");

        List<String> intersection = (List<String>) CollectionUtils.intersection(list1, list2);
        System.out.println("Intersection: " + intersection);

        // Google Guava - Immutable collections
        Map<String, Integer> immutableMap = ImmutableMap.<String, Integer>builder()
            .put("one", 1)
            .put("two", 2)
            .put("three", 3)
            .build();
        System.out.println("Immutable map: " + immutableMap);

        // Google Guava - List partitioning
        List<Integer> numbers = Lists.newArrayList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        List<List<Integer>> partitions = Lists.partition(numbers, 3);
        System.out.println("Partitions: " + partitions);

        // Google Guava - String joining
        String joined = Joiner.on(", ").join(list1);
        System.out.println("Joined string: " + joined);

        // Google Guava - Hashing
        String text = "Hello, World!";
        String hash = Hashing.sha256()
            .hashString(text, StandardCharsets.UTF_8)
            .toString();
        System.out.println("SHA-256 hash: " + hash);

        // Apache Commons IO - File operations
        try {
            File tempFile = File.createTempFile("demo", ".txt");
            FileUtils.writeStringToFile(tempFile, "Sample data", StandardCharsets.UTF_8);
            String content = FileUtils.readFileToString(tempFile, StandardCharsets.UTF_8);
            System.out.println("File content: " + content);
            FileUtils.deleteQuietly(tempFile);
        } catch (IOException e) {
            System.err.println("File operation failed: " + e.getMessage());
        }
    }

    public String processString(String input) {
        if (StringUtils.isEmpty(input)) {
            return "";
        }
        return StringUtils.upperCase(StringUtils.trim(input));
    }

    public List<String> filterNonEmpty(List<String> items) {
        return items.stream()
            .filter(StringUtils::isNotBlank)
            .collect(com.google.common.collect.ImmutableList.toImmutableList());
    }
}
