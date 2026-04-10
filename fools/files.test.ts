// Tests for fools/files.ts - UserSchema (Zod v4)
// Changed in this PR: removed website/status literal fields, added websiteUrl/portfolio/siteUrls,
// status changed from z.literal([...]) to z.enum([...])
import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  age: "25", // coerced from string
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-42",
  profile: {
    bio: "Hello world",
    joined: new Date("2024-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: "https://site1.com https://site2.com",
  format: "json",
};

describe("UserSchema - id field (z.uuid)", () => {
  it("accepts a valid UUID", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("id");
    }
  });

  it("rejects missing id", () => {
    const { id: _, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - email field (z.email)", () => {
  it("accepts a valid email", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "email")).toBe(true);
    }
  });

  it("rejects email without domain", () => {
    const result = UserSchema.safeParse({ ...validUser, email: "user@" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - age field (z.coerce.number)", () => {
  it("coerces string age to number", () => {
    const result = UserSchema.safeParse({ ...validUser, age: "30" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });

  it("rejects age below 18", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "age")).toBe(true);
    }
  });

  it("accepts age exactly 18", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer age", () => {
    const result = UserSchema.safeParse({ ...validUser, age: 25.5 });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - active field (z.stringbool)", () => {
  it("parses 'true' string as truthy", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "true" });
    expect(result.success).toBe(true);
  });

  it("parses 'false' string as falsy", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "false" });
    expect(result.success).toBe(true);
  });

  it("parses '1' as truthy", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "1" });
    expect(result.success).toBe(true);
  });

  it("parses '0' as falsy", () => {
    const result = UserSchema.safeParse({ ...validUser, active: "0" });
    expect(result.success).toBe(true);
  });
});

describe("UserSchema - role field (z.enum)", () => {
  it("accepts valid role 'admin'", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "admin" });
    expect(result.success).toBe(true);
  });

  it("accepts valid role 'user'", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "user" });
    expect(result.success).toBe(true);
  });

  it("accepts valid role 'manager'", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "manager" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role value", () => {
    const result = UserSchema.safeParse({ ...validUser, role: "superuser" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - status field (changed from literal to z.enum in this PR)", () => {
  it("accepts 'active' status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive' status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("accepts 'banned' status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "banned" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "suspended" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "status")).toBe(true);
    }
  });

  it("rejects empty string status", () => {
    const result = UserSchema.safeParse({ ...validUser, status: "" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - websiteUrl field (added in this PR)", () => {
  it("accepts a valid URL for websiteUrl", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      websiteUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for websiteUrl", () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "websiteUrl")).toBe(true);
    }
  });

  it("rejects missing websiteUrl", () => {
    const { websiteUrl: _, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - portfolio field (added in this PR)", () => {
  it("accepts a valid URL for portfolio", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      portfolio: "https://portfolio.dev",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for portfolio", () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: "ftp://bad" });
    expect(result.success).toBe(false);
  });
});

describe("UserSchema - siteUrls field (added in this PR, z.urls())", () => {
  it("accepts a valid whitespace-separated URLs string", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: "https://site1.com https://site2.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("UserSchema - profile field (z.strictObject)", () => {
  it("accepts profile with optional bio omitted", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { joined: new Date("2024-01-01") },
    });
    expect(result.success).toBe(true);
  });

  it("accepts profile with bio present", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { bio: "Hello", joined: new Date("2024-01-01") },
    });
    expect(result.success).toBe(true);
  });

  it("rejects profile missing joined field", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { bio: "Hello" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects profile with extra unknown fields (strictObject)", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { joined: new Date("2024-01-01"), extra: "field" },
    });
    expect(result.success).toBe(false);
  });
});

describe("parseUser", () => {
  it("returns parsed data for valid input", () => {
    const result = parseUser(validUser);
    expect(result).toBeDefined();
    expect(result.email).toBe("test@example.com");
    expect(result.status).toBe("active");
    expect(result.websiteUrl).toBe("https://example.com");
    expect(result.portfolio).toBe("https://portfolio.example.com");
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ ...validUser, email: "bad-email" })).toThrow();
  });

  it("throws with JSON error message for invalid input", () => {
    try {
      parseUser({ ...validUser, age: 10 });
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });

  it("throws for completely invalid input", () => {
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser("string")).toThrow();
    expect(() => parseUser({})).toThrow();
  });
});