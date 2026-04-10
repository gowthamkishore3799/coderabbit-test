/**
 * Tests for UserSchema in files.ts
 *
 * Run: node --experimental-strip-types --test fools/files.test.ts
 * (requires dependencies installed: npm install)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UserSchema, parseUser } from "./files.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_EMAIL = "user@example.com";
const VALID_URL = "https://example.com";

function validBase() {
  return {
    id: VALID_UUID,
    email: VALID_EMAIL,
    age: 25,
    active: "true",
    role: "admin" as const,
    status: "active" as const,
    code: "user-1",
    profile: {
      bio: "A short bio",
      joined: new Date("2024-01-01"),
    },
    websiteUrl: VALID_URL,
    portfolio: "https://portfolio.dev",
    siteUrls: ["https://site1.com", "https://site2.com"],
    format: "json",
  };
}

// ---------------------------------------------------------------------------
// status field (changed from z.literal to z.enum in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema – status field (enum change)", () => {
  it("accepts 'active'", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: "active" });
    assert.ok(result.success, "expected 'active' to be accepted");
  });

  it("accepts 'inactive'", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: "inactive" });
    assert.ok(result.success, "expected 'inactive' to be accepted");
  });

  it("accepts 'banned'", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: "banned" });
    assert.ok(result.success, "expected 'banned' to be accepted");
  });

  it("rejects an unknown status value", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: "pending" });
    assert.equal(result.success, false, "expected 'pending' to be rejected");
  });

  it("rejects an empty string for status", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: "" });
    assert.equal(result.success, false);
  });

  it("rejects a numeric status", () => {
    const result = UserSchema.safeParse({ ...validBase(), status: 1 });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field (new field added in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema – websiteUrl field (new)", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = UserSchema.safeParse({ ...validBase(), websiteUrl: "https://example.com" });
    assert.ok(result.success);
  });

  it("accepts a valid HTTP URL", () => {
    const result = UserSchema.safeParse({ ...validBase(), websiteUrl: "http://example.com" });
    assert.ok(result.success);
  });

  it("rejects a non-URL string", () => {
    const result = UserSchema.safeParse({ ...validBase(), websiteUrl: "not-a-url" });
    assert.equal(result.success, false);
  });

  it("rejects an empty string", () => {
    const result = UserSchema.safeParse({ ...validBase(), websiteUrl: "" });
    assert.equal(result.success, false);
  });

  it("rejects when websiteUrl is missing", () => {
    const { websiteUrl, ...rest } = validBase();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field (new field added in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema – portfolio field (new)", () => {
  it("accepts a valid URL", () => {
    const result = UserSchema.safeParse({ ...validBase(), portfolio: "https://myportfolio.io" });
    assert.ok(result.success);
  });

  it("rejects an invalid URL", () => {
    const result = UserSchema.safeParse({ ...validBase(), portfolio: "ftp//no-scheme" });
    assert.equal(result.success, false);
  });

  it("rejects when portfolio is missing", () => {
    const { portfolio, ...rest } = validBase();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls field (new field added in this PR – uses z.urls())
// ---------------------------------------------------------------------------

describe("UserSchema – siteUrls field (new, z.urls())", () => {
  it("accepts an array of valid URLs", () => {
    const result = UserSchema.safeParse({
      ...validBase(),
      siteUrls: ["https://a.com", "https://b.com"],
    });
    assert.ok(result.success);
  });

  it("accepts an empty array", () => {
    const result = UserSchema.safeParse({ ...validBase(), siteUrls: [] });
    assert.ok(result.success);
  });

  it("rejects when siteUrls contains an invalid URL", () => {
    const result = UserSchema.safeParse({
      ...validBase(),
      siteUrls: ["https://valid.com", "not-a-url"],
    });
    assert.equal(result.success, false);
  });

  it("rejects when siteUrls is missing", () => {
    const { siteUrls, ...rest } = validBase();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("rejects a plain string instead of array", () => {
    const result = UserSchema.safeParse({ ...validBase(), siteUrls: "https://example.com" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// format field (new field added in this PR – z.string())
// ---------------------------------------------------------------------------

describe("UserSchema – format field (new, z.string())", () => {
  it("accepts any non-empty string", () => {
    const result = UserSchema.safeParse({ ...validBase(), format: "yaml" });
    assert.ok(result.success);
  });

  it("accepts an empty string (z.string() has no minLength here)", () => {
    const result = UserSchema.safeParse({ ...validBase(), format: "" });
    assert.ok(result.success);
  });

  it("rejects when format is missing", () => {
    const { format, ...rest } = validBase();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("rejects when format is a number", () => {
    const result = UserSchema.safeParse({ ...validBase(), format: 42 });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// parseUser() function
// ---------------------------------------------------------------------------

describe("parseUser()", () => {
  it("returns parsed data for a valid input", () => {
    const input = validBase();
    const user = parseUser(input);
    assert.equal(user.status, "active");
    assert.equal(user.format, "json");
    assert.equal(user.websiteUrl, VALID_URL);
  });

  it("throws an Error for invalid input", () => {
    assert.throws(
      () => parseUser({ ...validBase(), status: "invalid" }),
      (err: unknown) => err instanceof Error
    );
  });

  it("throws for missing required fields", () => {
    assert.throws(
      () => parseUser({}),
      (err: unknown) => err instanceof Error
    );
  });

  it("throws with JSON-serialisable error details", () => {
    assert.throws(() => parseUser({ ...validBase(), email: "bad-email" }), (err: unknown) => {
      assert.ok(err instanceof Error);
      // message should be parseable JSON (uses treeify())
      assert.doesNotThrow(() => JSON.parse(err.message));
      return true;
    });
  });

  it("preserves all enum values in the returned object", () => {
    const statuses = ["active", "inactive", "banned"] as const;
    for (const status of statuses) {
      const user = parseUser({ ...validBase(), status });
      assert.equal(user.status, status);
    }
  });
});

// ---------------------------------------------------------------------------
// Pre-existing fields not broken by the PR changes
// ---------------------------------------------------------------------------

describe("UserSchema – pre-existing fields still work after PR changes", () => {
  it("validates a complete valid user object", () => {
    const result = UserSchema.safeParse(validBase());
    assert.ok(result.success, `Unexpected error: ${!result.success ? JSON.stringify(result.error) : ""}`);
  });

  it("rejects underage user (age < 18)", () => {
    const result = UserSchema.safeParse({ ...validBase(), age: 17 });
    assert.equal(result.success, false);
  });

  it("rejects invalid email", () => {
    const result = UserSchema.safeParse({ ...validBase(), email: "not-an-email" });
    assert.equal(result.success, false);
  });

  it("rejects invalid UUID for id", () => {
    const result = UserSchema.safeParse({ ...validBase(), id: "not-a-uuid" });
    assert.equal(result.success, false);
  });

  it("accepts 'user' and 'manager' roles (role enum unchanged)", () => {
    for (const role of ["user", "manager"] as const) {
      const result = UserSchema.safeParse({ ...validBase(), role });
      assert.ok(result.success, `role '${role}' should be accepted`);
    }
  });

  it("parses stringbool 'false' for active field", () => {
    const result = UserSchema.safeParse({ ...validBase(), active: "false" });
    assert.ok(result.success);
    if (result.success) {
      assert.equal(result.data.active, false);
    }
  });
});