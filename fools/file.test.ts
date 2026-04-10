import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// A valid object that satisfies the User schema
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "bob@example.com",
  age: 20,
  active: "true",
  role: "user" as const,
  website: "https://bob.example.com",
  websites: ["https://first.example.com", "https://second.example.com"],
  trail: "https://trail.example.com",
  trails: "some-trail-value",
};

// ---------------------------------------------------------------------------
// User schema – valid inputs
// ---------------------------------------------------------------------------
describe("User schema (fools/file.ts) – valid inputs", () => {
  it("accepts a fully populated valid object", () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("accepts role 'admin'", () => {
    const result = User.safeParse({ ...validUser, role: "admin" });
    expect(result.success).toBe(true);
  });

  it("accepts role 'manager'", () => {
    const result = User.safeParse({ ...validUser, role: "manager" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'false'", () => {
    const result = User.safeParse({ ...validUser, active: "false" });
    expect(result.success).toBe(true);
  });

  it("accepts active = '1'", () => {
    const result = User.safeParse({ ...validUser, active: "1" });
    expect(result.success).toBe(true);
  });

  it("accepts active = '0'", () => {
    const result = User.safeParse({ ...validUser, active: "0" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'yes'", () => {
    const result = User.safeParse({ ...validUser, active: "yes" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'no'", () => {
    const result = User.safeParse({ ...validUser, active: "no" });
    expect(result.success).toBe(true);
  });

  it("coerces age from string '18'", () => {
    const result = User.safeParse({ ...validUser, age: "18" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(18);
  });

  it("accepts websites as an empty array", () => {
    const result = User.safeParse({ ...validUser, websites: [] });
    expect(result.success).toBe(true);
  });

  it("accepts websites with a single URL", () => {
    const result = User.safeParse({ ...validUser, websites: ["https://single.example.com"] });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// User schema – id field
// ---------------------------------------------------------------------------
describe("User schema – id field", () => {
  it("rejects a non-UUID id", () => {
    const result = User.safeParse({ ...validUser, id: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty id", () => {
    const result = User.safeParse({ ...validUser, id: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – email field
// ---------------------------------------------------------------------------
describe("User schema – email field", () => {
  it("rejects a plain string email", () => {
    const result = User.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an email missing domain", () => {
    const result = User.safeParse({ ...validUser, email: "user@" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – age field
// ---------------------------------------------------------------------------
describe("User schema – age field", () => {
  it("accepts age exactly 18 (boundary)", () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it("rejects age 17 (below minimum)", () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer age", () => {
    const result = User.safeParse({ ...validUser, age: 20.5 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – role field
// ---------------------------------------------------------------------------
describe("User schema – role field", () => {
  it("rejects an unrecognised role", () => {
    const result = User.safeParse({ ...validUser, role: "guest" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – website / websites fields
// ---------------------------------------------------------------------------
describe("User schema – website and websites fields", () => {
  it("rejects an invalid website URL", () => {
    const result = User.safeParse({ ...validUser, website: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects websites array containing an invalid URL", () => {
    const result = User.safeParse({
      ...validUser,
      websites: ["https://valid.com", "bad-url"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a website with query params and fragments", () => {
    const result = User.safeParse({
      ...validUser,
      website: "https://example.com/path?foo=bar#section",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// User schema – trail and trails fields
// ---------------------------------------------------------------------------
describe("User schema – trail and trails fields", () => {
  it("rejects trail with a non-URL value", () => {
    const result = User.safeParse({ ...validUser, trail: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty trails string", () => {
    const result = User.safeParse({ ...validUser, trails: "" });
    expect(result.success).toBe(false);
  });

  it("accepts trails with a single character", () => {
    const result = User.safeParse({ ...validUser, trails: "x" });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseUser – wrapper function
// ---------------------------------------------------------------------------
describe("parseUser (fools/file.ts)", () => {
  it("returns parsed user data for a valid input", () => {
    const result = parseUser(validUser);
    expect(result).toBeDefined();
    expect(result?.email).toBe("bob@example.com");
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ id: "bad", email: "bad" })).toThrow();
  });

  it("throws an Error instance for null input", () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it("throws for an underage user (age < 18)", () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it("throws for an invalid role value", () => {
    expect(() => parseUser({ ...validUser, role: "unknown" })).toThrow();
  });

  it("returns boolean active after stringbool parsing", () => {
    const result = parseUser({ ...validUser, active: "no" });
    expect(typeof result?.active).toBe("boolean");
    expect(result?.active).toBe(false);
  });

  it("coerces string age to number in returned data", () => {
    const result = parseUser({ ...validUser, age: "25" });
    expect(result?.age).toBe(25);
  });
});