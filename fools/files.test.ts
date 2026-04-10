/**
 * Tests for fools/files.ts — UserSchema and parseUser
 *
 * Covers the changes introduced in this PR:
 *   - `status` changed from z.literal([...]) to z.enum(["active","inactive","banned"])
 *   - `website` field removed
 *   - `websiteUrl`, `portfolio`, `siteUrls`, `format` fields added
 *   - `profile.joined` indentation fix (no behaviour change)
 *
 * Run:
 *   node --experimental-strip-types --experimental-vm-modules fools/files.test.ts
 * (requires `zod` installed: cd fools && npm install)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { UserSchema, parseUser } from "./files.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "user",
    status: "active",
    code: "user-42",
    profile: {
      bio: "A short bio",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    siteUrls: ["https://site1.com", "https://site2.com"],
    format: "json",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// UserSchema – valid input
// ---------------------------------------------------------------------------

describe("UserSchema – valid inputs", () => {
  test("parses a fully valid user object", () => {
    const result = UserSchema.safeParse(validInput());
    assert.equal(result.success, true);
  });

  test("coerces age from string to number", () => {
    const result = UserSchema.safeParse(validInput({ age: "30" }));
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.age, 30);
  });

  test("accepts active as 'false'", () => {
    const result = UserSchema.safeParse(validInput({ active: "false" }));
    assert.equal(result.success, true);
  });

  test("accepts role 'admin'", () => {
    const result = UserSchema.safeParse(validInput({ role: "admin" }));
    assert.equal(result.success, true);
  });

  test("accepts role 'manager'", () => {
    const result = UserSchema.safeParse(validInput({ role: "manager" }));
    assert.equal(result.success, true);
  });

  test("accepts profile without bio (optional field)", () => {
    const result = UserSchema.safeParse(
      validInput({ profile: { joined: new Date("2023-06-15") } })
    );
    assert.equal(result.success, true);
  });

  test("accepts empty siteUrls array", () => {
    const result = UserSchema.safeParse(validInput({ siteUrls: [] }));
    assert.equal(result.success, true);
  });

  test("accepts empty format string", () => {
    const result = UserSchema.safeParse(validInput({ format: "" }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// status field – enum (changed from z.literal in this PR)
// ---------------------------------------------------------------------------

describe("status field – z.enum change", () => {
  test("accepts status 'active'", () => {
    const result = UserSchema.safeParse(validInput({ status: "active" }));
    assert.equal(result.success, true);
  });

  test("accepts status 'inactive'", () => {
    const result = UserSchema.safeParse(validInput({ status: "inactive" }));
    assert.equal(result.success, true);
  });

  test("accepts status 'banned'", () => {
    const result = UserSchema.safeParse(validInput({ status: "banned" }));
    assert.equal(result.success, true);
  });

  test("rejects an unknown status value", () => {
    const result = UserSchema.safeParse(validInput({ status: "pending" }));
    assert.equal(result.success, false);
  });

  test("rejects null status", () => {
    const result = UserSchema.safeParse(validInput({ status: null }));
    assert.equal(result.success, false);
  });

  test("rejects missing status field", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["status"];
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// New fields added in this PR: websiteUrl, portfolio, siteUrls, format
// ---------------------------------------------------------------------------

describe("websiteUrl field – new in this PR", () => {
  test("rejects a missing websiteUrl", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["websiteUrl"];
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  test("rejects an invalid websiteUrl", () => {
    const result = UserSchema.safeParse(validInput({ websiteUrl: "not-a-url" }));
    assert.equal(result.success, false);
  });

  test("accepts a valid websiteUrl", () => {
    const result = UserSchema.safeParse(validInput({ websiteUrl: "https://my-site.io" }));
    assert.equal(result.success, true);
  });
});

describe("portfolio field – new in this PR", () => {
  test("rejects a missing portfolio", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["portfolio"];
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  test("rejects an invalid portfolio URL", () => {
    const result = UserSchema.safeParse(validInput({ portfolio: "ftp://bad" }));
    assert.equal(result.success, false);
  });

  test("accepts a valid portfolio URL", () => {
    const result = UserSchema.safeParse(validInput({ portfolio: "https://portfolio.dev" }));
    assert.equal(result.success, true);
  });
});

describe("siteUrls field – new in this PR", () => {
  test("rejects a missing siteUrls field", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["siteUrls"];
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  test("accepts multiple valid URLs in siteUrls", () => {
    const result = UserSchema.safeParse(
      validInput({ siteUrls: ["https://a.com", "https://b.org"] })
    );
    assert.equal(result.success, true);
  });
});

describe("format field – new in this PR", () => {
  test("rejects a missing format field", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["format"];
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, false);
  });

  test("accepts any non-empty format string", () => {
    const result = UserSchema.safeParse(validInput({ format: "csv" }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Removed field: website should NOT be expected any more
// ---------------------------------------------------------------------------

describe("website field – removed in this PR", () => {
  test("schema still succeeds when legacy 'website' key is provided (extra keys stripped or ignored)", () => {
    // UserSchema is not a strictObject at the top level, so extra keys may pass through or be stripped
    // The key assertion is that the schema does NOT require 'website'
    const result = UserSchema.safeParse(validInput({ website: "https://legacy.com" }));
    // Should still succeed – the extra key is either stripped or ignored by Zod
    assert.equal(result.success, true);
  });

  test("schema succeeds without providing 'website' key", () => {
    const result = UserSchema.safeParse(validInput());
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// id field – top-level uuid validator
// ---------------------------------------------------------------------------

describe("id field – z.uuid()", () => {
  test("rejects a non-UUID id", () => {
    const result = UserSchema.safeParse(validInput({ id: "not-a-uuid" }));
    assert.equal(result.success, false);
  });

  test("accepts a valid UUID", () => {
    const result = UserSchema.safeParse(
      validInput({ id: "123e4567-e89b-12d3-a456-426614174000" })
    );
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// age field – minimum 18
// ---------------------------------------------------------------------------

describe("age field – minimum 18", () => {
  test("rejects age below 18", () => {
    const result = UserSchema.safeParse(validInput({ age: 17 }));
    assert.equal(result.success, false);
  });

  test("accepts age exactly 18", () => {
    const result = UserSchema.safeParse(validInput({ age: 18 }));
    assert.equal(result.success, true);
  });

  test("accepts age well above 18", () => {
    const result = UserSchema.safeParse(validInput({ age: 99 }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// profile.joined – z.date() (strictObject)
// ---------------------------------------------------------------------------

describe("profile.joined – z.date() in strictObject", () => {
  test("rejects a string date for joined", () => {
    const result = UserSchema.safeParse(
      validInput({ profile: { bio: "bio", joined: "2023-01-01" } })
    );
    assert.equal(result.success, false);
  });

  test("accepts a Date instance for joined", () => {
    const result = UserSchema.safeParse(
      validInput({ profile: { bio: "bio", joined: new Date() } })
    );
    assert.equal(result.success, true);
  });

  test("rejects extra keys in strict profile object", () => {
    const result = UserSchema.safeParse(
      validInput({ profile: { bio: "bio", joined: new Date(), extra: "field" } })
    );
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// parseUser – success and error paths
// ---------------------------------------------------------------------------

describe("parseUser()", () => {
  test("returns typed User data for valid input", () => {
    const user = parseUser(validInput());
    assert.equal(user.status, "active");
    assert.equal(typeof user.websiteUrl, "string");
    assert.equal(typeof user.format, "string");
  });

  test("throws for invalid input (missing required fields)", () => {
    assert.throws(() => parseUser({}), /Error/);
  });

  test("throws a JSON error string for schema violations", () => {
    assert.throws(() => parseUser(validInput({ status: "invalid" })), (err: unknown) => {
      assert.ok(err instanceof Error);
      return true;
    });
  });

  test("returned data contains the new status enum value", () => {
    const user = parseUser(validInput({ status: "banned" }));
    assert.equal(user.status, "banned");
  });

  test("returned data includes websiteUrl and portfolio", () => {
    const user = parseUser(
      validInput({ websiteUrl: "https://ws.example.com", portfolio: "https://pf.example.com" })
    );
    assert.equal(user.websiteUrl, "https://ws.example.com");
    assert.equal(user.portfolio, "https://pf.example.com");
  });
});