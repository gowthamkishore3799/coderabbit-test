import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// Valid base input for the User schema in fools/file.ts
// The PR change was removing a stray non-identifier line `asdkjbasdbkjbkjbas`
// that caused a SyntaxError, allowing the module to be imported properly.
const validInput = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: "25",          // coerced via z.coerce.number()
  active: "true",     // z.stringbool()
  role: "admin",
  website: "https://example.com",
  websites: ["https://a.example.com", "https://b.example.com"],
  trail: "https://trail.example.com",
  trails: "Some trail description",
};

describe("fools/file.ts – User schema (module syntax fixed in PR)", () => {
  it("module imports without error (stray identifier removed in PR)", async () => {
    await expect(import("./file")).resolves.toBeDefined();
  });

  describe("valid data", () => {
    it("accepts a fully valid user object", () => {
      const result = User.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("coerces age from a numeric string", () => {
      const result = User.safeParse({ ...validInput, age: "42" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(42);
    });

    it("accepts age as a plain integer", () => {
      const result = User.safeParse({ ...validInput, age: 20 });
      expect(result.success).toBe(true);
    });

    it("accepts all valid role values", () => {
      for (const role of ["admin", "user", "manager"]) {
        expect(User.safeParse({ ...validInput, role }).success).toBe(true);
      }
    });
  });

  describe("id field", () => {
    it("rejects a non-UUID id", () => {
      const result = User.safeParse({ ...validInput, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("email field", () => {
    it("rejects an invalid email", () => {
      const result = User.safeParse({ ...validInput, email: "bad-email" });
      expect(result.success).toBe(false);
    });

    it("accepts a valid email", () => {
      const result = User.safeParse({ ...validInput, email: "valid@domain.org" });
      expect(result.success).toBe(true);
    });
  });

  describe("age field", () => {
    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validInput, age: 17 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18", () => {
      const result = User.safeParse({ ...validInput, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe("active field (z.stringbool)", () => {
    it('parses "true" without error', () => {
      expect(User.safeParse({ ...validInput, active: "true" }).success).toBe(true);
    });

    it('parses "false" without error', () => {
      expect(User.safeParse({ ...validInput, active: "false" }).success).toBe(true);
    });

    it('parses "yes" without error', () => {
      expect(User.safeParse({ ...validInput, active: "yes" }).success).toBe(true);
    });

    it('parses "no" without error', () => {
      expect(User.safeParse({ ...validInput, active: "no" }).success).toBe(true);
    });
  });

  describe("website field", () => {
    it("rejects an invalid URL for website", () => {
      const result = User.safeParse({ ...validInput, website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts a valid URL for website", () => {
      const result = User.safeParse({ ...validInput, website: "https://valid.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("websites field (array of URLs)", () => {
    it("accepts an array of valid URLs", () => {
      const result = User.safeParse({
        ...validInput,
        websites: ["https://one.com", "https://two.org"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an array containing an invalid URL", () => {
      const result = User.safeParse({
        ...validInput,
        websites: ["https://valid.com", "bad-url"],
      });
      expect(result.success).toBe(false);
    });

    it("accepts an empty websites array", () => {
      const result = User.safeParse({ ...validInput, websites: [] });
      expect(result.success).toBe(true);
    });
  });

  describe("role field", () => {
    it("rejects an unknown role", () => {
      const result = User.safeParse({ ...validInput, role: "superadmin" });
      expect(result.success).toBe(false);
    });
  });

  describe("trails field (z.string min 1)", () => {
    it("accepts a non-empty string", () => {
      const result = User.safeParse({ ...validInput, trails: "Trail content" });
      expect(result.success).toBe(true);
    });

    it("rejects an empty string (min 1)", () => {
      const result = User.safeParse({ ...validInput, trails: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("parseUser() helper", () => {
    it("returns parsed data for a valid input", () => {
      const user = parseUser(validInput);
      expect(user.email).toBe("user@example.com");
      expect(user.role).toBe("admin");
    });

    it("throws for invalid input", () => {
      expect(() => parseUser({ ...validInput, email: "bad" })).toThrow();
    });

    it("throws for age below 18", () => {
      expect(() => parseUser({ ...validInput, age: 10 })).toThrow();
    });

    it("throws for an invalid website URL", () => {
      expect(() => parseUser({ ...validInput, website: "not-a-url" })).toThrow();
    });
  });
});