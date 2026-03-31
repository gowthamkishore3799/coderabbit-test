import java.io.*;
import java.net.*;
import java.sql.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;

public class api_client {

    // Hardcoded credentials
    private static final String DB_URL = "jdbc:mysql://prod-server:3306/mydb";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "super_secret_password_123";

    // SQL injection
    public ResultSet findUser(String username) throws SQLException {
        Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        Statement stmt = conn.createStatement();
        return stmt.executeQuery("SELECT * FROM users WHERE name = '" + username + "'");
    }

    // Weak encryption
    public byte[] encrypt(String data) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
        SecretKey key = new SecretKeySpec("12345678".getBytes(), "DES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(data.getBytes());
    }

    // SSRF vulnerability
    public String fetchUrl(String url) throws Exception {
        URL u = new URL(url);
        BufferedReader in = new BufferedReader(new InputStreamReader(u.openStream()));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) {
            response.append(line);
        }
        return response.toString();
    }

    // Resource leak - connections never closed
    public List<String> getAllUsers() throws SQLException {
        Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT name FROM users");
        List<String> users = new ArrayList<>();
        while (rs.next()) {
            users.add(rs.getString("name"));
        }
        return users;
    }

    // Insecure random for security
    public String generateSessionId() {
        Random rand = new Random();
        return String.valueOf(rand.nextLong());
    }

    // XXE vulnerability
    public void parseXml(String xml) throws Exception {
        javax.xml.parsers.DocumentBuilderFactory factory =
            javax.xml.parsers.DocumentBuilderFactory.newInstance();
        javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
        builder.parse(new org.xml.sax.InputSource(new StringReader(xml)));
    }

    // Null pointer dereference
    public String getUserEmail(Map<String, String> users, String id) {
        return users.get(id).toUpperCase();
    }

    // Thread-unsafe singleton
    private static api_client instance;

    public static api_client getInstance() {
        if (instance == null) {
            instance = new api_client();
        }
        return instance;
    }

    // Catching generic exception
    public void processData(String data) {
        try {
            int value = Integer.parseInt(data);
            System.out.println(100 / value);
        } catch (Exception e) {
            // silently swallowed
        }
    }
}
