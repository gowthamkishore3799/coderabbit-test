import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// ─── helpers ──────────────────────────────────────────────────────────────────

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "alice@example.com",
  age: 20,
  active: "true",
  role: "user" as const,
  website: "https://alice.dev",
  websites: ["https://alice.dev", "https://blog.alice.dev"],
  trail: "https://trail.example.com",
  trails: "main-trail",
};

// ─── User schema ──────────────────────────────────────────────────────────────

describe("User schema (fools/file.ts)", () => {
  describe("valid data", () => {
    it("accepts a fully populated valid user", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts an empty websites array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it("coerces age from a numeric string", () => {
      const result = User.safeParse({ ...validUser, age: "21" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(21);
    });

    it("accepts age exactly 18", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("parses stringbool '0' for active as false", () => {
      const result = User.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });

    it("parses stringbool 'no' for active", () => {
      const result = User.safeParse({ ...validUser, active: "no" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'admin'", () => {
      const result = User.safeParse({ ...validUser, role: "admin" });
      expect(result.success).toBe(true);
    });

    it("accepts role 'manager'", () => {
      const result = User.safeParse({ ...validUser, role: "manager" });
      expect(result.success).toBe(true);
    });

    it("accepts multiple website URLs in websites array", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://a.com", "https://b.com", "https://c.com"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("id validation (string.uuid)", () => {
    it("rejects a non-UUID id", () => {
      const result = User.safeParse({ ...validUser, id: "abc-123" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing id", () => {
      const { id: _, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });
  });

  describe("email validation (string.email)", () => {
    it("rejects an email without @", () => {
      const result = User.safeParse({ ...validUser, email: "invalidemail" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty email", () => {
      const result = User.safeParse({ ...validUser, email: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("age validation", () => {
    it("rejects age 17 (below minimum)", () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects a non-integer age", () => {
      const result = User.safeParse({ ...validUser, age: 18.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("role enum", () => {
    it("rejects an unlisted role value", () => {
      const result = User.safeParse({ ...validUser, role: "guest" });
      expect(result.success).toBe(false);
    });
  });

  describe("url fields", () => {
    it("rejects an invalid website URL", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid URL inside websites array", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid trail URL", () => {
      const result = User.safeParse({ ...validUser, trail: "not-a-url" });
      expect(result.success).toBe(false);
    });
  });

  describe("trails field (non-empty string)", () => {
    it("rejects an empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
    });

    it("accepts a non-empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "some-trail" });
      expect(result.success).toBe(true);
    });
  });
});

// ─── parseUser (fools/file.ts) ────────────────────────────────────────────────

describe("parseUser (fools/file.ts)", () => {
  it("returns a parsed User for valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.role).toBe("user");
  });

  it("throws for missing required fields", () => {
    expect(() => parseUser({})).toThrow();
  });

  it("throws for invalid email", () => {
    expect(() => parseUser({ ...validUser, email: "bad" })).toThrow();
  });

  it("throws for underage user", () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it("throws an Error instance with message content", () => {
    let caughtError: unknown;
    try {
      parseUser({ ...validUser, id: "not-uuid" });
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(Error);
  });
});