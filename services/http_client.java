package services;

import java.util.*;
import java.util.concurrent.*;
import java.net.http.*;
import java.net.URI;

/**
 * HTTP client wrapper with retry logic and connection pooling issues.
 */
public class http_client {  // Bug: class name should be PascalCase

    private int timeout = 30000;
    private int maxRetries = 3;
    private Map<String, String> defaultHeaders;
    private List<String> requestLog;  // Bug: unbounded list, memory leak

    public http_client() {
        this.defaultHeaders = new HashMap<>();
        this.requestLog = new ArrayList<>();
        this.defaultHeaders.put("Content-Type", "application/json");
        this.defaultHeaders.put("User-Agent", "CustomClient/1.0");
    }

    public String get(String url) throws Exception {
        return sendRequest("GET", url, null);
    }

    public String post(String url, String body) throws Exception {
        return sendRequest("POST", url, body);
    }

    public String put(String url, String body) throws Exception {
        return sendRequest("PUT", url, body);
    }

    public String delete(String url) throws Exception {
        return sendRequest("DELETE", url, null);
    }

    private String sendRequest(String method, String url, String body) throws Exception {
        requestLog.add(method + " " + url + " at " + System.currentTimeMillis());

        Exception lastException = null;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                HttpRequest.Builder builder = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(java.time.Duration.ofMillis(timeout));

                for (Map.Entry<String, String> header : defaultHeaders.entrySet()) {
                    builder.header(header.getKey(), header.getValue());
                }

                switch (method) {
                    case "GET":
                        builder.GET();
                        break;
                    case "POST":
                        builder.POST(HttpRequest.BodyPublishers.ofString(body));
                        break;
                    case "PUT":
                        builder.PUT(HttpRequest.BodyPublishers.ofString(body));
                        break;
                    case "DELETE":
                        builder.DELETE();
                        break;
                }

                HttpClient client = HttpClient.newHttpClient(); // Bug: creates new client per request
                HttpResponse<String> response = client.send(builder.build(),
                        HttpResponse.BodyHandlers.ofString());

                int statusCode = response.statusCode();
                if (statusCode >= 200 && statusCode < 300) {
                    return response.body();
                } else if (statusCode >= 500) {
                    throw new Exception("Server error: " + statusCode);
                } else {
                    // Bug: doesn't retry on 429 Too Many Requests
                    return response.body();
                }

            } catch (Exception e) {
                lastException = e;
                // Bug: no exponential backoff
                Thread.sleep(1000);
            }
        }

        throw lastException;
    }

    public void setHeader(String key, String value) {
        defaultHeaders.put(key, value);
    }

    public void setTimeout(int milliseconds) {
        this.timeout = milliseconds;
    }

    public List<String> getRequestLog() {
        return requestLog;  // Bug: returns mutable internal list
    }

    public void clearLog() {
        requestLog.clear();
    }

    // Response parser
    public static Map<String, Object> parseJsonResponse(String json) {
        // Bug: naive JSON parsing, doesn't handle nested objects or arrays properly
        Map<String, Object> result = new HashMap<>();
        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1);
            String[] pairs = json.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":", 2);
                if (keyValue.length == 2) {
                    String key = keyValue[0].trim().replace("\"", "");
                    String value = keyValue[1].trim().replace("\"", "");
                    result.put(key, value);
                }
            }
        }
        return result;
    }
}
