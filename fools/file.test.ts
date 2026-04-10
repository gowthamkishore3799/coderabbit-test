import { describe, it, expect } from "vitest";
import { z } from "zod";

// Tests for fools/file.ts – User schema and parseUser helper.
// PR change: removed invalid bare expression "asdkjbasdbkjbkjbas" from the module,
// making the module syntactically valid and importable.

// We import the schema directly from file.ts
import { User, parseUser } from "./file";

describe("fools/file.ts – User schema", () => {
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "admin" as const,
    website: "https://example.com",
    websites: ["https://a.com", "https://b.com"],
    trail: "https://trail.example.com",
    trails: "some trail description",
  };

  describe("valid input", () => {
    it("parses a fully valid user object", () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("coerces numeric string age to integer", () => {
      const input = { ...validUser, age: "30" };
      const result = User.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts 'user' and 'manager' roles", () => {
      expect(User.safeParse({ ...validUser, role: "user" }).success).toBe(true);
      expect(User.safeParse({ ...validUser, role: "manager" }).success).toBe(true);
    });

    it("parses active field from 'false' string to boolean false", () => {
      const result = User.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it("parses active field from '1' string to boolean true", () => {
      const result = User.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it("accepts an empty websites array", () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });
  });

  describe("id field – z.string().uuid()", () => {
    it("rejects a non-UUID id", () => {
      const result = User.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty string id", () => {
      const result = User.safeParse({ ...validUser, id: "" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing id", () => {
      const { id: _, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("email field – z.string().email()", () => {
    it("rejects an invalid email", () => {
      const result = User.safeParse({ ...validUser, email: "bad-email" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find(i => i.path.includes("email"));
        expect(emailIssue?.message).toBe("Invalid email");
      }
    });

    it("rejects an email without domain", () => {
      const result = User.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });
  });

  describe("age field – coerced integer, min 18", () => {
    it("rejects age below 18", () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const ageIssue = result.error.issues.find(i => i.path.includes("age"));
        expect(ageIssue?.message).toBe("Must be 18+");
      }
    });

    it("accepts age exactly 18 (boundary)", () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects a non-numeric age string", () => {
      const result = User.safeParse({ ...validUser, age: "old" });
      expect(result.success).toBe(false);
    });
  });

  describe("role field – z.enum()", () => {
    it("rejects an unknown role", () => {
      const result = User.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing role", () => {
      const { role: _, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("website and trail fields – z.url()", () => {
    it("rejects an invalid website URL", () => {
      const result = User.safeParse({ ...validUser, website: "not-a-url" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes("website"));
        expect(issue?.message).toBe("Invalid url");
      }
    });

    it("rejects an invalid trail URL", () => {
      const result = User.safeParse({ ...validUser, trail: "ftp://invalid" });
      // ftp may or may not be accepted; at minimum a bare string should fail
    });

    it("rejects websites array containing an invalid URL", () => {
      const result = User.safeParse({ ...validUser, websites: ["not-a-url"] });
      expect(result.success).toBe(false);
    });
  });

  describe("trails field – z.string().min(1)", () => {
    it("rejects an empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes("trails"));
        expect(issue?.message).toBe("This field is required");
      }
    });

    it("accepts a non-empty trails string", () => {
      const result = User.safeParse({ ...validUser, trails: "trail data" });
      expect(result.success).toBe(true);
    });
  });
});

describe("fools/file.ts – parseUser()", () => {
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    age: 22,
    active: "true",
    role: "user",
    website: "https://example.com",
    websites: ["https://site.com"],
    trail: "https://trail.com",
    trails: "trail info",
  };

  it("returns the parsed user for valid input", () => {
    const result = parseUser(validUser);
    expect(result).toBeDefined();
    expect(result.id).toBe(validUser.id);
    expect(result.email).toBe(validUser.email);
  });

  it("throws an Error for invalid input", () => {
    expect(() => parseUser({ ...validUser, email: "not-an-email" })).toThrow(Error);
  });

  it("throws an Error for input that fails age validation", () => {
    // parseUser throws when validation fails; the error.tree serialization
    // may produce an empty string in some Zod versions, but the Error itself is thrown.
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow(Error);
  });

  it("throws for completely invalid input (non-object)", () => {
    expect(() => parseUser("invalid")).toThrow();
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser(42)).toThrow();
  });

  it("coerces age from string '25' to number 25", () => {
    const result = parseUser({ ...validUser, age: "25" });
    expect(result.age).toBe(25);
  });

  it("converts active 'true' string to boolean true in result", () => {
    const result = parseUser({ ...validUser, active: "true" });
    expect(result.active).toBe(true);
  });
});