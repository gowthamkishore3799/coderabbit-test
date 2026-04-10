// Tests for fools/file.ts - User schema (Zod v4)
// Changed in this PR: removed stray code line "asdkjbasdbkjbkjbas"; schema functionality unchanged
import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "user" as const,
  website: "https://example.com",
  websites: ["https://example.com", "https://blog.example.com"],
  trail: "https://trail.example.com",
  trails: "some text here",
};

describe("User schema (file.ts)", () => {
  describe("id field (z.string().uuid)", () => {
    it("accepts a valid UUID", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("rejects a non-UUID id", () => {
      const result = User.safeParse({ ...validUser, id: "123" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === "id")).toBe(true);
      }
    });

    it("rejects missing id", () => {
      const { id: _, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("email field (z.string().email)", () => {
    it("accepts valid email address", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = User.safeParse({ ...validUser, email: "invalid" });
      expect(result.success).toBe(false);
    });

    it("rejects email without TLD", () => {
      const result = User.safeParse({ ...validUser, email: "user@domain" });
      expect(result.success).toBe(false);
    });
  });

  describe("age field (z.coerce.number with min 18)", () => {
    it("coerces string '20' to number 20", () => {
      const result = User.safeParse({ ...validUser, age: "20" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(20);
      }
    });

    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validUser, age: 16 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects age above max integer limit (non-integer)", () => {
      const result = User.safeParse({ ...validUser, age: 20.9 });
      expect(result.success).toBe(false);
    });
  });

  describe("active field (z.stringbool)", () => {
    it("accepts 'true' string", () => {
      const result = User.safeParse({ ...validUser, active: "true" });
      expect(result.success).toBe(true);
    });

    it("accepts 'yes' string", () => {
      const result = User.safeParse({ ...validUser, active: "yes" });
      expect(result.success).toBe(true);
    });

    it("accepts '1' string", () => {
      const result = User.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it("accepts 'false' string", () => {
      const result = User.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it("accepts 'no' string", () => {
      const result = User.safeParse({ ...validUser, active: "no" });
      expect(result.success).toBe(true);
    });

    it("accepts '0' string", () => {
      const result = User.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });
  });

  describe("role field (z.enum)", () => {
    it("accepts 'admin'", () => {
      expect(User.safeParse({ ...validUser, role: "admin" }).success).toBe(true);
    });

    it("accepts 'user'", () => {
      expect(User.safeParse({ ...validUser, role: "user" }).success).toBe(true);
    });

    it("accepts 'manager'", () => {
      expect(User.safeParse({ ...validUser, role: "manager" }).success).toBe(true);
    });

    it("rejects an unknown role", () => {
      const result = User.safeParse({ ...validUser, role: "guest" });
      expect(result.success).toBe(false);
    });
  });

  describe("website field (z.url)", () => {
    it("accepts a valid URL", () => {
      const result = User.safeParse({ ...validUser, website: "https://site.com" });
      expect(result.success).toBe(true);
    });

    it("rejects a non-URL string", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
    });
  });

  describe("websites field (array of z.url)", () => {
    it("accepts an array of valid URLs", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://one.com", "https://two.com"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects array containing an invalid URL", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://valid.com", "bad-url"],
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty websites array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });
  });

  describe("trails field (z.string().min(1))", () => {
    it("accepts a non-empty string", () => {
      const result = User.safeParse({ ...validUser, trails: "some text" });
      expect(result.success).toBe(true);
    });

    it("rejects an empty string", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser (file.ts)", () => {
  it("returns validated data for a valid user", () => {
    const result = parseUser(validUser);
    expect(result.id).toBe(validUser.id);
    expect(result.email).toBe(validUser.email);
    expect(result.age).toBe(25);
  });

  it("throws an Error for invalid input", () => {
    expect(() => parseUser({ ...validUser, id: "not-uuid" })).toThrow(Error);
  });

  it("throws with a JSON message for invalid input", () => {
    try {
      parseUser({ ...validUser, email: "bad" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });

  it("throws for null input", () => {
    expect(() => parseUser(null)).toThrow();
  });

  it("throws for empty object", () => {
    expect(() => parseUser({})).toThrow();
  });

  it("throws when age is below 18", () => {
    expect(() => parseUser({ ...validUser, age: 5 })).toThrow();
  });
});