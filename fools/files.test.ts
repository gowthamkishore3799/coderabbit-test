/**
 * Tests for UserSchema in files.ts
 *
 * Changes in this PR:
 * - `status` changed from z.literal([...]) to z.enum(["active", "inactive", "banned"])
 * - Removed `website` field (z.url())
 * - Added `websiteUrl` (z.url()), `portfolio` (z.url()), `siteUrls` (z.urls()), `format` (z.string())
 * - `joined` field indentation fix (no behaviour change)
 *
 * Run (after npm install in fools/):
 *   node --experimental-strip-types --test fools/files.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UserSchema, parseUser } from "./files.js";

// Minimal valid base object satisfying every field.
function validUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: "25",            // coerced from string
    active: "true",       // z.stringbool()
    role: "admin",
    status: "active",
    code: "user-42",      // matches templateLiteral "user-" + number 1-9999
    profile: {
      bio: "Hello",
      joined: new Date("2024-01-01"),
    },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    siteUrls: ["https://a.com", "https://b.com"],
    format: "json",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// status field — changed from z.literal to z.enum
// ---------------------------------------------------------------------------
describe("UserSchema.status (z.enum)", () => {
  it("accepts 'active'", () => {
    const result = UserSchema.safeParse(validUser({ status: "active" }));
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.status, "active");
  });

  it("accepts 'inactive'", () => {
    const result = UserSchema.safeParse(validUser({ status: "inactive" }));
    assert.equal(result.success, true);
  });

  it("accepts 'banned'", () => {
    const result = UserSchema.safeParse(validUser({ status: "banned" }));
    assert.equal(result.success, true);
  });

  it("rejects an unlisted value like 'suspended'", () => {
    const result = UserSchema.safeParse(validUser({ status: "suspended" }));
    assert.equal(result.success, false);
  });

  it("rejects an empty string", () => {
    const result = UserSchema.safeParse(validUser({ status: "" }));
    assert.equal(result.success, false);
  });

  it("rejects undefined (required field)", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).status;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl — new URL field added in this PR
// ---------------------------------------------------------------------------
describe("UserSchema.websiteUrl (z.url)", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: "https://example.com" }));
    assert.equal(result.success, true);
  });

  it("accepts a valid HTTP URL", () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: "http://example.org/path?q=1" }));
    assert.equal(result.success, true);
  });

  it("rejects a plain string that is not a URL", () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: "not-a-url" }));
    assert.equal(result.success, false);
  });

  it("rejects an empty string", () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: "" }));
    assert.equal(result.success, false);
  });

  it("rejects undefined (required field)", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).websiteUrl;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// portfolio — new URL field added in this PR
// ---------------------------------------------------------------------------
describe("UserSchema.portfolio (z.url)", () => {
  it("accepts a valid URL", () => {
    const result = UserSchema.safeParse(validUser({ portfolio: "https://my-portfolio.dev" }));
    assert.equal(result.success, true);
  });

  it("rejects a non-URL string", () => {
    const result = UserSchema.safeParse(validUser({ portfolio: "my-portfolio" }));
    assert.equal(result.success, false);
  });

  it("rejects undefined (required field)", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).portfolio;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls — new z.urls() field added in this PR
// ---------------------------------------------------------------------------
describe("UserSchema.siteUrls (z.urls)", () => {
  it("accepts an array of valid URLs", () => {
    const result = UserSchema.safeParse(
      validUser({ siteUrls: ["https://a.com", "https://b.org"] })
    );
    assert.equal(result.success, true);
  });

  it("accepts an empty array", () => {
    const result = UserSchema.safeParse(validUser({ siteUrls: [] }));
    // z.urls() typically accepts an empty list as valid
    assert.equal(result.success, true);
  });

  it("rejects an array containing a non-URL entry", () => {
    const result = UserSchema.safeParse(
      validUser({ siteUrls: ["https://good.com", "not-a-url"] })
    );
    assert.equal(result.success, false);
  });

  it("rejects undefined (required field)", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).siteUrls;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// format — new plain string field added in this PR
// ---------------------------------------------------------------------------
describe("UserSchema.format (z.string)", () => {
  it("accepts any non-empty string", () => {
    const result = UserSchema.safeParse(validUser({ format: "csv" }));
    assert.equal(result.success, true);
  });

  it("accepts an empty string (z.string has no min constraint)", () => {
    const result = UserSchema.safeParse(validUser({ format: "" }));
    assert.equal(result.success, true);
  });

  it("rejects undefined (required field)", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).format;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });

  it("rejects a non-string value", () => {
    const result = UserSchema.safeParse(validUser({ format: 42 }));
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// website field — removed in this PR (should no longer be accepted as a key)
// ---------------------------------------------------------------------------
describe("UserSchema — removed 'website' field", () => {
  it("ignores unexpected 'website' key (schema strips unknown keys by default)", () => {
    // z.object() (non-strict) strips unknown keys, so extra keys don't cause failure
    const result = UserSchema.safeParse(validUser({ website: "https://old-field.com" }));
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(result.data, "website"),
        false,
        "parsed result should not contain the removed 'website' field"
      );
    }
  });
});

// ---------------------------------------------------------------------------
// parseUser helper — tests the error throwing path
// ---------------------------------------------------------------------------
describe("parseUser helper", () => {
  it("returns parsed data for a valid user", () => {
    const user = parseUser(validUser());
    assert.equal(user.status, "active");
    assert.equal(user.format, "json");
  });

  it("throws for an invalid user", () => {
    assert.throws(() => parseUser({ id: "not-a-uuid" }), /Error/);
  });

  it("preserves coerced age as a number", () => {
    const user = parseUser(validUser({ age: "30" }));
    assert.equal(typeof user.age, "number");
    assert.equal(user.age, 30);
  });

  it("rejects age below 18", () => {
    assert.throws(() => parseUser(validUser({ age: "17" })));
  });
});

// ---------------------------------------------------------------------------
// Full valid object round-trip
// ---------------------------------------------------------------------------
describe("UserSchema full round-trip", () => {
  it("parses a fully valid user object without errors", () => {
    const input = validUser();
    const result = UserSchema.safeParse(input);
    assert.equal(result.success, true, "Expected full valid user to parse successfully");
  });

  it("preserves all new fields in the parsed output", () => {
    const result = UserSchema.safeParse(validUser());
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.websiteUrl, "https://example.com");
      assert.equal(result.data.portfolio, "https://portfolio.example.com");
      assert.deepEqual(result.data.siteUrls, ["https://a.com", "https://b.com"]);
      assert.equal(result.data.format, "json");
    }
  });
});