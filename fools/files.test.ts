import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// Helper: build a fully valid user object matching the current schema
function validUser() {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "admin" as const,
    status: "active" as const,
    code: "user-42",
    profile: {
      bio: "A short bio",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    siteUrls: ["https://site1.example.com", "https://site2.example.com"],
    format: "json",
  };
}

// ---------------------------------------------------------------------------
// UserSchema — status field (changed from z.literal to z.enum in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema — status enum (changed from z.literal)", () => {
  it("accepts 'active' as status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive' as status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts 'banned' as status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "banned" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status value", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "pending" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string for status", () => {
    const result = UserSchema.safeParse({ ...validUser(), status: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing status field", () => {
    const { status, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — new websiteUrl field (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema — websiteUrl field (new in this PR)", () => {
  it("accepts a valid https URL for websiteUrl", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "https://mywebsite.io",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL for websiteUrl", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "http://mywebsite.io",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string for websiteUrl", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      websiteUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing websiteUrl", () => {
    const { websiteUrl, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — new portfolio field (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema — portfolio field (new in this PR)", () => {
  it("accepts a valid URL for portfolio", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      portfolio: "https://dev.example.com/portfolio",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a plain string without protocol for portfolio", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      portfolio: "dev.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing portfolio", () => {
    const { portfolio, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — new siteUrls field (added in this PR — z.urls())
// ---------------------------------------------------------------------------
describe("UserSchema — siteUrls field (new in this PR)", () => {
  it("accepts an array of valid URLs for siteUrls", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      siteUrls: ["https://a.com", "https://b.org"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty array for siteUrls", () => {
    const result = UserSchema.safeParse({ ...validUser(), siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it("rejects siteUrls containing a non-URL value", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      siteUrls: ["https://valid.com", "not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing siteUrls", () => {
    const { siteUrls, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — new format field (added in this PR — z.string())
// ---------------------------------------------------------------------------
describe("UserSchema — format field (new in this PR)", () => {
  it("accepts any non-empty string for format", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "xml" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string for format (z.string() has no min constraint)", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: "" });
    expect(result.success).toBe(true);
  });

  it("rejects missing format field", () => {
    const { format, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a number for format", () => {
    const result = UserSchema.safeParse({ ...validUser(), format: 42 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema — existing fields (ensure they still work after refactor)
// ---------------------------------------------------------------------------
describe("UserSchema — id (uuid)", () => {
  it("rejects an invalid uuid", () => {
    const result = UserSchema.safeParse({ ...validUser(), id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing id", () => {
    const { id, ...rest } = validUser();
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema — email", () => {
  it("rejects an invalid email", () => {
    const result = UserSchema.safeParse({ ...validUser(), email: "bademail" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema — age coercion", () => {
  it("coerces a numeric string age", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: "30" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it("rejects age below 18", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: 17 });
    expect(result.success).toBe(false);
  });

  it("accepts age exactly 18", () => {
    const result = UserSchema.safeParse({ ...validUser(), age: 18 });
    expect(result.success).toBe(true);
  });
});

describe("UserSchema — role enum", () => {
  it("accepts 'admin' role", () => {
    expect(UserSchema.safeParse({ ...validUser(), role: "admin" }).success).toBe(true);
  });

  it("accepts 'user' role", () => {
    expect(UserSchema.safeParse({ ...validUser(), role: "user" }).success).toBe(true);
  });

  it("accepts 'manager' role", () => {
    expect(UserSchema.safeParse({ ...validUser(), role: "manager" }).success).toBe(true);
  });

  it("rejects unknown role", () => {
    expect(UserSchema.safeParse({ ...validUser(), role: "superadmin" }).success).toBe(false);
  });
});

describe("UserSchema — code template literal", () => {
  it("accepts a valid code like 'user-1'", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-1" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid code like 'user-9999'", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "user-9999" });
    expect(result.success).toBe(true);
  });

  it("rejects a code without 'user-' prefix", () => {
    const result = UserSchema.safeParse({ ...validUser(), code: "admin-1" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema — profile strict object", () => {
  it("accepts profile with optional bio omitted", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { joined: new Date("2023-01-01") },
    });
    expect(result.success).toBe(true);
  });

  it("rejects profile with extra unknown field (strictObject)", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { bio: "hi", joined: new Date(), extra: "oops" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects profile missing the required 'joined' field", () => {
    const result = UserSchema.safeParse({
      ...validUser(),
      profile: { bio: "hi" },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser() helper
// ---------------------------------------------------------------------------
describe("parseUser()", () => {
  it("returns typed data for a valid input", () => {
    const user = parseUser(validUser());
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.format).toBe("json");
  });

  it("throws on invalid input", () => {
    expect(() => parseUser({ ...validUser(), email: "bad" })).toThrow();
  });

  it("throws with JSON-structured error message", () => {
    try {
      parseUser({ ...validUser(), status: "unknown" });
      expect.fail("Should have thrown");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
      const msg = (e as Error).message;
      // v4 treeify() produces valid JSON
      expect(() => JSON.parse(msg)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// Regression: website field was removed — ensure it is no longer accepted
// ---------------------------------------------------------------------------
describe("UserSchema — website field removed (regression)", () => {
  it("does not accept a 'website' field (field was removed in this PR)", () => {
    // schema is a strict-ish object — extra top-level fields should be stripped
    // or the schema strips them. Confirm the removed 'website' key is gone.
    const input = { ...validUser(), website: "https://old-website.com" };
    const result = UserSchema.safeParse(input);
    // Zod strips unknown keys by default, so parse succeeds but website is absent
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });
});