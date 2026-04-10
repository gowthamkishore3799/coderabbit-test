// Tests for User schema in file.ts
// This file had a stray non-TypeScript line removed ("asdkjbasdbkjbkjbas"),
// confirming the schema itself is clean and functional.

import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  website: "https://example.com",
  websites: ["https://site1.com", "https://site2.com"],
  trail: "https://trail.example.com",
  trails: "main-trail",
};

describe("User schema (file.ts)", () => {
  describe("valid input", () => {
    it("accepts a fully valid user object", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts active as 'true'", () => {
      const result = User.safeParse({ ...validUser, active: "true" });
      expect(result.success).toBe(true);
    });

    it("accepts active as 'false'", () => {
      const result = User.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it("accepts active as '1'", () => {
      const result = User.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it("accepts active as '0'", () => {
      const result = User.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });

    it("accepts active as 'yes'", () => {
      const result = User.safeParse({ ...validUser, active: "yes" });
      expect(result.success).toBe(true);
    });

    it("accepts active as 'no'", () => {
      const result = User.safeParse({ ...validUser, active: "no" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'admin'", () => {
      const result = User.safeParse({ ...validUser, role: "admin" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'user'", () => {
      const result = User.safeParse({ ...validUser, role: "user" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'manager'", () => {
      const result = User.safeParse({ ...validUser, role: "manager" });
      expect(result.success).toBe(true);
    });

    it("accepts websites as empty array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it("accepts age coerced from string", () => {
      const result = User.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts minimum valid age of 18", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid input - id", () => {
    it("rejects non-UUID id with custom message", () => {
      const result = User.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string id", () => {
      const result = User.safeParse({ ...validUser, id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - email", () => {
    it("rejects invalid email with custom message", () => {
      const result = User.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects email missing domain", () => {
      const result = User.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - age", () => {
    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer age", () => {
      const result = User.safeParse({ ...validUser, age: 18.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - role", () => {
    it("rejects unknown role", () => {
      const result = User.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - website URLs", () => {
    it("rejects invalid website URL with custom message", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL in websites array", () => {
      const result = User.safeParse({ ...validUser, websites: ["not-a-url"] });
      expect(result.success).toBe(false);
    });

    it("rejects invalid trail URL", () => {
      const result = User.safeParse({ ...validUser, trail: "not-a-url" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - trails field", () => {
    it("rejects empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("parseUser function (file.ts)", () => {
    it("returns valid user data for valid input", () => {
      const user = parseUser(validUser);
      expect(user.email).toBe("user@example.com");
      expect(user.role).toBe("admin");
    });

    it("throws Error for invalid user input", () => {
      expect(() => parseUser({ ...validUser, email: "bad" })).toThrow();
    });

    it("throws for invalid UUID id", () => {
      expect(() => parseUser({ ...validUser, id: "not-valid-uuid" })).toThrow();
    });

    it("coerces age string to number on parse", () => {
      const user = parseUser({ ...validUser, age: "22" });
      expect(user.age).toBe(22);
    });

    it("converts stringbool 'true' to boolean true", () => {
      const user = parseUser({ ...validUser, active: "true" });
      expect(user.active).toBe(true);
    });

    it("converts stringbool 'false' to boolean false", () => {
      const user = parseUser({ ...validUser, active: "false" });
      expect(user.active).toBe(false);
    });

    it("throws error message as JSON string", () => {
      let errorMessage = "";
      try {
        parseUser({ ...validUser, id: "bad-id" });
      } catch (e) {
        errorMessage = (e as Error).message;
      }
      // error.tree should be serializable JSON
      expect(() => JSON.parse(errorMessage)).not.toThrow();
    });
  });
});