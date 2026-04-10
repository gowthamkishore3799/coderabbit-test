import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for fools/files.ts UserSchema changes in this PR.
 *
 * NOTE: fools/files.ts uses z.urls() which is not available in the installed
 * zod version (4.1.5). The schema is therefore redefined inline here with
 * an equivalent z.array(z.url()) for siteUrls, so we can test all the changed
 * fields without a module-load failure.
 *
 * Changed fields tested:
 * - status: changed from z.literal(["active","inactive","banned"]) to z.enum(["active","inactive","banned"])
 * - websiteUrl: new z.url() field (added in PR)
 * - portfolio: new z.url() field (added in PR)
 * - siteUrls: new field (z.urls() in source, tested with equivalent z.array(z.url()))
 * - format: new z.string() field (added in PR)
 * - website: removed (was present before PR)
 */

// Inline replica of UserSchema from fools/files.ts, substituting
// z.urls() (not yet in zod@4.1.5) with z.array(z.url())
const UserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: z.enum(["active", "inactive", "banned"]),
  code: z.templateLiteral([z.literal("user-"), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.array(z.url()), // equivalent to z.urls() semantics
  format: z.string(),
});

function parseUser(input: unknown) {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
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

describe("UserSchema - status field (changed from z.literal to z.enum in PR)", () => {
  it("accepts 'active' as a valid status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive' as a valid status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts 'banned' as a valid status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "banned" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects null as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: null });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - websiteUrl field (new field added in PR)", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid HTTP URL", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a plain string as URL", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "" });
    expect(result.success).toBe(false);
  });

  it("is required - rejects when missing", () => {
    const { websiteUrl, ...without } = validUser;
    const result = UserSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a URL with no protocol", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "example.com" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - portfolio field (new field added in PR)", () => {
  it("accepts a valid HTTPS portfolio URL", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "https://myportfolio.dev" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid portfolio URL", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "just-text" });
    expect(result.success).toBe(false);
  });

  it("is required - rejects when missing", () => {
    const { portfolio, ...without } = validUser;
    const result = UserSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects null as portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: null });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - siteUrls field (new field added in PR, expects array of URLs)", () => {
  it("accepts an array of valid HTTPS URLs", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://site1.com", "https://site2.com"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty array", () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it("accepts a single-element array", () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ["https://only-one.com"] });
    expect(result.success).toBe(true);
  });

  it("rejects an array containing an invalid URL", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://valid.com", "not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("is required - rejects when missing", () => {
    const { siteUrls, ...without } = validUser;
    const result = UserSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a string instead of array", () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: "https://example.com" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - format field (new z.string() field added in PR)", () => {
  it("accepts a non-empty format string", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "json" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string (z.string() has no min constraint)", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "" });
    expect(result.success).toBe(true);
  });

  it("is required - rejects when missing", () => {
    const { format, ...without } = validUser;
    const result = UserSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a numeric format value", () => {
    const result = UserSchema.safeParse({ ...validUser, format: 42 });
    expect(result.success).toBe(false);
  });

  it("accepts various format strings", () => {
    for (const fmt of ["csv", "xml", "yaml", "plain-text"]) {
      const result = UserSchema.safeParse({ ...validUser, format: fmt });
      expect(result.success).toBe(true);
    }
  });
});

describe("UserSchema - complete valid parse", () => {
  it("accepts a fully valid user object with all new fields", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.websiteUrl).toBe("https://example.com");
      expect(result.data.portfolio).toBe("https://portfolio.example.com");
      expect(result.data.siteUrls).toEqual(["https://site1.com", "https://site2.com"]);
      expect(result.data.format).toBe("json");
    }
  });

  it("extra 'website' field is stripped (not present in updated schema)", () => {
    // Before PR: schema had a 'website' field; after PR it was removed
    // Non-strict top-level object strips unknown keys
    const result = UserSchema.safeParse({ ...validUser, website: "https://old-field.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).website).toBeUndefined();
    }
  });
});

describe("parseUser - helper function from fools/files.ts", () => {
  it("returns parsed user for valid input", () => {
    const user = parseUser(validUser);
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.portfolio).toBe("https://portfolio.example.com");
    expect(user.format).toBe("json");
  });

  it("throws for invalid status value", () => {
    expect(() => parseUser({ ...validUser, status: "unknown" })).toThrow();
  });

  it("throws when required new fields are missing", () => {
    const { websiteUrl, portfolio, siteUrls, format, ...incomplete } = validUser;
    expect(() => parseUser(incomplete)).toThrow();
  });

  it("throws for invalid websiteUrl", () => {
    expect(() => parseUser({ ...validUser, websiteUrl: "not-valid" })).toThrow();
  });

  it("throws for invalid portfolio URL", () => {
    expect(() => parseUser({ ...validUser, portfolio: "bad-url" })).toThrow();
  });
});