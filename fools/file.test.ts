import { describe, it, expect } from "vitest";
import { User, parseUser } from "./file";

// This PR removed the stray line "asdkjbasdbkjbkjbas" that previously caused
// a syntax error on import. These tests verify the User schema is importable
// and validates correctly.

const VALID_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  website: "https://example.com",
  websites: ["https://example.com", "https://blog.example.com"],
  trail: "https://trail.example.com",
  trails: "some-trail-identifier",
};

describe("User schema (fools/file.ts) – importable after PR fix", () => {
  it("imports User schema without throwing (invalid code line removed)", () => {
    // If the stray line were still present the import itself would fail.
    expect(User).toBeDefined();
  });

  it("parses a valid user object", () => {
    expect(() => User.parse(VALID_USER)).not.toThrow();
  });

  it("returns the correct id", () => {
    const result = User.parse(VALID_USER);
    expect(result.id).toBe(VALID_USER.id);
  });

  it("returns the correct email", () => {
    const result = User.parse(VALID_USER);
    expect(result.email).toBe(VALID_USER.email);
  });
});

describe("User schema – id field (z.string().uuid())", () => {
  it("rejects an invalid UUID", () => {
    expect(() => User.parse({ ...VALID_USER, id: "not-a-uuid" })).toThrow();
  });

  it("accepts a canonical v4 UUID", () => {
    const result = User.parse({ ...VALID_USER, id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
  });
});

describe("User schema – email field (z.string().email())", () => {
  it("rejects an address with no @ symbol", () => {
    expect(() => User.parse({ ...VALID_USER, email: "userexample.com" })).toThrow();
  });

  it("rejects an empty email string", () => {
    expect(() => User.parse({ ...VALID_USER, email: "" })).toThrow();
  });

  it("accepts a valid email", () => {
    const result = User.parse({ ...VALID_USER, email: "hello@world.io" });
    expect(result.email).toBe("hello@world.io");
  });
});

describe("User schema – age field (z.coerce.number().int().min(18))", () => {
  it("rejects age below 18", () => {
    expect(() => User.parse({ ...VALID_USER, age: 17 })).toThrow();
  });

  it("accepts age exactly 18", () => {
    const result = User.parse({ ...VALID_USER, age: 18 });
    expect(result.age).toBe(18);
  });

  it("coerces a numeric string to a number", () => {
    const result = User.parse({ ...VALID_USER, age: "25" });
    expect(result.age).toBe(25);
  });
});

describe("User schema – active field (z.stringbool())", () => {
  it("parses 'true' to true", () => {
    const result = User.parse({ ...VALID_USER, active: "true" });
    expect(result.active).toBe(true);
  });

  it("parses 'false' to false", () => {
    const result = User.parse({ ...VALID_USER, active: "false" });
    expect(result.active).toBe(false);
  });

  it("parses '1' to true", () => {
    const result = User.parse({ ...VALID_USER, active: "1" });
    expect(result.active).toBe(true);
  });

  it("parses '0' to false", () => {
    const result = User.parse({ ...VALID_USER, active: "0" });
    expect(result.active).toBe(false);
  });

  it("parses 'yes' to true", () => {
    const result = User.parse({ ...VALID_USER, active: "yes" });
    expect(result.active).toBe(true);
  });

  it("parses 'no' to false", () => {
    const result = User.parse({ ...VALID_USER, active: "no" });
    expect(result.active).toBe(false);
  });

  it("rejects an unrecognised string", () => {
    expect(() => User.parse({ ...VALID_USER, active: "maybe" })).toThrow();
  });
});

describe("User schema – role field (z.enum)", () => {
  it("accepts 'admin'", () => {
    expect(User.parse({ ...VALID_USER, role: "admin" }).role).toBe("admin");
  });

  it("accepts 'user'", () => {
    expect(User.parse({ ...VALID_USER, role: "user" }).role).toBe("user");
  });

  it("accepts 'manager'", () => {
    expect(User.parse({ ...VALID_USER, role: "manager" }).role).toBe("manager");
  });

  it("rejects an invalid role", () => {
    expect(() => User.parse({ ...VALID_USER, role: "superadmin" })).toThrow();
  });
});

describe("User schema – website / websites / trail URL fields (z.url())", () => {
  it("rejects an invalid website URL", () => {
    expect(() => User.parse({ ...VALID_USER, website: "not-a-url" })).toThrow();
  });

  it("rejects an invalid URL inside websites array", () => {
    expect(() =>
      User.parse({ ...VALID_USER, websites: ["not-a-url"] })
    ).toThrow();
  });

  it("accepts an empty websites array", () => {
    const result = User.parse({ ...VALID_USER, websites: [] });
    expect(result.websites).toEqual([]);
  });

  it("accepts multiple valid URLs in websites", () => {
    const urls = ["https://a.com", "https://b.org"];
    const result = User.parse({ ...VALID_USER, websites: urls });
    expect(result.websites).toEqual(urls);
  });

  it("rejects an invalid trail URL", () => {
    expect(() => User.parse({ ...VALID_USER, trail: "not-a-url" })).toThrow();
  });

  it("accepts a valid trail URL", () => {
    const result = User.parse({ ...VALID_USER, trail: "https://trail.example.com/path" });
    expect(result.trail).toBe("https://trail.example.com/path");
  });
});

describe("User schema – trails field (z.string().min(1))", () => {
  it("rejects an empty string", () => {
    expect(() => User.parse({ ...VALID_USER, trails: "" })).toThrow();
  });

  it("accepts any non-empty string", () => {
    const result = User.parse({ ...VALID_USER, trails: "trail-abc" });
    expect(result.trails).toBe("trail-abc");
  });
});

describe("parseUser helper (fools/file.ts)", () => {
  it("returns parsed data for a valid input", () => {
    const user = parseUser(VALID_USER);
    expect(user.email).toBe(VALID_USER.email);
  });

  it("throws an Error for invalid input", () => {
    expect(() => parseUser({ ...VALID_USER, email: "bad" })).toThrowError(Error);
  });

  it("throws with a message for completely invalid input", () => {
    try {
      parseUser(null);
      expect.fail("Expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it("throws with a message for missing required fields", () => {
    expect(() => parseUser({})).toThrowError(Error);
  });
});