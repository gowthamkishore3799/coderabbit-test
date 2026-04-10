// Tests for fools/files.ts
// Changed in PR: status changed from z.literal to z.enum, removed website field,
// added websiteUrl, portfolio, siteUrls, format fields, parseUser function updated.

import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// ---------------------------------------------------------------------------
// Minimal valid payload matching the current schema (post-PR)
// ---------------------------------------------------------------------------
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-1" as const,
  profile: {
    bio: "Hello",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://example.com", "https://portfolio.example.com"],
  format: "json",
};

// ---------------------------------------------------------------------------
// UserSchema – status field (changed from z.literal to z.enum in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – status field (PR change: literal → enum)", () => {
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

  it("rejects an unknown status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "pending" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing status field", () => {
    const { status, ...withoutStatus } = validUser;
    const result = UserSchema.safeParse(withoutStatus);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – websiteUrl field (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – websiteUrl field (added in PR)", () => {
  it("accepts a valid https URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing websiteUrl field", () => {
    const { websiteUrl, ...withoutWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – portfolio field (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – portfolio field (added in PR)", () => {
  it("accepts a valid URL for portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "https://portfolio.dev" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "just-a-string" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing portfolio field", () => {
    const { portfolio, ...withoutPortfolio } = validUser;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – siteUrls field (added in this PR, uses z.urls())
// ---------------------------------------------------------------------------
describe("UserSchema – siteUrls field (added in PR)", () => {
  it("accepts an array of valid URLs for siteUrls", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://a.com", "https://b.com"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty array for siteUrls", () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it("rejects an array containing an invalid URL in siteUrls", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ["https://good.com", "not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing siteUrls field", () => {
    const { siteUrls, ...withoutSiteUrls } = validUser;
    const result = UserSchema.safeParse(withoutSiteUrls);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – format field (added in this PR)
// ---------------------------------------------------------------------------
describe("UserSchema – format field (added in PR)", () => {
  it("accepts any non-empty string for format", () => {
    const result = UserSchema.safeParse({ ...validUser, format: "xml" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing format field", () => {
    const { format, ...withoutFormat } = validUser;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UserSchema – overall valid payload
// ---------------------------------------------------------------------------
describe("UserSchema – full valid payload", () => {
  it("parses a fully valid user object", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.websiteUrl).toBe("https://example.com");
      expect(result.data.portfolio).toBe("https://portfolio.example.com");
      expect(result.data.format).toBe("json");
    }
  });

  it("rejects an entirely empty object", () => {
    const result = UserSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser – updated in this PR
// ---------------------------------------------------------------------------
describe("parseUser", () => {
  it("returns parsed data for a valid user", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.portfolio).toBe("https://portfolio.example.com");
    expect(user.format).toBe("json");
  });

  it("throws for an invalid user", () => {
    expect(() => parseUser({ id: "not-a-uuid", email: "bad-email" })).toThrow();
  });

  it("throws when status is an invalid enum value", () => {
    expect(() => parseUser({ ...validUser, status: "unknown" })).toThrow();
  });

  it("throws when websiteUrl is not a valid URL", () => {
    expect(() => parseUser({ ...validUser, websiteUrl: "ftp://invalid" })).toThrow();
  });

  it("throws when portfolio is missing", () => {
    const { portfolio, ...withoutPortfolio } = validUser;
    expect(() => parseUser(withoutPortfolio)).toThrow();
  });

  it("throws when format is missing", () => {
    const { format, ...withoutFormat } = validUser;
    expect(() => parseUser(withoutFormat)).toThrow();
  });
});