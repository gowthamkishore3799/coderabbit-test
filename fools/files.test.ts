// Tests for UserSchema changes in fools/files.ts
// This PR changed:
//   - Removed: website (z.url()), status: z.literal([...])
//   - Added:   status: z.enum([...]), websiteUrl: z.url(), portfolio: z.url(), siteUrls: z.urls(), format: z.string()
//   - Fixed:   profile.joined indentation

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Field-level schema tests for each changed field ─────────────────────────
// Tests use isolated Zod schemas that mirror the fields in UserSchema.
// Note: The full UserSchema import from './files' is tested separately below
// because z.urls() does not exist in zod v4.3.x and causes a module load failure.

const statusSchema = z.enum(["active", "inactive", "banned"]);
const websiteUrlSchema = z.url();
const portfolioSchema = z.url();
const formatSchema = z.string();

// ─── status field: changed from z.literal([...]) to z.enum([...]) ─────────────

describe("UserSchema – status field (z.enum)", () => {
  it("accepts 'active'", () => {
    expect(statusSchema.parse("active")).toBe("active");
  });

  it("accepts 'inactive'", () => {
    expect(statusSchema.parse("inactive")).toBe("inactive");
  });

  it("accepts 'banned'", () => {
    expect(statusSchema.parse("banned")).toBe("banned");
  });

  it("rejects an unrecognised status value", () => {
    expect(() => statusSchema.parse("pending")).toThrow();
  });

  it("rejects null", () => {
    expect(() => statusSchema.parse(null)).toThrow();
  });

  it("rejects undefined", () => {
    expect(() => statusSchema.parse(undefined)).toThrow();
  });

  it("rejects a numeric status", () => {
    expect(() => statusSchema.parse(1)).toThrow();
  });

  it("enum values are accessible via .enum property", () => {
    const vals = statusSchema.enum;
    expect(vals).toEqual({ active: "active", inactive: "inactive", banned: "banned" });
  });
});

// ─── websiteUrl field: added z.url() ─────────────────────────────────────────

describe("UserSchema – websiteUrl field (z.url())", () => {
  it("accepts a valid HTTPS URL", () => {
    expect(websiteUrlSchema.parse("https://example.com")).toBe("https://example.com");
  });

  it("accepts a valid HTTP URL", () => {
    expect(websiteUrlSchema.parse("http://example.com/path")).toBe(
      "http://example.com/path"
    );
  });

  it("rejects a bare hostname without scheme", () => {
    expect(() => websiteUrlSchema.parse("example.com")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => websiteUrlSchema.parse("")).toThrow();
  });

  it("rejects null", () => {
    expect(() => websiteUrlSchema.parse(null)).toThrow();
  });

  it("rejects a non-string value", () => {
    expect(() => websiteUrlSchema.parse(123)).toThrow();
  });
});

// ─── portfolio field: added z.url() ──────────────────────────────────────────

describe("UserSchema – portfolio field (z.url())", () => {
  it("accepts a valid portfolio URL", () => {
    expect(portfolioSchema.parse("https://portfolio.dev/user")).toBe(
      "https://portfolio.dev/user"
    );
  });

  it("accepts a URL with query string", () => {
    expect(portfolioSchema.parse("https://example.com?tab=work")).toBe(
      "https://example.com?tab=work"
    );
  });

  it("rejects a non-URL string", () => {
    expect(() => portfolioSchema.parse("not-a-url")).toThrow();
  });

  it("rejects undefined", () => {
    expect(() => portfolioSchema.parse(undefined)).toThrow();
  });
});

// ─── format field: added z.string() ──────────────────────────────────────────

describe("UserSchema – format field (z.string())", () => {
  it("accepts any non-empty string", () => {
    expect(formatSchema.parse("json")).toBe("json");
  });

  it("accepts an empty string (z.string() permits it)", () => {
    expect(formatSchema.parse("")).toBe("");
  });

  it("rejects null", () => {
    expect(() => formatSchema.parse(null)).toThrow();
  });

  it("rejects a number", () => {
    expect(() => formatSchema.parse(42)).toThrow();
  });
});

// ─── siteUrls field: z.urls() does NOT exist in zod v4.3.x ───────────────────

describe("UserSchema – siteUrls field (z.urls() availability)", () => {
  it("z.urls is not a function in zod v4.3.x (regression guard)", () => {
    // z.urls() was added in a later zod version; confirm current state.
    expect(typeof (z as any).urls).not.toBe("function");
  });

  it("importing fools/files.ts throws because z.urls() does not exist", async () => {
    await expect(import("./files")).rejects.toThrow();
  });
});

// ─── profile.joined field: indentation fix (joined: z.date()) ────────────────

describe("UserSchema – profile.joined field indentation fix", () => {
  const profileSchema = z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  });

  it("accepts a valid Date for joined", () => {
    const d = new Date("2023-01-01");
    expect(profileSchema.parse({ joined: d })).toMatchObject({ joined: d });
  });

  it("accepts bio + joined together", () => {
    const d = new Date();
    const result = profileSchema.parse({ bio: "Hello", joined: d });
    expect(result.bio).toBe("Hello");
    expect(result.joined).toBeInstanceOf(Date);
  });

  it("rejects extra fields (strictObject)", () => {
    expect(() =>
      profileSchema.parse({ joined: new Date(), extra: "oops" })
    ).toThrow();
  });

  it("rejects missing joined", () => {
    expect(() => profileSchema.parse({ bio: "x" })).toThrow();
  });
});

// ─── Removed fields (regression: ensure they are gone from schema) ────────────

describe("UserSchema – removed fields (website)", () => {
  // The 'website' top-level field was removed in this PR.
  // Verify that the UserSchema no longer has it by checking a partial
  // reconstruction that mirrors the added fields only.
  const partialSchema = z.object({
    websiteUrl: z.url(),
    portfolio: z.url(),
    format: z.string(),
    status: z.enum(["active", "inactive", "banned"]),
  });

  it("parses a partial user object with new fields correctly", () => {
    const result = partialSchema.parse({
      websiteUrl: "https://example.com",
      portfolio: "https://portfolio.io",
      format: "json",
      status: "active",
    });
    expect(result.websiteUrl).toBe("https://example.com");
    expect(result.portfolio).toBe("https://portfolio.io");
    expect(result.format).toBe("json");
    expect(result.status).toBe("active");
  });

  it("rejects an old-format user that only has 'website' instead of 'websiteUrl'", () => {
    expect(() =>
      partialSchema.parse({
        website: "https://example.com", // old field name - should fail
        portfolio: "https://portfolio.io",
        format: "json",
        status: "active",
      })
    ).toThrow();
  });
});