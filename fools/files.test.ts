import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// Minimal valid input matching the current schema (post-PR changes)
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-42",
  profile: {
    bio: "A short bio",
    joined: new Date("2023-01-15"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: "https://site1.example.com https://site2.example.com",
  format: "json",
};

describe("UserSchema - status field (changed from z.literal to z.enum)", () => {
  it("accepts 'active' as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive' as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts 'banned' as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "banned" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "" });
    expect(result.success).toBe(false);
  });

  it("rejects null as status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: null });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - websiteUrl field (new field)", () => {
  it("accepts a valid URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://mysite.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing websiteUrl", () => {
    const { websiteUrl, ...withoutWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - portfolio field (new field)", () => {
  it("accepts a valid URL for portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "https://portfolio.dev" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects missing portfolio", () => {
    const { portfolio, ...withoutPortfolio } = validUser;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - siteUrls field (new field using z.urls())", () => {
  it("accepts a space-separated string of valid URLs for siteUrls", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: "https://site1.com https://site2.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a single URL string for siteUrls", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: "https://single.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing siteUrls", () => {
    const { siteUrls, ...withoutSiteUrls } = validUser;
    const result = UserSchema.safeParse(withoutSiteUrls);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - format field (new field)", () => {
  it("accepts any non-empty string for format", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "json" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string for format", () => {
    // z.string() with no min allows empty strings
    const result = UserSchema.safeParse({ ...validUser, format: "" });
    expect(result.success).toBe(true);
  });

  it("rejects missing format", () => {
    const { format, ...withoutFormat } = validUser;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - removed 'website' field", () => {
  it("does not accept extra 'website' field (strict-ish — object ignores unknown keys by default)", () => {
    // Zod object schemas strip unknown keys by default; the old 'website' field is just dropped
    // Verify that the schema still succeeds even with an extra 'website' key (stripped)
    const result = UserSchema.safeParse({ ...validUser, website: "https://old-field.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      // The 'website' key should not be present in the parsed output
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });
});

describe("UserSchema - full valid object", () => {
  it("parses a fully valid user object", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(validUser.id);
      expect(result.data.email).toBe(validUser.email);
      expect(result.data.status).toBe("active");
      expect(result.data.websiteUrl).toBe("https://example.com");
      expect(result.data.portfolio).toBe("https://portfolio.example.com");
      expect(result.data.format).toBe("json");
    }
  });

  it("coerces age from a numeric string", () => {
    const result = UserSchema.safeParse({ ...validUser, age: "30" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });

  it("rejects age below 18", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 16 });
    expect(result.success).toBe(false);
  });
});

describe("parseUser helper", () => {
  it("returns the parsed user for valid input", () => {
    const user = parseUser(validUser);
    expect(user.email).toBe(validUser.email);
    expect(user.status).toBe("active");
  });

  it("throws an error for invalid input", () => {
    expect(() => parseUser({ ...validUser, status: "invalid" })).toThrow();
  });

  it("throws an error when required new fields are missing", () => {
    const { websiteUrl, ...missingWebsiteUrl } = validUser;
    expect(() => parseUser(missingWebsiteUrl)).toThrow();
  });

  it("throws for completely invalid input", () => {
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser({})).toThrow();
    expect(() => parseUser("string")).toThrow();
  });
});