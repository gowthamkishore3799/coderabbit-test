import { describe, it, expect } from "vitest";
import { UserSchema, parseUser, type User } from "./files";

const validUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  age: 25,
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

describe("UserSchema", () => {
  describe("valid inputs", () => {
    it("accepts a fully valid user", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts all valid role values", () => {
      const roles = ["admin", "user", "manager"] as const;
      for (const role of roles) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success, `role '${role}' should be valid`).toBe(true);
      }
    });

    it("accepts all valid status values", () => {
      const statuses = ["active", "inactive", "banned"] as const;
      for (const status of statuses) {
        const result = UserSchema.safeParse({ ...validUser, status });
        expect(result.success, `status '${status}' should be valid`).toBe(true);
      }
    });

    it("accepts stringbool truthy values for active", () => {
      const truthyValues = ["true", "1", "yes"];
      for (const active of truthyValues) {
        const result = UserSchema.safeParse({ ...validUser, active });
        expect(result.success, `active '${active}' should be valid`).toBe(true);
      }
    });

    it("accepts stringbool falsy values for active", () => {
      const falsyValues = ["false", "0", "no"];
      for (const active of falsyValues) {
        const result = UserSchema.safeParse({ ...validUser, active });
        expect(result.success, `active '${active}' should be valid`).toBe(true);
      }
    });

    it("accepts user with optional profile bio omitted", () => {
      const user = {
        ...validUser,
        profile: { joined: new Date("2024-01-01") },
      };
      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it("coerces string age to number", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts multiple siteUrls", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://a.com", "https://b.com", "https://c.com"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty siteUrls array", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid id", () => {
    it("rejects non-UUID id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects empty id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid email", () => {
    it("rejects invalid email format", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid age", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects age of 0", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 0 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects non-integer age", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 25.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid role (enum)", () => {
    it("rejects an unknown role value", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid status (enum — changed from z.literal to z.enum in this PR)", () => {
    it("rejects unknown status value", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "pending" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "" });
      expect(result.success).toBe(false);
    });

    it("rejects null status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: null });
      expect(result.success).toBe(false);
    });

    it("is case-sensitive: rejects 'Active' (capital A)", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "Active" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid URL fields (websiteUrl, portfolio — added in this PR)", () => {
    it("rejects invalid websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid portfolio URL", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "ftp://" });
      expect(result.success).toBe(false);
    });

    it("rejects missing websiteUrl", () => {
      const { websiteUrl, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects missing portfolio", () => {
      const { portfolio, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid siteUrls (added in this PR)", () => {
    it("rejects siteUrls containing an invalid URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing siteUrls field", () => {
      const { siteUrls, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid format (added in this PR)", () => {
    it("rejects missing format field", () => {
      const { format, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("invalid code (template literal)", () => {
    it("rejects code not prefixed with 'user-'", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "admin-42" });
      expect(result.success).toBe(false);
    });
  });

  describe("strict profile object", () => {
    it("rejects extra keys in profile (strict object)", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date(), extraKey: "should fail" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile with non-Date joined", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: "2024-01-01" },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser", () => {
  it("returns parsed user data for valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.status).toBe("active");
    expect(user.role).toBe("admin");
  });

  it("throws on invalid input", () => {
    expect(() => parseUser({ ...validUser, status: "not-valid" })).toThrow();
  });

  it("throws on missing required fields", () => {
    expect(() => parseUser({})).toThrow();
  });

  it("throws with JSON error details", () => {
    try {
      parseUser({ ...validUser, email: "bad-email" });
      expect.fail("should have thrown");
    } catch (e: any) {
      expect(e.message).toBeTruthy();
      expect(() => JSON.parse(e.message)).not.toThrow();
    }
  });

  it("returns correct status from enum", () => {
    const user = parseUser({ ...validUser, status: "banned" });
    expect(user.status).toBe("banned");
  });

  it("returns correct websiteUrl", () => {
    const user = parseUser({ ...validUser, websiteUrl: "https://mysite.io" });
    expect(user.websiteUrl).toBe("https://mysite.io");
  });
});