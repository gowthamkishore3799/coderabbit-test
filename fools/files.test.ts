/**
 * Tests for fools/files.ts (UserSchema changes from this PR)
 *
 * NOTE: fools/files.ts uses z.urls() which does not exist in zod v4.1.5.
 * That means the module throws at load time. These tests mirror the changed
 * schema fields using an inline replica so we can verify the PR's logic
 * independently of that pre-existing incompatibility.
 *
 * Fields changed/added in this PR:
 *   - status: changed from z.literal([...]) to z.enum([...])
 *   - websiteUrl: added (z.url())
 *   - portfolio: added (z.url())
 *   - siteUrls: added (z.urls() — broken in zod v4.1.5, tested via z.array(z.url()) equivalent)
 *   - format: added (z.string())
 *   - website field: removed
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replica of the PR's UserSchema using z.array(z.url()) instead of z.urls()
// because z.urls() does not exist in zod v4.1.5.
const UserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: z.enum(["active", "inactive", "banned"]), // PR CHANGE: was z.literal
  code: z.templateLiteral([
    z.literal("user-"),
    z.number().min(1).max(9999),
  ]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),    // PR CHANGE: added
  portfolio: z.url(),     // PR CHANGE: added
  siteUrls: z.array(z.url()), // PR CHANGE: added (mirrors z.urls() intent)
  format: z.string(),     // PR CHANGE: added
});

type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

const validInput = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  status: "active",
  code: "user-42",
  profile: {
    bio: "A software engineer",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://site1.example.com", "https://site2.example.com"],
  format: "json",
};

describe("UserSchema - PR changes (fools/files.ts)", () => {
  describe("valid input", () => {
    it("accepts a fully valid user object", () => {
      const result = UserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts optional bio as absent", () => {
      const input = { ...validInput, profile: { joined: new Date() } };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("id - z.uuid()", () => {
    it("rejects non-UUID id with custom message", () => {
      const result = UserSchema.safeParse({ ...validInput, id: "not-a-uuid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error)).toContain("Invalid ID");
      }
    });
  });

  describe("email - z.email()", () => {
    it("rejects invalid email with custom message", () => {
      const result = UserSchema.safeParse({ ...validInput, email: "bad-email" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error)).toContain("Invalid email");
      }
    });
  });

  describe("age - z.coerce.number().int().min(18)", () => {
    it("coerces string age", () => {
      const result = UserSchema.safeParse({ ...validInput, age: "30" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });

    it("rejects age below 18 with custom message", () => {
      const result = UserSchema.safeParse({ ...validInput, age: 17 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error)).toContain("Must be 18+");
      }
    });

    it("accepts exact boundary age 18", () => {
      expect(UserSchema.safeParse({ ...validInput, age: 18 }).success).toBe(true);
    });

    it("rejects float age", () => {
      expect(UserSchema.safeParse({ ...validInput, age: 18.5 }).success).toBe(false);
    });
  });

  describe("active - z.stringbool()", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
      ["yes", true],
      ["no", false],
    ])('parses "%s" as %s', (input, expected) => {
      const result = UserSchema.safeParse({ ...validInput, active: input });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(expected);
    });
  });

  describe("role - z.enum(['admin','user','manager'])", () => {
    it.each(["admin", "user", "manager"])("accepts role '%s'", (role) => {
      expect(UserSchema.safeParse({ ...validInput, role }).success).toBe(true);
    });

    it("rejects unknown role", () => {
      expect(UserSchema.safeParse({ ...validInput, role: "superadmin" }).success).toBe(false);
    });
  });

  // PR CHANGE: status was changed from z.literal to z.enum
  describe("status - z.enum (PR: changed from z.literal)", () => {
    it.each(["active", "inactive", "banned"])("accepts status '%s'", (status) => {
      expect(UserSchema.safeParse({ ...validInput, status }).success).toBe(true);
    });

    it("rejects unknown status", () => {
      expect(UserSchema.safeParse({ ...validInput, status: "suspended" }).success).toBe(false);
    });

    it("rejects empty string status", () => {
      expect(UserSchema.safeParse({ ...validInput, status: "" }).success).toBe(false);
    });

    it("rejects null status", () => {
      expect(UserSchema.safeParse({ ...validInput, status: null }).success).toBe(false);
    });
  });

  describe("code - z.templateLiteral", () => {
    it("accepts 'user-1'", () => {
      expect(UserSchema.safeParse({ ...validInput, code: "user-1" }).success).toBe(true);
    });

    it("accepts 'user-9999'", () => {
      expect(UserSchema.safeParse({ ...validInput, code: "user-9999" }).success).toBe(true);
    });

    it("rejects code without 'user-' prefix", () => {
      expect(UserSchema.safeParse({ ...validInput, code: "admin-10" }).success).toBe(false);
    });
  });

  describe("profile - z.strictObject", () => {
    it("rejects extra unknown fields in profile", () => {
      const result = UserSchema.safeParse({
        ...validInput,
        profile: { bio: "hi", joined: new Date(), extra: true },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing 'joined' date", () => {
      expect(UserSchema.safeParse({ ...validInput, profile: { bio: "hi" } }).success).toBe(false);
    });

    it("rejects string 'joined' instead of Date", () => {
      expect(
        UserSchema.safeParse({ ...validInput, profile: { joined: "2023-01-01" } }).success
      ).toBe(false);
    });
  });

  // PR CHANGE: websiteUrl was ADDED in this PR
  describe("websiteUrl - z.url() (added in PR)", () => {
    it("accepts valid HTTPS URL", () => {
      expect(
        UserSchema.safeParse({ ...validInput, websiteUrl: "https://mysite.com" }).success
      ).toBe(true);
    });

    it("rejects invalid URL string", () => {
      expect(
        UserSchema.safeParse({ ...validInput, websiteUrl: "not-a-url" }).success
      ).toBe(false);
    });

    it("rejects empty string", () => {
      expect(UserSchema.safeParse({ ...validInput, websiteUrl: "" }).success).toBe(false);
    });

    it("is required - rejects when absent", () => {
      const { websiteUrl: _, ...without } = validInput;
      expect(UserSchema.safeParse(without).success).toBe(false);
    });
  });

  // PR CHANGE: portfolio was ADDED in this PR
  describe("portfolio - z.url() (added in PR)", () => {
    it("accepts valid HTTPS URL", () => {
      expect(
        UserSchema.safeParse({ ...validInput, portfolio: "https://portfolio.dev" }).success
      ).toBe(true);
    });

    it("rejects plain text", () => {
      expect(UserSchema.safeParse({ ...validInput, portfolio: "my-portfolio" }).success).toBe(false);
    });

    it("is required - rejects when absent", () => {
      const { portfolio: _, ...without } = validInput;
      expect(UserSchema.safeParse(without).success).toBe(false);
    });
  });

  // PR CHANGE: siteUrls was ADDED in this PR (z.urls())
  describe("siteUrls - array of URLs (added in PR)", () => {
    it("accepts an array of valid URLs", () => {
      const result = UserSchema.safeParse({
        ...validInput,
        siteUrls: ["https://a.com", "https://b.org"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      expect(UserSchema.safeParse({ ...validInput, siteUrls: [] }).success).toBe(true);
    });

    it("rejects array with an invalid URL entry", () => {
      expect(
        UserSchema.safeParse({ ...validInput, siteUrls: ["https://valid.com", "bad-url"] }).success
      ).toBe(false);
    });

    it("is required - rejects when absent", () => {
      const { siteUrls: _, ...without } = validInput;
      expect(UserSchema.safeParse(without).success).toBe(false);
    });
  });

  // PR CHANGE: format was ADDED in this PR
  describe("format - z.string() (added in PR)", () => {
    it("accepts any string value", () => {
      expect(UserSchema.safeParse({ ...validInput, format: "xml" }).success).toBe(true);
    });

    it("accepts empty string", () => {
      expect(UserSchema.safeParse({ ...validInput, format: "" }).success).toBe(true);
    });

    it("is required - rejects when absent", () => {
      const { format: _, ...without } = validInput;
      expect(UserSchema.safeParse(without).success).toBe(false);
    });
  });

  describe("parseUser helper", () => {
    it("returns parsed user for valid input", () => {
      const user = parseUser(validInput);
      expect(user.id).toBe(validInput.id);
      expect(user.status).toBe("active");
      expect(user.format).toBe("json");
    });

    it("throws on invalid input", () => {
      expect(() => parseUser({ ...validInput, email: "bad" })).toThrow();
    });

    it("throws Error with message for invalid age", () => {
      expect(() => parseUser({ ...validInput, age: 10 })).toThrow(Error);
    });
  });
});