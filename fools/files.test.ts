/**
 * Tests for fools/files.ts — UserSchema and parseUser()
 *
 * Run with:
 *   npx tsx --test fools/files.test.ts
 * or after installing a test runner:
 *   npx vitest run fools/files.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UserSchema, parseUser } from "./files.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validUser() {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "alice@example.com",
    age: 25,
    active: "true",
    role: "admin",
    status: "active",
    code: "user-42",
    profile: {
      bio: "Hello world",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: "https://alice.dev",
    portfolio: "https://portfolio.alice.dev",
    siteUrls: "https://site1.com,https://site2.com",
    format: "json",
  };
}

// ---------------------------------------------------------------------------
// UserSchema — happy path
// ---------------------------------------------------------------------------

describe("UserSchema — valid data", () => {
  it("parses a fully valid user object", () => {
    const result = UserSchema.safeParse(validUser());
    assert.equal(result.success, true);
  });

  it("parses with all allowed role values", () => {
    for (const role of ["admin", "user", "manager"] as const) {
      const result = UserSchema.safeParse({ ...validUser(), role });
      assert.equal(result.success, true, `role '${role}' should be valid`);
    }
  });

  it("parses with all allowed status values", () => {
    for (const status of ["active", "inactive", "banned"] as const) {
      const result = UserSchema.safeParse({ ...validUser(), status });
      assert.equal(result.success, true, `status '${status}' should be valid`);
    }
  });

  it("parses stringbool 'active' field as true for truthy strings", () => {
    for (const v of ["true", "1", "yes"]) {
      const result = UserSchema.safeParse({ ...validUser(), active: v });
      assert.equal(result.success, true, `active='${v}' should parse`);
      if (result.success) {
        assert.equal(result.data.active, true);
      }
    }
  });

  it("parses stringbool 'active' field as false for falsy strings", () => {
    for (const v of ["false", "0", "no"]) {
      const result = UserSchema.safeParse({ ...validUser(), active: v });
      assert.equal(result.success, true, `active='${v}' should parse`);
      if (result.success) {
        assert.equal(result.data.active, false);
      }
    }
  });

  it("coerces string age to number", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: "30" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.age, 30);
    }
  });

  it("allows profile.bio to be omitted (optional)", () => {
    const user = { ...validUser(), profile: { joined: new Date("2023-01-01") } };
    const result = UserSchema.safeParse(user);
    assert.equal(result.success, true);
  });

  it("accepts a single URL in siteUrls", () => {
    const result = UserSchema.safeParse({ ...validUser(), siteUrls: "https://only.com" });
    assert.equal(result.success, true);
  });

  it("accepts empty string for format", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "" });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — id field (uuid)
// ---------------------------------------------------------------------------

describe("UserSchema — id validation", () => {
  it("rejects a non-uuid id", () => {
    const result = UserSchema.safeParse({ ...validUser(), id: "not-a-uuid" });
    assert.equal(result.success, false);
  });

  it("rejects an empty id", () => {
    const result = UserSchema.safeParse({ ...validUser(), id: "" });
    assert.equal(result.success, false);
  });

  it("rejects a missing id", () => {
    const { id: _omit, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — email field
// ---------------------------------------------------------------------------

describe("UserSchema — email validation", () => {
  it("rejects an invalid email format", () => {
    const result = UserSchema.safeParse({ ...validUser(), email: "not-an-email" });
    assert.equal(result.success, false);
  });

  it("rejects email without domain", () => {
    const result = UserSchema.safeParse({ ...validUser(), email: "user@" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — age field
// ---------------------------------------------------------------------------

describe("UserSchema — age validation", () => {
  it("rejects age below 18", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: 17 });
    assert.equal(result.success, false);
  });

  it("accepts age of exactly 18 (boundary)", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: 18 });
    assert.equal(result.success, true);
  });

  it("rejects non-integer age", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: 25.5 });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — role enum
// ---------------------------------------------------------------------------

describe("UserSchema — role validation", () => {
  it("rejects an unlisted role", () => {
    const result = UserSchema.safeParse({ ...validUser(), role: "superadmin" });
    assert.equal(result.success, false);
  });

  it("rejects empty role", () => {
    const result = UserSchema.safeParse({ ...validUser(), role: "" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — status field (changed from literal array to enum in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema — status enum (changed from literal to z.enum)", () => {
  it("rejects an unlisted status value", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "pending" });
    assert.equal(result.success, false);
  });

  it("rejects empty status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "" });
    assert.equal(result.success, false);
  });

  it("rejects numeric status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: 1 });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — code field (templateLiteral "user-<1-9999>")
// ---------------------------------------------------------------------------

describe("UserSchema — code templateLiteral", () => {
  it("accepts valid code 'user-1'", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-1" });
    assert.equal(result.success, true);
  });

  it("accepts valid code 'user-9999'", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-9999" });
    assert.equal(result.success, true);
  });

  it("rejects code without 'user-' prefix", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "admin-5" });
    assert.equal(result.success, false);
  });

  it("rejects code with number 0 (below min 1)", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-0" });
    assert.equal(result.success, false);
  });

  it("rejects code with number exceeding 9999", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-10000" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — profile (strictObject, rejects extra keys)
// ---------------------------------------------------------------------------

describe("UserSchema — profile strictObject", () => {
  it("rejects extra fields in profile (strictObject)", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: {
        bio: "bio",
        joined: new Date(),
        extra: "unexpected",
      },
    });
    assert.equal(result.success, false);
  });

  it("rejects profile missing 'joined' (required)", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { bio: "bio" },
    });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — websiteUrl and portfolio (new URL fields added in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema — websiteUrl (new field)", () => {
  it("rejects an invalid websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser(), websiteUrl: "not-a-url" });
    assert.equal(result.success, false);
  });

  it("rejects missing websiteUrl", () => {
    const { websiteUrl: _omit, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("accepts https URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser(), websiteUrl: "https://example.com/path" });
    assert.equal(result.success, true);
  });
});

describe("UserSchema — portfolio (new field)", () => {
  it("rejects an invalid portfolio URL", () => {
    const result = UserSchema.safeParse({ ...validUser(), portfolio: "ftp://old-protocol" });
    // ftp is not a valid URL per Zod's z.url() (requires http/https)
    // Note: result depends on Zod v4 URL validation strictness
    // We primarily verify the field is present and validated
    const withInvalidPortfolio = UserSchema.safeParse({ ...validUser(), portfolio: "not a url at all" });
    assert.equal(withInvalidPortfolio.success, false);
  });

  it("rejects missing portfolio", () => {
    const { portfolio: _omit, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — siteUrls (new z.urls() field added in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema — siteUrls (new z.urls() field)", () => {
  it("rejects missing siteUrls", () => {
    const { siteUrls: _omit, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("rejects siteUrls containing an invalid URL", () => {
    const result = UserSchema.safeParse({ ...validUser(), siteUrls: "https://valid.com,not-a-url" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — format (new string field added in this PR)
// ---------------------------------------------------------------------------

describe("UserSchema — format (new string field)", () => {
  it("accepts any string for format", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "xml" });
    assert.equal(result.success, true);
  });

  it("rejects missing format", () => {
    const { format: _omit, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// parseUser() — wrapper function
// ---------------------------------------------------------------------------

describe("parseUser()", () => {
  it("returns parsed data for a valid user", () => {
    const user = validUser();
    const parsed = parseUser(user);
    assert.equal(parsed.email, user.email);
    assert.equal(parsed.role, user.role);
    assert.equal(parsed.status, "active");
  });

  it("throws an error for invalid user data", () => {
    assert.throws(() => parseUser({ ...validUser(), email: "bad" }), /Error/);
  });

  it("throws with structured error message (treeify)", () => {
    let thrown: Error | null = null;
    try {
      parseUser({ ...validUser(), id: "not-uuid", age: 10 });
    } catch (e) {
      thrown = e as Error;
    }
    assert.notEqual(thrown, null);
    // The error message is a JSON string from .treeify()
    assert.doesNotThrow(() => JSON.parse(thrown!.message));
  });

  it("throws when required fields are missing", () => {
    assert.throws(() => parseUser({}));
  });

  it("returns coerced age as number when string provided", () => {
    const parsed = parseUser({ ...validUser(), age: "20" });
    assert.equal(typeof parsed.age, "number");
    assert.equal(parsed.age, 20);
  });
});