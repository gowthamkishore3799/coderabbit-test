import java.util.*;
import java.util.stream.Collectors;

/**
 * String manipulation utilities for common text processing tasks.
 */
public class StringUtils {

    /**
     * Converts a string to title case (first letter of each word capitalized).
     */
    public static String toTitleCase(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        return Arrays.stream(input.split("\\s+"))
            .map(word -> {
                if (word.isEmpty()) return word;
                return Character.toUpperCase(word.charAt(0)) + word.substring(1).toLowerCase();
            })
            .collect(Collectors.joining(" "));
    }

    /**
     * Converts a camelCase or PascalCase string to snake_case.
     */
    public static String toSnakeCase(String input) {
        if (input == null) return null;

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) result.append('_');
                result.append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    /**
     * Truncates a string to the specified length, appending an ellipsis if truncated.
     */
    public static String truncate(String input, int maxLength) {
        if (input == null || input.length() <= maxLength) {
            return input;
        }
        if (maxLength <= 3) {
            return input.substring(0, maxLength);
        }
        return input.substring(0, maxLength - 3) + "...";
    }

    /**
     * Counts occurrences of a substring within a string.
     */
    public static int countOccurrences(String text, String substring) {
        if (text == null || substring == null || substring.isEmpty()) {
            return 0;
        }

        int count = 0;
        int index = 0;
        while ((index = text.indexOf(substring, index)) != -1) {
            count++;
            index += substring.length();
        }
        return count;
    }

    /**
     * Reverses words in a sentence while preserving word order of characters.
     */
    public static String reverseWords(String input) {
        if (input == null) return null;

        String[] words = input.trim().split("\\s+");
        List<String> wordList = Arrays.asList(words);
        Collections.reverse(wordList);
        return String.join(" ", wordList);
    }

    /**
     * Checks if a string is a palindrome (case-insensitive, ignoring non-alphanumeric chars).
     */
    public static boolean isPalindrome(String input) {
        if (input == null) return false;

        String cleaned = input.toLowerCase().replaceAll("[^a-z0-9]", "");
        String reversed = new StringBuilder(cleaned).reverse().toString();
        return cleaned.equals(reversed);
    }

    /**
     * Generates a simple slug from text (URL-friendly string).
     */
    public static String slugify(String input) {
        if (input == null) return null;

        return input.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    }

    /**
     * Masks sensitive data, showing only the last N characters.
     */
    public static String mask(String input, int visibleChars) {
        if (input == null) return null;
        if (input.length() <= visibleChars) return input;

        int maskLength = input.length() - visibleChars;
        return "*".repeat(maskLength) + input.substring(maskLength);
    }

    public static void main(String[] args) {
        System.out.println("Title Case: " + toTitleCase("hello world from java"));
        System.out.println("Snake Case: " + toSnakeCase("myVariableName"));
        System.out.println("Truncate: " + truncate("This is a long sentence that needs trimming", 20));
        System.out.println("Count: " + countOccurrences("banana", "an"));
        System.out.println("Reverse Words: " + reverseWords("Hello World Foo"));
        System.out.println("Palindrome: " + isPalindrome("A man a plan a canal Panama"));
        System.out.println("Slug: " + slugify("Hello World! This is a Test"));
        System.out.println("Mask: " + mask("4111111111111111", 4));
    }
}
