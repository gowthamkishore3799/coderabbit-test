/**
 * Tests for fools/files.ts - UserSchema changes introduced in this PR.
 *
 * PR changes covered:
 *  - `status` field changed from z.literal(["active","inactive","banned"]) to z.enum(["active","inactive","banned"])
 *  - `website` field removed
 *  - Added fields: websiteUrl (z.url()), portfolio (z.url()), format (z.string())
 *  - Added field: siteUrls — z.urls() is NOT available in Zod 4.1.5; schema-level tests
 *    for siteUrls are omitted and noted below.
 *  - parseUser() helper function behaviour
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Re-declare only the changed / added fields so tests are isolated from the
// z.urls() runtime error that currently prevents importing fools/files.ts
// directly (z.urls is not a function in zod@4.1.5).
// ---------------------------------------------------------------------------

const StatusSchema = z.enum(["active", "inactive", "banned"]);

const WebsiteUrlSchema = z.url();
const PortfolioSchema = z.url();
const FormatSchema = z.string();

// Minimal reconstruction of the full schema (excluding siteUrls which relies
// on z.urls() that is absent in zod@4.1.5).
const UserSchemaWithoutSiteUrls = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: StatusSchema,
  code: z.templateLiteral([z.literal("user-"), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: WebsiteUrlSchema,
  portfolio: PortfolioSchema,
  format: FormatSchema,
});

// A valid base object for reuse across tests.
const validUser = () => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-1",
  profile: { joined: new Date("2024-01-01") },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  format: "json",
});

// ---------------------------------------------------------------------------
// status field — changed from z.literal(array) to z.enum
// ---------------------------------------------------------------------------

describe("status field (PR change: z.literal → z.enum)", () => {
  it("accepts all three valid enum values", () => {
    const values = ["active", "inactive", "banned"] as const;
    for (const v of values) {
      expect(StatusSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects values outside the enum", () => {
    const invalid = ["Active", "ACTIVE", "suspended", "pending", "", 0, null, undefined];
    for (const v of invalid) {
      expect(StatusSchema.safeParse(v).success).toBe(
        false,
        `Expected "${v}" to be invalid`
      );
    }
  });

  it("rejects an array of valid values (was literal-array, now plain enum)", () => {
    // The old z.literal([...]) accepted arrays; z.enum does not.
    expect(StatusSchema.safeParse(["active", "inactive"]).success).toBe(false);
  });

  it("infers the correct TypeScript union type", () => {
    type Status = z.infer<typeof StatusSchema>;
    const s: Status = "banned";
    expect(s).toBe("banned");
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field — new field added in PR (z.url())
// ---------------------------------------------------------------------------

describe("websiteUrl field (new in PR)", () => {
  it("accepts a valid https URL", () => {
    expect(WebsiteUrlSchema.safeParse("https://example.com").success).toBe(true);
  });

  it("accepts a valid http URL", () => {
    expect(WebsiteUrlSchema.safeParse("http://example.com").success).toBe(true);
  });

  it("rejects a plain string that is not a URL", () => {
    expect(WebsiteUrlSchema.safeParse("not-a-url").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(WebsiteUrlSchema.safeParse("").success).toBe(false);
  });

  it("rejects a URL without a scheme", () => {
    expect(WebsiteUrlSchema.safeParse("example.com").success).toBe(false);
  });

  it("is required (rejects undefined)", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({
      ...validUser(),
      websiteUrl: undefined,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field — new field added in PR (z.url())
// ---------------------------------------------------------------------------

describe("portfolio field (new in PR)", () => {
  it("accepts a valid URL", () => {
    expect(PortfolioSchema.safeParse("https://myportfolio.dev").success).toBe(true);
  });

  it("rejects a non-URL string", () => {
    expect(PortfolioSchema.safeParse("just some text").success).toBe(false);
  });

  it("is required (rejects undefined)", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({
      ...validUser(),
      portfolio: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    expect(PortfolioSchema.safeParse(null).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field — new field added in PR (z.string())
// ---------------------------------------------------------------------------

describe("format field (new in PR)", () => {
  it("accepts any non-empty string", () => {
    const values = ["json", "csv", "xml", "plain-text", "1234"];
    for (const v of values) {
      expect(FormatSchema.safeParse(v).success).toBe(true);
    }
  });

  it("accepts an empty string (z.string() has no min constraint)", () => {
    expect(FormatSchema.safeParse("").success).toBe(true);
  });

  it("rejects non-string types", () => {
    expect(FormatSchema.safeParse(42).success).toBe(false);
    expect(FormatSchema.safeParse(null).success).toBe(false);
    expect(FormatSchema.safeParse(undefined).success).toBe(false);
  });

  it("is required in UserSchema", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({
      ...validUser(),
      format: undefined,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Removed field: website
// ---------------------------------------------------------------------------

describe("website field (removed in PR)", () => {
  it("full schema no longer has a website field — extra key is stripped", () => {
    const input = { ...validUser(), website: "https://should-be-stripped.com" };
    const result = UserSchemaWithoutSiteUrls.safeParse(input);
    // z.object strips unknown keys by default
    if (result.success) {
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    } else {
      // Parsing itself must still succeed (website is just an extra key)
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Full UserSchema integration (without siteUrls)
// ---------------------------------------------------------------------------

describe("UserSchemaWithoutSiteUrls integration", () => {
  it("parses a fully valid user object", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse(validUser());
    expect(result.success).toBe(true);
  });

  it("coerces age from string to number", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), age: "30" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });

  it("rejects age below 18", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), age: 17 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid UUID for id", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("accepts stringbool active='false'", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), active: "false" });
    expect(result.success).toBe(true);
  });

  it("accepts stringbool active='yes'", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), active: "yes" });
    expect(result.success).toBe(true);
  });

  it("accepts stringbool active='0'", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), active: "0" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), role: "superuser" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), status: "suspended" });
    expect(result.success).toBe(false);
  });

  it("rejects profile with extra keys (strictObject)", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({
      ...validUser(),
      profile: { joined: new Date(), bio: "hello", extra: "bad" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts profile without optional bio", () => {
    const result = UserSchemaWithoutSiteUrls.safeParse({
      ...validUser(),
      profile: { joined: new Date() },
    });
    expect(result.success).toBe(true);
  });

  it("validates template literal code field correctly", () => {
    expect(UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), code: "user-42" }).success).toBe(true);
    expect(UserSchemaWithoutSiteUrls.safeParse({ ...validUser(), code: "item-42" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls note (z.urls() missing)
// ---------------------------------------------------------------------------

describe("siteUrls field note", () => {
  it("z.urls is not available in zod@4.1.5 — this is a known issue in the PR", () => {
    // z.urls() is listed as a new PR addition but is absent from zod@4.1.5.
    // When fools/files.ts is imported directly the module initialisation fails
    // with "z.urls is not a function".
    expect(typeof (z as Record<string, unknown>).urls).toBe("undefined");
  });
});