/**
 * Tests for fools/file.ts — User schema and parseUser
 *
 * This PR removed the stray non-code line `asdkjbasdbkjbkjbas` that previously
 * caused a syntax error, making the module importable and testable.
 *
 * Run:
 *   node --experimental-strip-types --experimental-vm-modules fools/file.test.ts
 * (requires `zod` installed: cd fools && npm install)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { User, parseUser } from "./file.ts";

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
    website: "https://example.com",
    websites: ["https://a.com", "https://b.com"],
    trail: "https://trail.example.com",
    trails: "some trail text",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// User schema – valid inputs
// ---------------------------------------------------------------------------

describe("User schema – valid inputs", () => {
  test("parses a complete valid user", () => {
    const result = User.safeParse(validInput());
    assert.equal(result.success, true);
  });

  test("coerces age from string to number", () => {
    const result = User.safeParse(validInput({ age: "22" }));
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.age, 22);
  });

  test("accepts active='1' (truthy string boolean)", () => {
    const result = User.safeParse(validInput({ active: "1" }));
    assert.equal(result.success, true);
  });

  test("accepts active='0' (falsy string boolean)", () => {
    const result = User.safeParse(validInput({ active: "0" }));
    assert.equal(result.success, true);
  });

  test("accepts active='yes'", () => {
    const result = User.safeParse(validInput({ active: "yes" }));
    assert.equal(result.success, true);
  });

  test("accepts active='no'", () => {
    const result = User.safeParse(validInput({ active: "no" }));
    assert.equal(result.success, true);
  });

  test("accepts role 'admin'", () => {
    const result = User.safeParse(validInput({ role: "admin" }));
    assert.equal(result.success, true);
  });

  test("accepts role 'manager'", () => {
    const result = User.safeParse(validInput({ role: "manager" }));
    assert.equal(result.success, true);
  });

  test("accepts an empty websites array", () => {
    const result = User.safeParse(validInput({ websites: [] }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// id – UUID validation
// ---------------------------------------------------------------------------

describe("id field – UUID", () => {
  test("rejects a plain string as id", () => {
    const result = User.safeParse(validInput({ id: "not-uuid" }));
    assert.equal(result.success, false);
  });

  test("accepts a lowercase UUID v4", () => {
    const result = User.safeParse(
      validInput({ id: "123e4567-e89b-42d3-a456-426614174000" })
    );
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// email – string email validation
// ---------------------------------------------------------------------------

describe("email field", () => {
  test("rejects an email without @ sign", () => {
    const result = User.safeParse(validInput({ email: "bademail.com" }));
    assert.equal(result.success, false);
  });

  test("rejects an empty email", () => {
    const result = User.safeParse(validInput({ email: "" }));
    assert.equal(result.success, false);
  });

  test("accepts a valid email", () => {
    const result = User.safeParse(validInput({ email: "hello@world.org" }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// age – integer, minimum 18
// ---------------------------------------------------------------------------

describe("age field", () => {
  test("rejects age below 18", () => {
    const result = User.safeParse(validInput({ age: 16 }));
    assert.equal(result.success, false);
  });

  test("rejects age of 0", () => {
    const result = User.safeParse(validInput({ age: 0 }));
    assert.equal(result.success, false);
  });

  test("accepts age exactly 18", () => {
    const result = User.safeParse(validInput({ age: 18 }));
    assert.equal(result.success, true);
  });

  test("rejects a float age", () => {
    const result = User.safeParse(validInput({ age: 18.5 }));
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// role – enum
// ---------------------------------------------------------------------------

describe("role field – enum", () => {
  test("rejects an unknown role", () => {
    const result = User.safeParse(validInput({ role: "superadmin" }));
    assert.equal(result.success, false);
  });

  test("rejects missing role", () => {
    const input = validInput();
    delete (input as Record<string, unknown>)["role"];
    const result = User.safeParse(input);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// website and trail – URL fields
// ---------------------------------------------------------------------------

describe("website and trail URL fields", () => {
  test("rejects an invalid website URL", () => {
    const result = User.safeParse(validInput({ website: "not-a-url" }));
    assert.equal(result.success, false);
  });

  test("rejects an invalid trail URL", () => {
    const result = User.safeParse(validInput({ trail: "ftp://bad" }));
    assert.equal(result.success, false);
  });

  test("accepts valid URLs for website and trail", () => {
    const result = User.safeParse(
      validInput({
        website: "https://valid.com",
        trail: "https://trail.valid.com",
      })
    );
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// websites – array of URLs
// ---------------------------------------------------------------------------

describe("websites field – array of URLs", () => {
  test("rejects an array containing an invalid URL", () => {
    const result = User.safeParse(validInput({ websites: ["not-a-url"] }));
    assert.equal(result.success, false);
  });

  test("accepts multiple valid URLs", () => {
    const result = User.safeParse(
      validInput({ websites: ["https://a.io", "https://b.co"] })
    );
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// trails – required non-empty string
// ---------------------------------------------------------------------------

describe("trails field – non-empty string", () => {
  test("rejects empty trails string", () => {
    const result = User.safeParse(validInput({ trails: "" }));
    assert.equal(result.success, false);
  });

  test("accepts any non-empty trails string", () => {
    const result = User.safeParse(validInput({ trails: "some trail" }));
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// parseUser – success and error paths
// ---------------------------------------------------------------------------

describe("parseUser()", () => {
  test("returns a typed User object for valid input", () => {
    const user = parseUser(validInput());
    assert.equal(user.role, "user");
    assert.equal(typeof user.website, "string");
  });

  test("throws an Error for empty object input", () => {
    assert.throws(() => parseUser({}), /Error/);
  });

  test("throws when age is below 18", () => {
    assert.throws(() => parseUser(validInput({ age: 10 })), /Error/);
  });

  test("throws when email is invalid", () => {
    assert.throws(() => parseUser(validInput({ email: "bad" })), /Error/);
  });

  test("throws when id is not a UUID", () => {
    assert.throws(() => parseUser(validInput({ id: "12345" })), /Error/);
  });

  test("returned user has coerced integer age", () => {
    const user = parseUser(validInput({ age: "45" }));
    assert.equal(user.age, 45);
  });
});