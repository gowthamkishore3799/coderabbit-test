import { describe, it, expect } from "vitest";
import { UserSchema, parseUser, type User } from "./files";

// Minimal valid input matching the schema after PR changes
const VALID_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  status: "active",
  code: "user-1",
  profile: {
    bio: "Test bio",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://site1.example.com", "https://site2.example.com"],
  format: "json",
};

describe("UserSchema", () => {
  // --- id field ---
  describe("id field", () => {
    it("accepts a valid UUID v4", () => {
      const result = UserSchema.safeParse(VALID_USER);
      expect(result.success).toBe(true);
    });

    it("rejects a non-UUID id", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, id: "not-a-uuid" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Invalid ID");
    });

    it("rejects an empty id", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, id: "" });
      expect(result.success).toBe(false);
    });
  });

  // --- email field ---
  describe("email field", () => {
    it("accepts a valid email address", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, email: "test@test.org" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid email", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, email: "not-an-email" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Invalid email");
    });

    it("rejects email without domain", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, email: "user@" });
      expect(result.success).toBe(false);
    });
  });

  // --- age field ---
  describe("age field", () => {
    it("accepts age of 18 (boundary)", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: 18 });
      expect(result.success).toBe(true);
    });

    it("accepts age above 18", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: 99 });
      expect(result.success).toBe(true);
    });

    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: 17 });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Must be 18+");
    });

    it("rejects age of 0", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: 0 });
      expect(result.success).toBe(false);
    });

    it("coerces a numeric string to number", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(25);
      }
    });

    it("rejects a float (non-integer) age", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, age: 18.5 });
      expect(result.success).toBe(false);
    });
  });

  // --- active field (z.stringbool) ---
  describe("active field (stringbool)", () => {
    it.each(["true", "1", "yes"])("accepts truthy string '%s'", (val) => {
      const result = UserSchema.safeParse({ ...VALID_USER, active: val });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it.each(["false", "0", "no"])("accepts falsy string '%s'", (val) => {
      const result = UserSchema.safeParse({ ...VALID_USER, active: val });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it("rejects an unrecognized boolean string", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, active: "maybe" });
      expect(result.success).toBe(false);
    });
  });

  // --- role field (enum) ---
  describe("role field", () => {
    it.each(["admin", "user", "manager"])("accepts role '%s'", (role) => {
      const result = UserSchema.safeParse({ ...VALID_USER, role });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid role", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, role: "superuser" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty role", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, role: "" });
      expect(result.success).toBe(false);
    });
  });

  // --- status field (changed from z.literal([]) to z.enum() in PR) ---
  describe("status field", () => {
    it.each(["active", "inactive", "banned"])("accepts status '%s'", (status) => {
      const result = UserSchema.safeParse({ ...VALID_USER, status });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid status value", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, status: "suspended" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty status", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, status: "" });
      expect(result.success).toBe(false);
    });

    it("rejects status as an array (old literal syntax no longer accepted)", () => {
      // The change from z.literal([...]) to z.enum([...]) means the
      // status field now expects a plain string, not an array
      const result = UserSchema.safeParse({ ...VALID_USER, status: ["active"] });
      expect(result.success).toBe(false);
    });
  });

  // --- code field (templateLiteral) ---
  describe("code field (templateLiteral)", () => {
    it("accepts minimum valid code 'user-1'", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "user-1" });
      expect(result.success).toBe(true);
    });

    it("accepts maximum valid code 'user-9999'", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "user-9999" });
      expect(result.success).toBe(true);
    });

    it("accepts a mid-range code 'user-500'", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "user-500" });
      expect(result.success).toBe(true);
    });

    it("rejects code without 'user-' prefix", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "admin-1" });
      expect(result.success).toBe(false);
    });

    it("rejects code 'user-0' (number must be min 1)", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "user-0" });
      expect(result.success).toBe(false);
    });

    it("rejects code 'user-10000' (number exceeds max 9999)", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, code: "user-10000" });
      expect(result.success).toBe(false);
    });
  });

  // --- profile field (strictObject) ---
  describe("profile field", () => {
    it("accepts a profile with bio and joined", () => {
      const result = UserSchema.safeParse(VALID_USER);
      expect(result.success).toBe(true);
    });

    it("accepts a profile without optional bio", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        profile: { joined: new Date("2024-01-01") },
      });
      expect(result.success).toBe(true);
    });

    it("rejects extra fields in strict profile object", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        profile: {
          bio: "bio",
          joined: new Date("2024-01-01"),
          extra: "should fail",
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile missing required joined date", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        profile: { bio: "bio" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects joined as a non-Date value", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        profile: { joined: "2024-01-01" },
      });
      expect(result.success).toBe(false);
    });
  });

  // --- websiteUrl field (added in PR) ---
  describe("websiteUrl field", () => {
    it("accepts a valid https URL", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, websiteUrl: "https://example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts a valid http URL", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, websiteUrl: "http://example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects a non-URL string", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty websiteUrl", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, websiteUrl: "" });
      expect(result.success).toBe(false);
    });
  });

  // --- portfolio field (added in PR) ---
  describe("portfolio field", () => {
    it("accepts a valid URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, portfolio: "https://portfolio.dev" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, portfolio: "portfolio.dev" });
      expect(result.success).toBe(false);
    });
  });

  // --- siteUrls field (added in PR) ---
  describe("siteUrls field", () => {
    it("accepts an array of valid URLs", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        siteUrls: ["https://a.com", "https://b.com"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty array for siteUrls", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it("rejects siteUrls containing an invalid URL", () => {
      const result = UserSchema.safeParse({
        ...VALID_USER,
        siteUrls: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects siteUrls as a plain string instead of array", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, siteUrls: "https://single.com" });
      expect(result.success).toBe(false);
    });
  });

  // --- format field (added in PR) ---
  describe("format field", () => {
    it("accepts any non-empty string", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, format: "json" });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string for format", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, format: "" });
      expect(result.success).toBe(true);
    });

    it("rejects a non-string format value", () => {
      const result = UserSchema.safeParse({ ...VALID_USER, format: 42 });
      expect(result.success).toBe(false);
    });
  });

  // --- schema completeness ---
  describe("missing required fields", () => {
    it("rejects input missing the id field", () => {
      const { id, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects input missing the email field", () => {
      const { email, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects input missing the websiteUrl field", () => {
      const { websiteUrl, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects input missing the portfolio field", () => {
      const { portfolio, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects input missing the siteUrls field", () => {
      const { siteUrls, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects input missing the format field", () => {
      const { format, ...rest } = VALID_USER;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // --- type inference ---
  describe("type inference", () => {
    it("returns a correctly typed User object on success", () => {
      const result = UserSchema.safeParse(VALID_USER);
      expect(result.success).toBe(true);
      if (result.success) {
        const user: User = result.data;
        expect(typeof user.id).toBe("string");
        expect(typeof user.email).toBe("string");
        expect(typeof user.age).toBe("number");
        expect(typeof user.active).toBe("boolean");
        expect(["admin", "user", "manager"]).toContain(user.role);
        expect(["active", "inactive", "banned"]).toContain(user.status);
        expect(typeof user.format).toBe("string");
        expect(Array.isArray(user.siteUrls)).toBe(true);
      }
    });
  });
});

// --- parseUser function ---
describe("parseUser", () => {
  it("returns a User when given valid input", () => {
    const user = parseUser(VALID_USER);
    expect(user.id).toBe(VALID_USER.id);
    expect(user.email).toBe(VALID_USER.email);
    expect(user.age).toBe(VALID_USER.age);
    expect(user.role).toBe(VALID_USER.role);
    expect(user.status).toBe(VALID_USER.status);
  });

  it("throws an Error when given invalid input", () => {
    expect(() => parseUser({ ...VALID_USER, email: "bad-email" })).toThrow(Error);
  });

  it("throws with a JSON-encoded error message", () => {
    try {
      parseUser({ ...VALID_USER, id: "not-a-uuid" });
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const msg = (err as Error).message;
      // The error should be JSON-serializable (v4 treeify output)
      expect(() => JSON.parse(msg)).not.toThrow();
    }
  });

  it("throws when input is null", () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it("throws when input is an empty object", () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it("coerces age from string to number in parsed output", () => {
    const user = parseUser({ ...VALID_USER, age: "30" });
    expect(user.age).toBe(30);
  });

  it("parses 'yes' active to boolean true", () => {
    const user = parseUser({ ...VALID_USER, active: "yes" });
    expect(user.active).toBe(true);
  });

  it("parses 'no' active to boolean false", () => {
    const user = parseUser({ ...VALID_USER, active: "no" });
    expect(user.active).toBe(false);
  });

  it("rejects status value that was valid under old z.literal array syntax but is now an array", () => {
    // Regression: status must be a single string, not an array
    expect(() => parseUser({ ...VALID_USER, status: ["active"] })).toThrow(Error);
  });
});