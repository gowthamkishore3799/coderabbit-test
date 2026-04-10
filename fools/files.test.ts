// Tests for fools/files.ts - UserSchema with Zod v4
// Covers changes from this PR:
// - Removed `website` (z.url()) and `status` (z.literal) fields
// - Added `websiteUrl`, `portfolio` (z.url()), `siteUrls` (z.urls()), `format` (z.string())
// - Changed `status` from z.literal to z.enum(["active", "inactive", "banned"])

import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: "25",
  active: "true",
  role: "admin",
  status: "active",
  code: "user-42",
  profile: {
    bio: "Hello world",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.dev",
  siteUrls: ["https://site1.com", "https://site2.com"],
  format: "json",
};

describe("UserSchema", () => {
  describe("valid input", () => {
    it("accepts a fully valid user object", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts user without optional bio in profile", () => {
      const input = { ...validUser, profile: { joined: new Date("2023-01-01") } };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("coerces string age to number", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("coerces numeric string age at boundary (18)", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "18" });
      expect(result.success).toBe(true);
    });
  });

  describe("id field", () => {
    it("rejects non-UUID id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects missing id", () => {
      const { id: _, ...withoutId } = validUser;
      const result = UserSchema.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it("accepts valid UUID v4", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email field", () => {
    it("rejects invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });

    it("accepts valid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "test+alias@sub.domain.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("age field", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects age of 0", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 0 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18 (boundary)", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("accepts age above 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 100 });
      expect(result.success).toBe(true);
    });
  });

  describe("active field (z.stringbool)", () => {
    it.each(["true", "1", "yes"])('parses "%s" as truthy', (val) => {
      const result = UserSchema.safeParse({ ...validUser, active: val });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it.each(["false", "0", "no"])('parses "%s" as falsy', (val) => {
      const result = UserSchema.safeParse({ ...validUser, active: val });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it("rejects non-boolean-like string", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "maybe" });
      expect(result.success).toBe(false);
    });
  });

  describe("role field", () => {
    it.each(["admin", "user", "manager"])('accepts role "%s"', (role) => {
      const result = UserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    });

    it("rejects unknown role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string role", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("status field (changed to z.enum)", () => {
    it.each(["active", "inactive", "banned"])('accepts status "%s"', (status) => {
      const result = UserSchema.safeParse({ ...validUser, status });
      expect(result.success).toBe(true);
    });

    it("rejects unknown status value", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
      expect(result.success).toBe(false);
    });

    it("rejects missing status", () => {
      const { status: _, ...withoutStatus } = validUser;
      const result = UserSchema.safeParse(withoutStatus);
      expect(result.success).toBe(false);
    });

    it("rejects null status", () => {
      const result = UserSchema.safeParse({ ...validUser, status: null });
      expect(result.success).toBe(false);
    });
  });

  describe("code field (templateLiteral)", () => {
    it('accepts "user-1"', () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-1" });
      expect(result.success).toBe(true);
    });

    it('accepts "user-9999"', () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-9999" });
      expect(result.success).toBe(true);
    });

    it('rejects "prod-1" (wrong prefix)', () => {
      const result = UserSchema.safeParse({ ...validUser, code: "prod-1" });
      expect(result.success).toBe(false);
    });

    it('rejects "user-10000" (number > 9999)', () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-10000" });
      expect(result.success).toBe(false);
    });
  });

  describe("profile field (strictObject)", () => {
    it("rejects extra keys in profile", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "hi", joined: new Date(), extraField: "should-fail" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts profile with only required joined field", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date() },
      });
      expect(result.success).toBe(true);
    });

    it("rejects profile with non-Date joined", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: "2023-01-01" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("websiteUrl field (new - z.url())", () => {
    it("accepts a valid HTTPS URL", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://example.com" });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTP URL", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com/path" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL (no protocol)", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "example.com" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing websiteUrl", () => {
      const { websiteUrl: _, ...withoutWebsiteUrl } = validUser;
      const result = UserSchema.safeParse(withoutWebsiteUrl);
      expect(result.success).toBe(false);
    });
  });

  describe("portfolio field (new - z.url())", () => {
    it("accepts a valid URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "https://myportfolio.io" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid portfolio URL", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects missing portfolio", () => {
      const { portfolio: _, ...withoutPortfolio } = validUser;
      const result = UserSchema.safeParse(withoutPortfolio);
      expect(result.success).toBe(false);
    });
  });

  describe("siteUrls field (new - z.urls())", () => {
    it("accepts array of valid URLs", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://a.com", "https://b.com", "https://c.com"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty array of URLs", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it("rejects array containing an invalid URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing siteUrls", () => {
      const { siteUrls: _, ...withoutSiteUrls } = validUser;
      const result = UserSchema.safeParse(withoutSiteUrls);
      expect(result.success).toBe(false);
    });
  });

  describe("format field (new - z.string())", () => {
    it("accepts any string for format", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "xml" });
      expect(result.success).toBe(true);
    });

    it("accepts empty string for format", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "" });
      expect(result.success).toBe(true);
    });

    it("rejects non-string format", () => {
      const result = UserSchema.safeParse({ ...validUser, format: 42 });
      expect(result.success).toBe(false);
    });

    it("rejects missing format", () => {
      const { format: _, ...withoutFormat } = validUser;
      const result = UserSchema.safeParse(withoutFormat);
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser", () => {
  it("returns parsed user data for valid input", () => {
    const user = parseUser(validUser);
    expect(user.email).toBe("user@example.com");
    expect(user.role).toBe("admin");
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.portfolio).toBe("https://portfolio.dev");
  });

  it("throws an error for invalid input", () => {
    expect(() => parseUser({ id: "bad-id", email: "bad-email" })).toThrow();
  });

  it("throws an error when status is not in the enum", () => {
    expect(() => parseUser({ ...validUser, status: "deleted" })).toThrow();
  });

  it("throws an error when websiteUrl is missing", () => {
    const { websiteUrl: _, ...withoutWebsiteUrl } = validUser;
    expect(() => parseUser(withoutWebsiteUrl)).toThrow();
  });

  it("throws an error when siteUrls contains an invalid URL", () => {
    expect(() =>
      parseUser({ ...validUser, siteUrls: ["https://valid.com", "bad-url"] })
    ).toThrow();
  });

  it("coerces age from string to number in returned data", () => {
    const user = parseUser({ ...validUser, age: "21" });
    expect(user.age).toBe(21);
    expect(typeof user.age).toBe("number");
  });
});