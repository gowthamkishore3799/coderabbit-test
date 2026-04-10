import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// Valid user fixture for fools/file.ts schema
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 21,
  active: "true",
  role: "user" as const,
  website: "https://example.com",
  websites: ["https://a.example.com", "https://b.example.com"],
  trail: "https://trail.example.com",
  trails: "some-trail-value",
};

describe("User schema (fools/file.ts)", () => {
  describe("valid inputs", () => {
    it("accepts a fully valid user object", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts all valid role values", () => {
      const roles = ["admin", "user", "manager"] as const;
      for (const role of roles) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success, `role '${role}' should be valid`).toBe(true);
      }
    });

    it("accepts stringbool truthy values for active", () => {
      for (const active of ["true", "1", "yes"]) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success, `active '${active}' should be valid`).toBe(true);
      }
    });

    it("accepts stringbool falsy values for active", () => {
      for (const active of ["false", "0", "no"]) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success, `active '${active}' should be valid`).toBe(true);
      }
    });

    it("coerces string age to integer", () => {
      const result = User.safeParse({ ...validUser, age: "28" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(28);
      }
    });

    it("accepts empty websites array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it("accepts multiple websites", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://one.com", "https://two.com", "https://three.com"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid id", () => {
    it("rejects non-UUID id", () => {
      const result = User.safeParse({ ...validUser, id: "abc-def" });
      expect(result.success).toBe(false);
    });

    it("rejects missing id", () => {
      const { id, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid email", () => {
    it("rejects plain string without @", () => {
      const result = User.safeParse({ ...validUser, email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const { email, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid age", () => {
    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validUser, age: 16 });
      expect(result.success).toBe(false);
    });

    it("accepts exactly age 18", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects float age", () => {
      const result = User.safeParse({ ...validUser, age: 20.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid URL fields", () => {
    it("rejects invalid website URL", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid trail URL", () => {
      const result = User.safeParse({ ...validUser, trail: "just-text" });
      expect(result.success).toBe(false);
    });

    it("rejects websites array with invalid URL", () => {
      const result = User.safeParse({
        ...validUser,
        websites: ["https://valid.com", "invalid-url"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("trails field (min length 1)", () => {
    it("rejects empty string for trails", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
    });

    it("accepts non-empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "trail-id-123" });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid role", () => {
    it("rejects unlisted role", () => {
      const result = User.safeParse({ ...validUser, role: "viewer" });
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser (fools/file.ts)", () => {
  it("returns parsed user for valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it("throws for completely empty input", () => {
    expect(() => parseUser({})).toThrow();
  });

  it("throws for invalid role", () => {
    expect(() => parseUser({ ...validUser, role: "unknown" })).toThrow();
  });

  it("throws for invalid website URL", () => {
    expect(() => parseUser({ ...validUser, website: "bad-url" })).toThrow();
  });

  it("returns correct role value after parsing", () => {
    const user = parseUser({ ...validUser, role: "manager" });
    expect(user.role).toBe("manager");
  });
});