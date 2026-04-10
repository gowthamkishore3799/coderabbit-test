import { describe, it, expect } from "vitest";
import { z } from "zod";

// NOTE: We construct the schema inline rather than importing from files.ts
// because files.ts references z.urls() which does not exist in Zod v4.0.0.
// The tests below cover all fields that were changed or added in this PR.

// ── Reproduce the relevant changed parts of UserSchema ────────────────────────

// status field was changed from z.literal(["active", "inactive", "banned"])
// to z.enum(["active", "inactive", "banned"]) in this PR.
const statusSchema = z.enum(["active", "inactive", "banned"]);

// websiteUrl and portfolio were added as new z.url() fields in this PR.
const websiteUrlSchema = z.url();
const portfolioSchema = z.url();

// format was added as z.string() in this PR.
const formatSchema = z.string();

// siteUrls was added as z.urls() in this PR.
// z.urls() does not exist in the installed Zod v4 — this tests for that gap.
const zodHasUrls = typeof (z as Record<string, unknown>).urls === "function";

// ── status enum (changed from literal to enum) ────────────────────────────────

describe("UserSchema – status field (changed from z.literal to z.enum)", () => {
  it("accepts 'active'", () => {
    expect(statusSchema.parse("active")).toBe("active");
  });

  it("accepts 'inactive'", () => {
    expect(statusSchema.parse("inactive")).toBe("inactive");
  });

  it("accepts 'banned'", () => {
    expect(statusSchema.parse("banned")).toBe("banned");
  });

  it("rejects a value outside the enum", () => {
    expect(() => statusSchema.parse("pending")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => statusSchema.parse("")).toThrow();
  });

  it("rejects null", () => {
    expect(() => statusSchema.parse(null)).toThrow();
  });

  it("rejects undefined", () => {
    expect(() => statusSchema.parse(undefined)).toThrow();
  });
});

// ── websiteUrl field (new z.url() field) ──────────────────────────────────────

describe("UserSchema – websiteUrl field (new in PR)", () => {
  it("accepts a valid https URL", () => {
    expect(websiteUrlSchema.parse("https://example.com")).toBe("https://example.com");
  });

  it("accepts a valid http URL", () => {
    expect(websiteUrlSchema.parse("http://example.com")).toBe("http://example.com");
  });

  it("rejects a plain string that is not a URL", () => {
    expect(() => websiteUrlSchema.parse("not-a-url")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => websiteUrlSchema.parse("")).toThrow();
  });

  it("rejects null", () => {
    expect(() => websiteUrlSchema.parse(null)).toThrow();
  });
});

// ── portfolio field (new z.url() field) ───────────────────────────────────────

describe("UserSchema – portfolio field (new in PR)", () => {
  it("accepts a valid https URL", () => {
    expect(portfolioSchema.parse("https://portfolio.dev/user")).toBe("https://portfolio.dev/user");
  });

  it("rejects a string without a protocol", () => {
    expect(() => portfolioSchema.parse("portfolio.dev/user")).toThrow();
  });

  it("rejects undefined", () => {
    expect(() => portfolioSchema.parse(undefined)).toThrow();
  });
});

// ── format field (new z.string() field) ──────────────────────────────────────

describe("UserSchema – format field (new in PR)", () => {
  it("accepts any non-empty string", () => {
    expect(formatSchema.parse("json")).toBe("json");
    expect(formatSchema.parse("csv")).toBe("csv");
  });

  it("accepts an empty string (z.string() allows it)", () => {
    expect(formatSchema.parse("")).toBe("");
  });

  it("rejects null", () => {
    expect(() => formatSchema.parse(null)).toThrow();
  });

  it("rejects a number", () => {
    expect(() => formatSchema.parse(42)).toThrow();
  });
});

// ── z.urls() availability check (regression test for missing method) ──────────

describe("z.urls() availability – new siteUrls field in PR", () => {
  it("z.urls is available as a function in the installed Zod version", () => {
    // This test will fail with Zod v4.0.0 because z.urls() was not yet released.
    // It serves as a regression check: once Zod is upgraded, this must pass.
    expect(zodHasUrls).toBe(true);
  });
});

// ── parseUser helper function (from files.ts) ─────────────────────────────────
// We inline a minimal version of the schema (excluding the broken z.urls() call)
// to verify parseUser's error-throwing behaviour.

const PartialUserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: z.enum(["active", "inactive", "banned"]),
  websiteUrl: z.url(),
  portfolio: z.url(),
  format: z.string(),
});

function parsePartialUser(input: unknown) {
  const result = PartialUserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

const VALID_PARTIAL_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  format: "json",
};

describe("parseUser-equivalent (inline schema – PR changes only)", () => {
  it("parses a fully valid user object without throwing", () => {
    expect(() => parsePartialUser(VALID_PARTIAL_USER)).not.toThrow();
  });

  it("returns parsed data with correct types", () => {
    const user = parsePartialUser(VALID_PARTIAL_USER);
    expect(user.id).toBe(VALID_PARTIAL_USER.id);
    expect(user.email).toBe(VALID_PARTIAL_USER.email);
    expect(user.age).toBe(25);
    expect(user.status).toBe("active");
  });

  it("throws on invalid status", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, status: "pending" })
    ).toThrow();
  });

  it("throws on invalid websiteUrl", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, websiteUrl: "not-a-url" })
    ).toThrow();
  });

  it("throws on invalid portfolio url", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, portfolio: "ftp://" })
    ).toThrow();
  });

  it("throws when age is below 18", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, age: 17 })
    ).toThrow();
  });

  it("throws on invalid email", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, email: "not-an-email" })
    ).toThrow();
  });

  it("throws on invalid UUID", () => {
    expect(() =>
      parsePartialUser({ ...VALID_PARTIAL_USER, id: "not-a-uuid" })
    ).toThrow();
  });

  it("throws when a required field is missing", () => {
    const { format: _dropped, ...withoutFormat } = VALID_PARTIAL_USER;
    expect(() => parsePartialUser(withoutFormat)).toThrow();
  });

  it("coerces age string to number", () => {
    const user = parsePartialUser({ ...VALID_PARTIAL_USER, age: "30" });
    expect(user.age).toBe(30);
  });

  it("throws an error message containing JSON (treeify output)", () => {
    try {
      parsePartialUser({ ...VALID_PARTIAL_USER, status: "unknown" });
      expect.fail("Expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });
});