import { describe, it, expect } from "vitest";
import { UserSchema, parseUser, type User } from "./files";

// Minimal valid input satisfying every field of UserSchema
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "alice@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-42",
  profile: {
    bio: "Hello world",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://alice.example.com",
  portfolio: "https://portfolio.alice.dev",
  siteUrls: ["https://site1.example.com", "https://site2.example.com"],
  format: "json",
};

// ---------------------------------------------------------------------------
// UserSchema – valid inputs
// ---------------------------------------------------------------------------
describe("UserSchema – valid inputs", () => {
  it("accepts a fully populated valid object", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("accepts role 'user'", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "user" });
    expect(result.success).toBe(true);
  });

  it("accepts role 'manager'", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "manager" });
    expect(result.success).toBe(true);
  });

  it("accepts status 'inactive'", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts status 'banned'", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "banned" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'false'", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "false" });
    expect(result.success).toBe(true);
  });

  it("accepts active = '1' (truthy string bool)", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "1" });
    expect(result.success).toBe(true);
  });

  it("accepts active = '0' (falsy string bool)", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "0" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'yes'", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "yes" });
    expect(result.success).toBe(true);
  });

  it("accepts active = 'no'", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "no" });
    expect(result.success).toBe(true);
  });

  it("accepts age coerced from a string", () => {
    const result = UserSchema.safeParse({ ...validUser, age: "30" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });

  it("accepts profile without optional bio", () => {
    const { bio: _bio, ...profileWithoutBio } = validUser.profile;
    const result = UserSchema.safeParse({
      ...validUser,
      profile: profileWithoutBio,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid code matching template literal 'user-{1-9999}'", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "user-1" });
    expect(result.success).toBe(true);
  });

  it("accepts max boundary code 'user-9999'", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "user-9999" });
    expect(result.success).toBe(true);
  });

  it("accepts siteUrls as a single-element array", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://only-one.example.com"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts siteUrls as an empty array", () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – id validation
// ---------------------------------------------------------------------------
describe("UserSchema – id field", () => {
  it("rejects a non-UUID id", () => {
    const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty id", () => {
    const result = UserSchema.safeParse({ ...validUser, id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing id", () => {
    const { id: _id, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – email validation
// ---------------------------------------------------------------------------
describe("UserSchema – email field", () => {
  it("rejects an invalid email", () => {
    const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty email", () => {
    const result = UserSchema.safeParse({ ...validUser, email: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – age validation
// ---------------------------------------------------------------------------
describe("UserSchema – age field", () => {
  it("rejects age below 18", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it("rejects age of 0", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts age exactly 18 (boundary)", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer age", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 18.5 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – role enum
// ---------------------------------------------------------------------------
describe("UserSchema – role field", () => {
  it("rejects an invalid role", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "superuser" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty role", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – status enum (changed from z.literal to z.enum in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – status field (z.enum)", () => {
  it("accepts 'active'", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive'", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts 'banned'", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "banned" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing status", () => {
    const { status: _status, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – new URL fields (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – websiteUrl field (new)", () => {
  it("accepts a valid https URL", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com/path?q=1" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not a url" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing websiteUrl", () => {
    const { websiteUrl: _wu, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – portfolio field (new)", () => {
  it("accepts a valid URL", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "https://myportfolio.dev" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "ftp//bad" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing portfolio", () => {
    const { portfolio: _p, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – siteUrls field (new z.urls())", () => {
  it("accepts an array of valid URLs", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://a.com", "https://b.com", "https://c.org"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an array containing an invalid URL", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://valid.com", "not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing siteUrls", () => {
    const { siteUrls: _su, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – format field (new)
// ---------------------------------------------------------------------------
describe("UserSchema – format field (new)", () => {
  it("accepts any non-empty string", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "xml" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string (z.string has no min by default)", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing format field", () => {
    const { format: _f, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – profile strictObject
// ---------------------------------------------------------------------------
describe("UserSchema – profile strictObject", () => {
  it("rejects extra keys in profile (strict mode)", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { ...validUser.profile, extraKey: "unexpected" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts profile with only required joined field", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { joined: new Date("2022-06-15") },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – templateLiteral code field
// ---------------------------------------------------------------------------
describe("UserSchema – code templateLiteral", () => {
  it("rejects code not starting with 'user-'", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "admin-42" });
    expect(result.success).toBe(false);
  });

  it("rejects code with number 0 (min is 1)", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "user-0" });
    expect(result.success).toBe(false);
  });

  it("rejects code with number over 9999", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "user-10000" });
    expect(result.success).toBe(false);
  });

  it("accepts code at min boundary 'user-1'", () => {
    const result = UserSchema.safeParse({ ...validUser, code: "user-1" });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseUser – wrapper function
// ---------------------------------------------------------------------------
describe("parseUser", () => {
  it("returns parsed data for a valid user", () => {
    const result = parseUser(validUser);
    expect(result).toBeDefined();
    expect(result.email).toBe("alice@example.com");
    expect(result.status).toBe("active");
    expect(result.websiteUrl).toBeDefined();
    expect(result.portfolio).toBeDefined();
    expect(result.siteUrls).toHaveLength(2);
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ id: "bad", email: "bad" })).toThrow();
  });

  it("throws an Error instance for invalid input", () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it("throws with a JSON string message on parse failure", () => {
    let thrownError: unknown;
    try {
      parseUser({ ...validUser, id: "not-a-uuid" });
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toBeInstanceOf(Error);
    const msg = (thrownError as Error).message;
    // The error message is JSON.stringify'd from result.error.treeify()
    expect(() => JSON.parse(msg)).not.toThrow();
  });

  it("coerces string age in parseUser", () => {
    const result = parseUser({ ...validUser, age: "22" });
    expect(result.age).toBe(22);
  });

  it("returns data with active as boolean after stringbool coercion", () => {
    const result = parseUser({ ...validUser, active: "yes" });
    // z.stringbool() returns a boolean
    expect(typeof result.active).toBe("boolean");
  });
});