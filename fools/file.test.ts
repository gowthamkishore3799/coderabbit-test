// Tests for fools/file.ts
// Changed in PR: removed the stray invalid-identifier line "asdkjbasdbkjbkjbas".
// Schema and parseUser logic remain intact; this file validates the schema still works correctly.

import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// ---------------------------------------------------------------------------
// Minimal valid user payload
// ---------------------------------------------------------------------------
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",   // stringbool – accepts "true"/"false"/"1"/"0"/"yes"/"no"
  role: "admin" as const,
  website: "https://example.com",
  websites: ["https://a.com", "https://b.com"],
  trail: "https://trail.example.com",
  trails: "some-trail",
};

// ---------------------------------------------------------------------------
// User schema – basic validation
// ---------------------------------------------------------------------------
describe("User schema (fools/file.ts)", () => {
  it("accepts a fully valid user object", () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects an empty object", () => {
    const result = User.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// id – uuid validation
// ---------------------------------------------------------------------------
describe("User schema – id field", () => {
  it("accepts a valid UUID v4", () => {
    const result = User.safeParse({ ...validUser, id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID string", () => {
    const result = User.safeParse({ ...validUser, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("reports 'Invalid id' message for bad UUID", () => {
    const result = User.safeParse({ ...validUser, id: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = result.error.issues;
      expect(flat.some(i => i.message === "Invalid id")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// email validation
// ---------------------------------------------------------------------------
describe("User schema – email field", () => {
  it("accepts a valid email address", () => {
    const result = User.safeParse({ ...validUser, email: "hello@world.org" });
    expect(result.success).toBe(true);
  });

  it("rejects a string without @ symbol", () => {
    const result = User.safeParse({ ...validUser, email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("reports 'Invalid email' message for bad email", () => {
    const result = User.safeParse({ ...validUser, email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message === "Invalid email")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// age – coerced number, int, min 18
// ---------------------------------------------------------------------------
describe("User schema – age field", () => {
  it("accepts age 18 (boundary)", () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it("rejects age 17 (below minimum)", () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric string to a number", () => {
    const result = User.safeParse({ ...validUser, age: "25" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-numeric age string", () => {
    const result = User.safeParse({ ...validUser, age: "abc" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// active – stringbool (parses "true"/"false"/"1"/"0"/"yes"/"no")
// ---------------------------------------------------------------------------
describe("User schema – active field (stringbool)", () => {
  it("accepts 'true'", () => {
    expect(User.safeParse({ ...validUser, active: "true" }).success).toBe(true);
  });

  it("accepts 'false'", () => {
    expect(User.safeParse({ ...validUser, active: "false" }).success).toBe(true);
  });

  it("accepts '1'", () => {
    expect(User.safeParse({ ...validUser, active: "1" }).success).toBe(true);
  });

  it("accepts '0'", () => {
    expect(User.safeParse({ ...validUser, active: "0" }).success).toBe(true);
  });

  it("accepts 'yes'", () => {
    expect(User.safeParse({ ...validUser, active: "yes" }).success).toBe(true);
  });

  it("accepts 'no'", () => {
    expect(User.safeParse({ ...validUser, active: "no" }).success).toBe(true);
  });

  it("rejects an arbitrary string", () => {
    expect(User.safeParse({ ...validUser, active: "maybe" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// role – enum
// ---------------------------------------------------------------------------
describe("User schema – role field", () => {
  it("accepts 'admin'", () => {
    expect(User.safeParse({ ...validUser, role: "admin" }).success).toBe(true);
  });

  it("accepts 'user'", () => {
    expect(User.safeParse({ ...validUser, role: "user" }).success).toBe(true);
  });

  it("accepts 'manager'", () => {
    expect(User.safeParse({ ...validUser, role: "manager" }).success).toBe(true);
  });

  it("rejects 'superadmin'", () => {
    expect(User.safeParse({ ...validUser, role: "superadmin" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// website / trail – url fields
// ---------------------------------------------------------------------------
describe("User schema – website and trail URL fields", () => {
  it("accepts valid https URL for website", () => {
    expect(User.safeParse({ ...validUser, website: "https://example.com" }).success).toBe(true);
  });

  it("rejects invalid URL for website", () => {
    expect(User.safeParse({ ...validUser, website: "not-a-url" }).success).toBe(false);
  });

  it("accepts valid https URL for trail", () => {
    expect(User.safeParse({ ...validUser, trail: "https://trail.com" }).success).toBe(true);
  });

  it("rejects invalid URL for trail", () => {
    expect(User.safeParse({ ...validUser, trail: "not-a-url" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// websites – array of URLs
// ---------------------------------------------------------------------------
describe("User schema – websites field (array of URLs)", () => {
  it("accepts an array of valid URLs", () => {
    expect(
      User.safeParse({ ...validUser, websites: ["https://a.com", "https://b.org"] }).success
    ).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(User.safeParse({ ...validUser, websites: [] }).success).toBe(true);
  });

  it("rejects an array containing an invalid URL", () => {
    expect(
      User.safeParse({ ...validUser, websites: ["https://good.com", "bad-url"] }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// trails – non-empty string
// ---------------------------------------------------------------------------
describe("User schema – trails field (min length 1)", () => {
  it("accepts a non-empty string", () => {
    expect(User.safeParse({ ...validUser, trails: "my-trail" }).success).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(User.safeParse({ ...validUser, trails: "" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper
// ---------------------------------------------------------------------------
describe("parseUser (fools/file.ts)", () => {
  it("returns the validated user for valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.role).toBe("admin");
  });

  it("throws for completely invalid input", () => {
    expect(() => parseUser(null)).toThrow();
  });

  it("throws when id is not a UUID", () => {
    expect(() => parseUser({ ...validUser, id: "not-uuid" })).toThrow();
  });

  it("throws when email is invalid", () => {
    expect(() => parseUser({ ...validUser, email: "bad" })).toThrow();
  });

  it("throws when age is below 18", () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it("throws when role is not a valid enum value", () => {
    expect(() => parseUser({ ...validUser, role: "guest" })).toThrow();
  });

  it("throws when website URL is invalid", () => {
    expect(() => parseUser({ ...validUser, website: "not-a-url" })).toThrow();
  });

  it("throws when trails is an empty string", () => {
    expect(() => parseUser({ ...validUser, trails: "" })).toThrow();
  });
});