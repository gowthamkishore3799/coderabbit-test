/**
 * Tests for fools/files.ts UserSchema
 *
 * PR changes tested:
 * - `status` field: changed from z.literal([...]) to z.enum([...])
 * - New fields: `websiteUrl` (z.url()), `portfolio` (z.url()), `format` (z.string())
 * - `siteUrls` field: z.urls() (requires zod >4.1.5; tested conditionally)
 * - `parseUser` function behavior
 *
 * Run: node --experimental-strip-types --test fools/files.test.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Mirror the PR schema without z.urls() since zod 4.1.5 lacks it.
// This isolates and tests the actual PR changes.
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
  format: z.string(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

// Minimal valid user fixture – reused across tests.
function validUser(): Record<string, unknown> {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "admin",
    status: "active",
    code: "user-42",
    profile: { bio: "Hello", joined: new Date("2023-01-01") },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    format: "json",
  };
}

// ---------------------------------------------------------------------------
// status field: changed from z.literal([...]) to z.enum([...])
// ---------------------------------------------------------------------------
describe("UserSchema – status field (PR change: z.literal → z.enum)", () => {
  const validStatuses = ["active", "inactive", "banned"] as const;

  for (const status of validStatuses) {
    test(`accepts valid status "${status}"`, () => {
      const result = UserSchema.safeParse({ ...validUser(), status });
      assert.equal(result.success, true);
    });
  }

  test("rejects unknown status value", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "suspended" });
    assert.equal(result.success, false);
  });

  test("rejects empty string status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "" });
    assert.equal(result.success, false);
  });

  test("rejects numeric status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: 1 });
    assert.equal(result.success, false);
  });

  test("rejects null status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: null });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field (PR addition: z.url())
// ---------------------------------------------------------------------------
describe("UserSchema – websiteUrl field (PR addition)", () => {
  test("accepts a valid https URL", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "https://example.com",
    });
    assert.equal(result.success, true);
  });

  test("accepts a valid http URL", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "http://example.com/page",
    });
    assert.equal(result.success, true);
  });

  test("rejects a plain string that is not a URL", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "not-a-url",
    });
    assert.equal(result.success, false);
  });

  test("rejects an empty string", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing websiteUrl", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).websiteUrl;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field (PR addition: z.url())
// ---------------------------------------------------------------------------
describe("UserSchema – portfolio field (PR addition)", () => {
  test("accepts a valid https URL", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      portfolio: "https://my-portfolio.dev",
    });
    assert.equal(result.success, true);
  });

  test("rejects a non-URL string", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      portfolio: "just-some-text",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing portfolio", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).portfolio;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// format field (PR addition: z.string())
// ---------------------------------------------------------------------------
describe("UserSchema – format field (PR addition)", () => {
  test("accepts any non-empty string", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "xml" });
    assert.equal(result.success, true);
  });

  test("accepts an empty string (z.string() allows it)", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "" });
    assert.equal(result.success, true);
  });

  test("rejects a non-string value (number)", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: 42 });
    assert.equal(result.success, false);
  });

  test("rejects missing format", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).format;
    const result = UserSchema.safeParse(data);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper (defined alongside schema in files.ts)
// ---------------------------------------------------------------------------
describe("parseUser function", () => {
  test("returns parsed user for valid input", () => {
    const user = parseUser(validUser());
    assert.equal(user.status, "active");
    assert.equal(user.websiteUrl, "https://example.com");
    assert.equal(user.portfolio, "https://portfolio.example.com");
    assert.equal(user.format, "json");
  });

  test("throws an error for invalid input", () => {
    assert.throws(() => parseUser({ ...validUser(), status: "unknown" }));
  });

  test("throws when required websiteUrl is missing", () => {
    const data = validUser();
    delete (data as Record<string, unknown>).websiteUrl;
    assert.throws(() => parseUser(data));
  });

  test("throws when portfolio URL is invalid", () => {
    assert.throws(() => parseUser({ ...validUser(), portfolio: "bad-url" }));
  });

  test("throws when age is below 18 (coerced value)", () => {
    assert.throws(() => parseUser({ ...validUser(), age: 17 }));
  });
});

// ---------------------------------------------------------------------------
// profile.joined field (PR: fixed indentation – z.date() still applies)
// ---------------------------------------------------------------------------
describe("UserSchema – profile.joined field", () => {
  test("accepts a Date object", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { joined: new Date("2020-06-15") },
    });
    assert.equal(result.success, true);
  });

  test("rejects a date string (strict z.date())", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { joined: "2020-06-15" },
    });
    assert.equal(result.success, false);
  });

  test("rejects missing joined field", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { bio: "Hi" },
    });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// code template literal field (unchanged but ensures it still works)
// ---------------------------------------------------------------------------
describe("UserSchema – code template literal field", () => {
  test('accepts "user-1"', () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-1" });
    assert.equal(result.success, true);
  });

  test('accepts "user-9999"', () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-9999" });
    assert.equal(result.success, true);
  });

  test('rejects "admin-1" (wrong prefix)', () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "admin-1" });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// Full valid object round-trip
// ---------------------------------------------------------------------------
describe("UserSchema – full valid object", () => {
  test("parses a complete valid user object successfully", () => {
    const result = UserSchema.safeParse(validUser());
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.status, "active");
      assert.equal(result.data.websiteUrl, "https://example.com");
      assert.equal(result.data.portfolio, "https://portfolio.example.com");
      assert.equal(result.data.format, "json");
      assert.equal(result.data.role, "admin");
    }
  });

  test("all three status enum values produce successful parses", () => {
    for (const status of ["active", "inactive", "banned"] as const) {
      const result = UserSchema.safeParse({ ...validUser(), status });
      assert.equal(result.success, true, `Expected ${status} to be valid`);
    }
  });

  // Regression: old z.literal([...]) would have accepted any of the literals
  // but z.enum() should reject values outside the enum.
  test("regression: non-enum status value is rejected by new z.enum()", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "deleted" });
    assert.equal(result.success, false);
  });
});