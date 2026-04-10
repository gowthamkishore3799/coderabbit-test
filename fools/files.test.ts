import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

// Minimal valid user satisfying all required fields after PR changes
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  status: "active",
  code: "user-1",
  profile: {
    bio: "Hello world",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: "https://site1.com https://site2.com",
  format: "json",
};

describe("UserSchema – new fields added in PR", () => {
  describe("websiteUrl field (z.url())", () => {
    it("accepts a valid https URL", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts a valid http URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        websiteUrl: "http://example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a non-URL string", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        websiteUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an empty string", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        websiteUrl: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing websiteUrl field", () => {
      const { websiteUrl: _removed, ...withoutWebsiteUrl } = validUser;
      const result = UserSchema.safeParse(withoutWebsiteUrl);
      expect(result.success).toBe(false);
    });
  });

  describe("portfolio field (z.url())", () => {
    it("accepts a valid https URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        portfolio: "https://my-portfolio.dev",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        portfolio: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing portfolio field", () => {
      const { portfolio: _removed, ...withoutPortfolio } = validUser;
      const result = UserSchema.safeParse(withoutPortfolio);
      expect(result.success).toBe(false);
    });

    it("rejects an email address (not a URL)", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        portfolio: "user@example.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("siteUrls field (z.urls())", () => {
    it("accepts a valid urls string", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: "https://site1.com https://site2.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a single valid URL", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: "https://example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a missing siteUrls field", () => {
      const { siteUrls: _removed, ...withoutSiteUrls } = validUser;
      const result = UserSchema.safeParse(withoutSiteUrls);
      expect(result.success).toBe(false);
    });
  });

  describe("format field (z.string())", () => {
    it("accepts any non-empty string", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        format: "xml",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string (z.string() with no min constraint)", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        format: "",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a missing format field", () => {
      const { format: _removed, ...withoutFormat } = validUser;
      const result = UserSchema.safeParse(withoutFormat);
      expect(result.success).toBe(false);
    });

    it("rejects a non-string value", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        format: 42,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("UserSchema – status field changed to z.enum()", () => {
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

  it("rejects an unlisted status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a numeric status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects uppercase variant", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "Active" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – website field removed", () => {
  it("does not accept an extra 'website' field (schema ignores unknown keys by default)", () => {
    // z.object() strips extra fields; test that data without 'website' is still valid
    const result = UserSchema.safeParse({ ...validUser, website: "https://extra.com" });
    // z.object() strips unknown fields by default – parse should succeed
    expect(result.success).toBe(true);
    if (result.success) {
      // The stripped output should not contain 'website'
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });
});

describe("parseUser()", () => {
  it("returns parsed user data for a valid input", () => {
    const user = parseUser(validUser);
    expect(user.email).toBe("user@example.com");
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.portfolio).toBe("https://portfolio.example.com");
    expect(user.format).toBe("json");
  });

  it("throws for an invalid email", () => {
    expect(() => parseUser({ ...validUser, email: "not-an-email" })).toThrow();
  });

  it("throws for a missing required new field (websiteUrl)", () => {
    const { websiteUrl: _removed, ...input } = validUser;
    expect(() => parseUser(input)).toThrow();
  });

  it("throws for a missing required new field (portfolio)", () => {
    const { portfolio: _removed, ...input } = validUser;
    expect(() => parseUser(input)).toThrow();
  });

  it("throws for an invalid status value", () => {
    expect(() => parseUser({ ...validUser, status: "unknown" })).toThrow();
  });

  it("throws for an underage user", () => {
    expect(() => parseUser({ ...validUser, age: 17 })).toThrow();
  });

  it("throws for a null input", () => {
    expect(() => parseUser(null)).toThrow();
  });

  it("throws for an empty object", () => {
    expect(() => parseUser({})).toThrow();
  });
});

describe("UserSchema – full schema integration (all changed fields together)", () => {
  it("validates a complete valid user with all new fields", () => {
    const result = UserSchema.safeParse({
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      email: "admin@company.org",
      age: 30,
      active: "1",
      role: "manager",
      status: "inactive",
      code: "user-42",
      profile: {
        joined: new Date("2020-06-15"),
      },
      websiteUrl: "https://company.org",
      portfolio: "https://work.company.org/portfolio",
      siteUrls: "https://blog.company.org",
      format: "html",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when both portfolio and websiteUrl are invalid URLs", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      websiteUrl: "bad-url",
      portfolio: "also-bad",
    });
    expect(result.success).toBe(false);
  });
});