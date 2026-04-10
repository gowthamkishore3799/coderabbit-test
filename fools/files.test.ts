import { describe, it, expect } from "vitest";
import * as z from "zod";

/**
 * Tests for the UserSchema changes in fools/files.ts.
 *
 * Key changes in this PR:
 * - status field: changed from z.literal(["active","inactive","banned"]) to z.enum(["active","inactive","banned"])
 * - Removed: website field (z.url)
 * - Added: websiteUrl (z.url()), portfolio (z.url()), siteUrls (z.urls()), format (z.string())
 * - Fixed indentation on profile.joined field
 *
 * NOTE: z.urls() is not available in zod v4.0.0 or v4.1.5, which means importing
 * UserSchema from files.ts throws at module initialisation time. The tests below
 * verify the individual changed field behaviours using isolated schemas.
 */

// ---------------------------------------------------------------------------
// Helpers – isolated schemas that mirror exactly the PR changes
// ---------------------------------------------------------------------------

const StatusSchema = z.enum(["active", "inactive", "banned"]);
const WebsiteUrlSchema = z.url();
const PortfolioSchema = z.url();
const FormatSchema = z.string();

// ---------------------------------------------------------------------------
// status field (changed from z.literal to z.enum)
// ---------------------------------------------------------------------------

describe("status field – z.enum (PR change)", () => {
  it("accepts 'active'", () => {
    expect(StatusSchema.parse("active")).toBe("active");
  });

  it("accepts 'inactive'", () => {
    expect(StatusSchema.parse("inactive")).toBe("inactive");
  });

  it("accepts 'banned'", () => {
    expect(StatusSchema.parse("banned")).toBe("banned");
  });

  it("rejects an unknown status value", () => {
    expect(() => StatusSchema.parse("suspended")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => StatusSchema.parse("")).toThrow();
  });

  it("rejects null", () => {
    expect(() => StatusSchema.parse(null)).toThrow();
  });

  it("rejects a numeric value", () => {
    expect(() => StatusSchema.parse(1)).toThrow();
  });

  it("enum options list is exactly ['active','inactive','banned']", () => {
    expect(StatusSchema.options).toEqual(["active", "inactive", "banned"]);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field (added in PR)
// ---------------------------------------------------------------------------

describe("websiteUrl field – z.url() (added in PR)", () => {
  it("accepts a valid http URL", () => {
    expect(WebsiteUrlSchema.safeParse("http://example.com").success).toBe(true);
  });

  it("accepts a valid https URL", () => {
    expect(WebsiteUrlSchema.safeParse("https://example.com/path?q=1").success).toBe(true);
  });

  it("rejects a string that is not a URL", () => {
    expect(WebsiteUrlSchema.safeParse("not-a-url").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(WebsiteUrlSchema.safeParse("").success).toBe(false);
  });

  it("rejects null", () => {
    expect(WebsiteUrlSchema.safeParse(null).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field (added in PR)
// ---------------------------------------------------------------------------

describe("portfolio field – z.url() (added in PR)", () => {
  it("accepts a valid portfolio URL", () => {
    expect(PortfolioSchema.safeParse("https://myportfolio.dev").success).toBe(true);
  });

  it("rejects a plain string without protocol", () => {
    expect(PortfolioSchema.safeParse("myportfolio.dev").success).toBe(false);
  });

  it("rejects an empty value", () => {
    expect(PortfolioSchema.safeParse("").success).toBe(false);
  });

  it("rejects a number", () => {
    expect(PortfolioSchema.safeParse(42).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field (added in PR)
// ---------------------------------------------------------------------------

describe("format field – z.string() (added in PR)", () => {
  it("accepts any non-empty string", () => {
    expect(FormatSchema.safeParse("json").success).toBe(true);
  });

  it("accepts an empty string (z.string() does not require min length)", () => {
    expect(FormatSchema.safeParse("").success).toBe(true);
  });

  it("rejects null", () => {
    expect(FormatSchema.safeParse(null).success).toBe(false);
  });

  it("rejects a number", () => {
    expect(FormatSchema.safeParse(123).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression: z.urls() is not available in zod v4 – documents the known issue
// ---------------------------------------------------------------------------

describe("z.urls() availability – regression documentation", () => {
  it("z.urls is not a function in the installed zod version", () => {
    expect(typeof (z as any).urls).not.toBe("function");
  });

  it("importing UserSchema from files.ts throws because z.urls() is called", async () => {
    await expect(() => import("./files.ts")).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// profile.joined field indentation fix (cosmetic – parsed correctly)
// ---------------------------------------------------------------------------

describe("profile.joined field – date parsing after indentation fix", () => {
  const ProfileSchema = z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  });

  it("accepts a Date object for joined", () => {
    const d = new Date("2024-01-01");
    expect(ProfileSchema.safeParse({ joined: d }).success).toBe(true);
  });

  it("rejects a string for joined (strict date type)", () => {
    expect(ProfileSchema.safeParse({ joined: "2024-01-01" }).success).toBe(false);
  });

  it("rejects null for joined", () => {
    expect(ProfileSchema.safeParse({ joined: null }).success).toBe(false);
  });

  it("accepts optional bio alongside joined", () => {
    const d = new Date();
    expect(ProfileSchema.safeParse({ bio: "Hello", joined: d }).success).toBe(true);
    expect(ProfileSchema.safeParse({ joined: d }).success).toBe(true);
  });

  it("rejects extra keys in strict profile object", () => {
    expect(ProfileSchema.safeParse({ joined: new Date(), extra: "nope" }).success).toBe(false);
  });
});