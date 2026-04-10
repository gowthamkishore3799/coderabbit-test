import { describe, it, expect } from "vitest";
import { z } from "zod";
import { UserSchema, parseUser, type User } from "./files";

// Minimal valid user object matching the current UserSchema
function makeValidUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "admin",
    status: "active",
    code: "user-1",
    profile: {
      bio: "A short bio",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    siteUrls: "https://site1.com\nhttps://site2.com",
    format: "json",
    ...overrides,
  };
}

describe("UserSchema", () => {
  describe("valid inputs", () => {
    it("parses a fully valid user", () => {
      const result = UserSchema.safeParse(makeValidUser());
      expect(result.success).toBe(true);
    });

    it("infers correct TypeScript type", () => {
      const result = UserSchema.safeParse(makeValidUser());
      if (result.success) {
        const user: User = result.data;
        expect(typeof user.id).toBe("string");
        expect(typeof user.email).toBe("string");
        expect(typeof user.format).toBe("string");
      }
    });

    it("accepts all valid role values", () => {
      for (const role of ["admin", "user", "manager"] as const) {
        const result = UserSchema.safeParse(makeValidUser({ role }));
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid status values", () => {
      for (const status of ["active", "inactive", "banned"] as const) {
        const result = UserSchema.safeParse(makeValidUser({ status }));
        expect(result.success).toBe(true);
      }
    });

    it("accepts stringbool truthy values for active", () => {
      for (const active of ["true", "1", "yes"]) {
        const result = UserSchema.safeParse(makeValidUser({ active }));
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.active).toBe(true);
        }
      }
    });

    it("accepts stringbool falsy values for active", () => {
      for (const active of ["false", "0", "no"]) {
        const result = UserSchema.safeParse(makeValidUser({ active }));
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.active).toBe(false);
        }
      }
    });

    it("coerces age from string to number", () => {
      const result = UserSchema.safeParse(makeValidUser({ age: "30" }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts optional bio as undefined", () => {
      const result = UserSchema.safeParse(makeValidUser({
        profile: { joined: new Date("2023-01-01") },
      }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.bio).toBeUndefined();
      }
    });

    it("accepts valid template literal code (user-<number>)", () => {
      const result = UserSchema.safeParse(makeValidUser({ code: "user-9999" }));
      expect(result.success).toBe(true);
    });

    it("accepts valid websiteUrl", () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "https://mywebsite.io" }));
      expect(result.success).toBe(true);
    });

    it("accepts valid portfolio url", () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: "http://portfolio.dev" }));
      expect(result.success).toBe(true);
    });

    it("accepts empty string for format", () => {
      const result = UserSchema.safeParse(makeValidUser({ format: "" }));
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects an invalid UUID for id", () => {
      const result = UserSchema.safeParse(makeValidUser({ id: "not-a-uuid" }));
      expect(result.success).toBe(false);
    });

    it("rejects an invalid email", () => {
      const result = UserSchema.safeParse(makeValidUser({ email: "not-an-email" }));
      expect(result.success).toBe(false);
    });

    it("rejects age below 18", () => {
      const result = UserSchema.safeParse(makeValidUser({ age: 17 }));
      expect(result.success).toBe(false);
    });

    it("rejects age exactly 17", () => {
      const result = UserSchema.safeParse(makeValidUser({ age: 17 }));
      expect(result.success).toBe(false);
    });

    it("rejects an invalid role", () => {
      const result = UserSchema.safeParse(makeValidUser({ role: "superuser" }));
      expect(result.success).toBe(false);
    });

    it("rejects an invalid status value", () => {
      const result = UserSchema.safeParse(makeValidUser({ status: "pending" }));
      expect(result.success).toBe(false);
    });

    it("rejects code that does not match template literal pattern", () => {
      const result = UserSchema.safeParse(makeValidUser({ code: "admin-5" }));
      expect(result.success).toBe(false);
    });

    it("rejects code with number out of range (0)", () => {
      const result = UserSchema.safeParse(makeValidUser({ code: "user-0" }));
      expect(result.success).toBe(false);
    });

    it("rejects invalid websiteUrl", () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "not-a-url" }));
      expect(result.success).toBe(false);
    });

    it("rejects invalid portfolio url", () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: "ftp://bad" }));
      expect(result.success).toBe(false);
    });

    it("rejects missing required format field", () => {
      const input = makeValidUser();
      delete input.format;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects missing required websiteUrl", () => {
      const input = makeValidUser();
      delete input.websiteUrl;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects missing required portfolio", () => {
      const input = makeValidUser();
      delete input.portfolio;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects missing required siteUrls", () => {
      const input = makeValidUser();
      delete input.siteUrls;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects strict object with extra profile fields", () => {
      const result = UserSchema.safeParse(makeValidUser({
        profile: { bio: "bio", joined: new Date(), extraField: "unexpected" },
      }));
      expect(result.success).toBe(false);
    });

    it("rejects missing profile.joined", () => {
      const result = UserSchema.safeParse(makeValidUser({
        profile: { bio: "bio" },
      }));
      expect(result.success).toBe(false);
    });

    it("rejects null input", () => {
      const result = UserSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects completely empty object", () => {
      const result = UserSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser", () => {
  it("returns parsed user for valid input", () => {
    const input = makeValidUser();
    const user = parseUser(input);
    expect(user.id).toBe(input.id);
    expect(user.email).toBe(input.email);
    expect(user.format).toBe("json");
    expect(user.websiteUrl).toBe("https://example.com/");
    expect(user.portfolio).toBe("https://portfolio.example.com/");
  });

  it("throws an error for invalid input", () => {
    expect(() => parseUser({ id: "bad-id" })).toThrow();
  });

  it("throws an error containing structured error info", () => {
    let errorMessage = "";
    try {
      parseUser({ id: "not-a-uuid", email: "not-an-email", age: 10 });
    } catch (e) {
      errorMessage = (e as Error).message;
    }
    expect(errorMessage).toBeTruthy();
    // The error message is JSON from treeify()
    expect(() => JSON.parse(errorMessage)).not.toThrow();
  });

  it("throws for completely missing data", () => {
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser(undefined)).toThrow();
    expect(() => parseUser({})).toThrow();
  });

  it("correctly coerces age from string on successful parse", () => {
    const user = parseUser(makeValidUser({ age: "22" }));
    expect(user.age).toBe(22);
  });
});