import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// ─── helpers ──────────────────────────────────────────────────────────────────

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-42",
  profile: {
    bio: "A developer",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: "https://site1.com https://site2.com",
  format: "json",
};

// ─── UserSchema ───────────────────────────────────────────────────────────────

describe("UserSchema", () => {
  describe("valid data", () => {
    it("accepts a fully populated valid user", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts optional bio as undefined", () => {
      const user = { ...validUser, profile: { joined: new Date("2024-01-01") } };
      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it("coerces age from a numeric string", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });

    it("parses stringbool 'true' for active", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "true" });
      expect(result.success).toBe(true);
    });

    it("parses stringbool '1' for active", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it("parses stringbool 'false' for active", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it("parses stringbool 'yes' for active", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "yes" });
      expect(result.success).toBe(true);
    });

    it("parses stringbool 'no' for active", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "no" });
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

    it("accepts status 'inactive'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
      expect(result.success).toBe(true);
    });

    it("accepts status 'banned'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "banned" });
      expect(result.success).toBe(true);
    });
  });

  describe("id validation", () => {
    it("rejects a non-UUID id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("email validation", () => {
    it("rejects an invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects an email missing domain", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });
  });

  describe("age validation", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects a float age", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 25.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("role enum", () => {
    it("rejects an unknown role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superuser" });
      expect(result.success).toBe(false);
    });
  });

  describe("status enum", () => {
    it("rejects an unknown status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "pending" });
      expect(result.success).toBe(false);
    });
  });

  describe("url fields", () => {
    it("rejects an invalid websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid portfolio URL", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "ftp:/not-valid" });
      expect(result.success).toBe(false);
    });
  });

  describe("profile strictObject", () => {
    it("rejects extra keys in profile due to strictObject", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "hello", joined: new Date(), unexpectedKey: true },
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── parseUser ────────────────────────────────────────────────────────────────

describe("parseUser", () => {
  it("returns a parsed User for valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ id: "bad", email: "not-email", age: 5 })).toThrow();
  });

  it("throws an error whose message is a JSON string", () => {
    expect(() => parseUser({})).toThrowError(/[\{\[]/);
  });

  it("returns object with coerced age when age is string", () => {
    const user = parseUser({ ...validUser, age: "22" });
    expect(user.age).toBe(22);
  });
});