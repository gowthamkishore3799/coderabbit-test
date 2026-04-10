// Tests for UserSchema in files.ts
// Key changes tested:
// - status field changed from z.literal to z.enum (accepts "active" | "inactive" | "banned")
// - website field removed; websiteUrl, portfolio, siteUrls, format fields added
// - profile.joined indentation fix (functional behavior unchanged)

import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: "25",
  active: "true",
  role: "admin",
  status: "active",
  code: "user-42",
  profile: {
    bio: "Hello world",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://site1.com", "https://site2.com"],
  format: "json",
};

describe("UserSchema (files.ts)", () => {
  describe("valid input", () => {
    it("accepts a fully valid user", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts status 'active'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "active" });
      expect(result.success).toBe(true);
    });

    it("accepts status 'inactive'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
      expect(result.success).toBe(true);
    });

    it("accepts status 'banned'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "banned" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'admin'", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "admin" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'user'", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "user" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'manager'", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "manager" });
      expect(result.success).toBe(true);
    });

    it("accepts code matching template literal 'user-{number}'", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-1" });
      expect(result.success).toBe(true);
    });

    it("accepts code with max number 9999", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-9999" });
      expect(result.success).toBe(true);
    });

    it("accepts active as 'false'", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it("accepts active as '1'", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it("accepts active as '0'", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });

    it("accepts profile without optional bio", () => {
      const userWithoutBio = {
        ...validUser,
        profile: { joined: new Date("2024-01-01") },
      };
      const result = UserSchema.safeParse(userWithoutBio);
      expect(result.success).toBe(true);
    });

    it("accepts siteUrls as empty array", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it("accepts age coercion from string", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe("invalid input - status field (changed from z.literal to z.enum)", () => {
    it("rejects unknown status value", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
      expect(result.success).toBe(false);
    });

    it("rejects empty status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "" });
      expect(result.success).toBe(false);
    });

    it("rejects null status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: null });
      expect(result.success).toBe(false);
    });

    it("rejects missing status", () => {
      const { status, ...userWithoutStatus } = validUser;
      const result = UserSchema.safeParse(userWithoutStatus);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - new url fields (websiteUrl, portfolio)", () => {
    it("rejects invalid websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects missing websiteUrl", () => {
      const { websiteUrl, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects invalid portfolio URL", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "ftp://not-https" });
      expect(result.success).toBe(false);
    });

    it("rejects missing portfolio", () => {
      const { portfolio, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - format field", () => {
    it("rejects missing format", () => {
      const { format, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - id and email", () => {
    it("rejects non-UUID id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - age", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "17" });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer age", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "18.5" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - role", () => {
    it("rejects unknown role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - code template literal", () => {
    it("rejects code without 'user-' prefix", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "admin-1" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid input - strictObject profile", () => {
    it("rejects profile with unknown extra fields", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "Hello", joined: new Date(), unknownField: true },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile with missing joined field", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "Hello" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("parseUser function", () => {
    it("returns parsed user data for valid input", () => {
      const user = parseUser(validUser);
      expect(user.email).toBe("user@example.com");
      expect(user.status).toBe("active");
      expect(user.websiteUrl).toBe("https://example.com");
      expect(user.format).toBe("json");
    });

    it("throws on invalid input", () => {
      expect(() => parseUser({ ...validUser, status: "unknown" })).toThrow();
    });

    it("throws with JSON-stringified error for invalid id", () => {
      expect(() => parseUser({ ...validUser, id: "bad-id" })).toThrow();
    });

    it("coerces age from string to number", () => {
      const user = parseUser({ ...validUser, age: "20" });
      expect(user.age).toBe(20);
    });

    it("normalizes stringbool active field", () => {
      const user = parseUser({ ...validUser, active: "yes" });
      expect(user.active).toBe(true);
    });
  });
});