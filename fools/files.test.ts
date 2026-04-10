import { describe, it, expect } from "vitest";
import { z } from "zod";

// NOTE: UserSchema in files.ts calls z.urls() which does not exist in Zod v4.
// This causes the module to fail at evaluation time. The test below documents
// that breakage, and the remaining tests validate each field schema in
// isolation using the same Zod expressions from the PR change.

describe("files.ts module – z.urls() breakage", () => {
  it("z.urls is not a function in Zod v4 (documents PR regression)", () => {
    // This mirrors the line `siteUrls: z.urls()` added by this PR.
    expect(typeof (z as unknown as Record<string, unknown>).urls).not.toBe("function");
  });

  it("UserSchema module cannot be imported due to z.urls() call", async () => {
    await expect(import("./files")).rejects.toThrow(/z\.urls is not a function|is not a function/);
  });
});

// ---- Status field: z.enum (changed from z.literal in this PR) ---------------

describe("status field – z.enum (PR change from z.literal)", () => {
  const statusSchema = z.enum(["active", "inactive", "banned"]);

  it("accepts 'active'", () => {
    expect(statusSchema.safeParse("active").success).toBe(true);
  });

  it("accepts 'inactive'", () => {
    expect(statusSchema.safeParse("inactive").success).toBe(true);
  });

  it("accepts 'banned'", () => {
    expect(statusSchema.safeParse("banned").success).toBe(true);
  });

  it("rejects an unlisted value 'suspended'", () => {
    expect(statusSchema.safeParse("suspended").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(statusSchema.safeParse("").success).toBe(false);
  });

  it("rejects null", () => {
    expect(statusSchema.safeParse(null).success).toBe(false);
  });

  it("rejects a numeric value", () => {
    expect(statusSchema.safeParse(1).success).toBe(false);
  });

  it("enum options are exactly the three defined values", () => {
    expect(statusSchema.options).toEqual(["active", "inactive", "banned"]);
  });
});

// ---- websiteUrl field: z.url() (new field added in this PR) -----------------

describe("websiteUrl field – z.url() (new PR field)", () => {
  const websiteUrlSchema = z.url();

  it("accepts a valid HTTPS URL", () => {
    expect(websiteUrlSchema.safeParse("https://example.com").success).toBe(true);
  });

  it("accepts a valid HTTP URL", () => {
    expect(websiteUrlSchema.safeParse("http://example.com").success).toBe(true);
  });

  it("accepts a URL with path and query params", () => {
    expect(websiteUrlSchema.safeParse("https://example.com/path?q=1").success).toBe(true);
  });

  it("rejects a plain hostname without protocol", () => {
    expect(websiteUrlSchema.safeParse("example.com").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(websiteUrlSchema.safeParse("").success).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(websiteUrlSchema.safeParse(12345).success).toBe(false);
  });
});

// ---- portfolio field: z.url() (new field added in this PR) ------------------

describe("portfolio field – z.url() (new PR field)", () => {
  const portfolioSchema = z.url();

  it("accepts a valid portfolio URL", () => {
    expect(portfolioSchema.safeParse("https://portfolio.example.com").success).toBe(true);
  });

  it("accepts a URL with subdomain", () => {
    expect(portfolioSchema.safeParse("https://myname.github.io").success).toBe(true);
  });

  it("rejects 'just-text' as portfolio URL", () => {
    expect(portfolioSchema.safeParse("just-text").success).toBe(false);
  });

  it("rejects undefined", () => {
    expect(portfolioSchema.safeParse(undefined).success).toBe(false);
  });
});

// ---- format field: z.string() (new field added in this PR) ------------------

describe("format field – z.string() (new PR field)", () => {
  const formatSchema = z.string();

  it("accepts a non-empty string", () => {
    expect(formatSchema.safeParse("markdown").success).toBe(true);
  });

  it("accepts an empty string (no min constraint)", () => {
    expect(formatSchema.safeParse("").success).toBe(true);
  });

  it("rejects a number", () => {
    expect(formatSchema.safeParse(42).success).toBe(false);
  });

  it("rejects null", () => {
    expect(formatSchema.safeParse(null).success).toBe(false);
  });

  it("rejects undefined", () => {
    expect(formatSchema.safeParse(undefined).success).toBe(false);
  });
});

// ---- profile.joined field indentation fix (no behaviour change) -------------

describe("profile.joined – z.date() (PR indentation fix, no behaviour change)", () => {
  const profileSchema = z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  });

  it("accepts a profile with bio and joined Date", () => {
    const result = profileSchema.safeParse({ bio: "hello", joined: new Date() });
    expect(result.success).toBe(true);
  });

  it("accepts a profile with only joined Date (bio is optional)", () => {
    const result = profileSchema.safeParse({ joined: new Date() });
    expect(result.success).toBe(true);
  });

  it("rejects a string for joined", () => {
    const result = profileSchema.safeParse({ joined: "2023-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects extra unknown keys (strictObject)", () => {
    const result = profileSchema.safeParse({ joined: new Date(), extraKey: "bad" });
    expect(result.success).toBe(false);
  });
});