import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// Valid base data that satisfies the full UserSchema (post-PR changes)
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: "25", // coerced from string
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-1234",
  profile: {
    bio: "Hello world",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://site1.com", "https://site2.com"],
  format: "json",
};

describe("UserSchema (fools/files.ts)", () => {
  describe("valid data", () => {
    it("accepts a fully valid user object", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("coerces age from a numeric string", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts age as a number directly", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 20 });
      expect(result.success).toBe(true);
    });

    it("accepts all valid role values", () => {
      for (const role of ["admin", "user", "manager"] as const) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });
  });

  // --- status field: changed from z.literal to z.enum in this PR ---
  describe("status field (z.enum - changed from z.literal)", () => {
    it('accepts "active" as status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: "active" });
      expect(result.success).toBe(true);
    });

    it('accepts "inactive" as status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
      expect(result.success).toBe(true);
    });

    it('accepts "banned" as status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: "banned" });
      expect(result.success).toBe(true);
    });

    it("rejects an unknown status value", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "pending" });
      expect(result.success).toBe(false);
    });

    it("rejects status being undefined", () => {
      const { status: _omitted, ...withoutStatus } = validUser;
      const result = UserSchema.safeParse(withoutStatus);
      expect(result.success).toBe(false);
    });
  });

  // --- websiteUrl field (added in this PR) ---
  describe("websiteUrl field (added in PR)", () => {
    it("accepts a valid HTTPS URL for websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTP URL for websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects a plain string as websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects missing websiteUrl", () => {
      const { websiteUrl: _omitted, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });
  });

  // --- portfolio field (added in this PR) ---
  describe("portfolio field (added in PR)", () => {
    it("accepts a valid URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "https://portfolio.io" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects missing portfolio", () => {
      const { portfolio: _omitted, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });
  });

  // --- siteUrls field (added in this PR) ---
  describe("siteUrls field (added in PR, z.urls())", () => {
    it("accepts an array of valid URLs", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://a.com", "https://b.com"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty array for siteUrls", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it("rejects an array containing invalid URLs", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing siteUrls", () => {
      const { siteUrls: _omitted, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });
  });

  // --- format field (added in this PR) ---
  describe("format field (added in PR)", () => {
    it("accepts any non-empty string for format", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "csv" });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string for format (z.string() has no min)", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "" });
      expect(result.success).toBe(true);
    });

    it("rejects missing format", () => {
      const { format: _omitted, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });
  });

  // --- id field (z.uuid) ---
  describe("id field", () => {
    it("rejects a non-UUID id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("accepts a valid UUID v4 id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "123e4567-e89b-12d3-a456-426614174000" });
      expect(result.success).toBe(true);
    });
  });

  // --- email field ---
  describe("email field", () => {
    it("rejects an invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });
  });

  // --- age field ---
  describe("age field", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  // --- active field (z.stringbool) ---
  describe("active field (z.stringbool)", () => {
    it('parses "true" as active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: "true" });
      expect(result.success).toBe(true);
    });

    it('parses "false" as active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it('parses "1" as active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it('parses "0" as active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });
  });

  // --- role field ---
  describe("role field", () => {
    it("rejects an unknown role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });
  });

  // --- code field (z.templateLiteral) ---
  describe("code field (z.templateLiteral)", () => {
    it('accepts code starting with "user-" followed by a number', () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-42" });
      expect(result.success).toBe(true);
    });

    it("rejects code without the required prefix", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "admin-42" });
      expect(result.success).toBe(false);
    });
  });

  // --- profile field (z.strictObject) ---
  describe("profile field (z.strictObject)", () => {
    it("accepts profile without optional bio", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date("2024-01-01") },
      });
      expect(result.success).toBe(true);
    });

    it("rejects profile with extra unknown keys (strictObject)", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date("2024-01-01"), unknownField: "value" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile with missing joined field", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "hi" },
      });
      expect(result.success).toBe(false);
    });
  });

  // --- parseUser helper ---
  describe("parseUser()", () => {
    it("returns parsed data for valid input", () => {
      const user = parseUser(validUser);
      expect(user.email).toBe("user@example.com");
      expect(user.status).toBe("active");
      expect(user.websiteUrl).toBe("https://example.com");
      expect(user.portfolio).toBe("https://portfolio.example.com");
      expect(user.format).toBe("json");
    });

    it("throws an error for invalid input", () => {
      expect(() => parseUser({ ...validUser, email: "bad-email" })).toThrow();
    });

    it("throws for invalid status value", () => {
      expect(() => parseUser({ ...validUser, status: "deleted" })).toThrow();
    });

    it("throws for invalid websiteUrl", () => {
      expect(() => parseUser({ ...validUser, websiteUrl: "not-a-url" })).toThrow();
    });
  });
});