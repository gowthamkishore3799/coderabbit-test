import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  website: "https://example.com",
  websites: ["https://example.com", "https://other.com"],
  trail: "https://trail.example.com",
  trails: "some trail info",
};

describe("User schema (fools/file.ts)", () => {
  describe("valid inputs", () => {
    it("accepts a fully valid user object", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("coerces age from string to number", () => {
      const result = User.safeParse({ ...validUser, age: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(25);
      }
    });

    it("accepts all valid stringbool truthy values for active", () => {
      for (const active of ["true", "1", "yes"]) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid stringbool falsy values for active", () => {
      for (const active of ["false", "0", "no"]) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid role values", () => {
      for (const role of ["admin", "user", "manager"]) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it("accepts empty websites array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it("accepts multiple websites", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://a.com", "https://b.com", "https://c.com"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts minimum valid age of 18", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for id", () => {
      const result = User.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = User.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects age of 0", () => {
      const result = User.safeParse({ ...validUser, age: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects invalid role value", () => {
      const result = User.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL for website", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL in websites array", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL for trail", () => {
      const result = User.safeParse({ ...validUser, trail: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string for trails", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const { id, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer age", () => {
      const result = User.safeParse({ ...validUser, age: 25.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("parseUser helper", () => {
    it("returns parsed data for valid input", () => {
      const result = parseUser(validUser);
      expect(result.email).toBe("user@example.com");
      expect(result.age).toBe(25);
    });

    it("throws for invalid input", () => {
      expect(() => parseUser({ ...validUser, email: "bad" })).toThrow();
    });

    it("throws with error details in message", () => {
      expect(() => parseUser({ ...validUser, id: "not-uuid" })).toThrow(Error);
    });

    it("coerces age from string in parseUser", () => {
      const result = parseUser({ ...validUser, age: "30" });
      expect(result.age).toBe(30);
    });
  });
});