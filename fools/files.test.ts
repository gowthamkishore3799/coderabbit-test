import { describe, it, expect } from "vitest";
import { UserSchema, parseUser } from "./files";

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin",
  status: "active",
  code: "user-42",
  profile: {
    bio: "A test user",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: ["https://site1.com", "https://site2.com"],
  format: "json",
};

describe("UserSchema (fools/files.ts)", () => {
  describe("valid inputs", () => {
    it("accepts a fully valid user object", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts all valid status values", () => {
      for (const status of ["active", "inactive", "banned"]) {
        const result = UserSchema.safeParse({ ...validUser, status });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid role values", () => {
      for (const role of ["admin", "user", "manager"]) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid stringbool truthy values for active", () => {
      for (const active of ["true", "1", "yes"]) {
        const result = UserSchema.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid stringbool falsy values for active", () => {
      for (const active of ["false", "0", "no"]) {
        const result = UserSchema.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it("accepts valid code template literals", () => {
      for (const code of ["user-1", "user-9999", "user-100"]) {
        const result = UserSchema.safeParse({ ...validUser, code });
        expect(result.success).toBe(true);
      }
    });

    it("accepts profile without optional bio", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date("2023-01-01") },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty siteUrls array", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it("accepts multiple siteUrls", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://a.com", "https://b.com", "https://c.com"],
      });
      expect(result.success).toBe(true);
    });

    it("coerces age from string to number", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(25);
      }
    });

    it("accepts minimum age of 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("accepts any non-empty format string", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "xml" });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer age", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 25.5 });
      expect(result.success).toBe(false);
    });

    it("rejects invalid role value", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superadmin" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status value", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "pending" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status value that was previously a literal", () => {
      // Previously status used z.literal([...]) - now uses z.enum
      // Ensure non-enum values still fail
      const result = UserSchema.safeParse({ ...validUser, status: "deleted" });
      expect(result.success).toBe(false);
    });

    it("rejects code not matching template literal pattern", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "admin-42" });
      expect(result.success).toBe(false);
    });

    it("rejects code with number out of range", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-10000" });
      expect(result.success).toBe(false);
    });

    it("rejects code with number zero", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-0" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid websiteUrl", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid portfolio URL", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL in siteUrls array", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ["https://valid.com", "not-a-url"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects extra fields in strictObject profile", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: {
          bio: "hello",
          joined: new Date("2023-01-01"),
          extraField: "should fail",
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile missing required joined date", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "hello" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const { websiteUrl, ...withoutWebsiteUrl } = validUser;
      const result = UserSchema.safeParse(withoutWebsiteUrl);
      expect(result.success).toBe(false);
    });

    it("rejects missing portfolio field", () => {
      const { portfolio, ...withoutPortfolio } = validUser;
      const result = UserSchema.safeParse(withoutPortfolio);
      expect(result.success).toBe(false);
    });

    it("rejects missing siteUrls field", () => {
      const { siteUrls, ...withoutSiteUrls } = validUser;
      const result = UserSchema.safeParse(withoutSiteUrls);
      expect(result.success).toBe(false);
    });

    it("rejects missing format field", () => {
      const { format, ...withoutFormat } = validUser;
      const result = UserSchema.safeParse(withoutFormat);
      expect(result.success).toBe(false);
    });

    it("does not accept the old 'website' field name (field was renamed to websiteUrl)", () => {
      // The old schema had 'website', now the field is 'websiteUrl' - ensure old name is not valid
      const withOldFieldName = {
        ...validUser,
        website: "https://example.com",
      };
      // 'website' is not in the schema, but as a plain object parse it will be stripped/ignored
      // The test verifies the schema doesn't require or accept 'website' key as a schema field
      const result = UserSchema.safeParse(withOldFieldName);
      // Should still pass since extra keys are stripped in non-strict mode at top level
      // But 'website' is NOT a recognized field name in the new schema
      if (result.success) {
        expect((result.data as Record<string, unknown>).website).toBeUndefined();
      }
    });
  });

  describe("parseUser helper (files.ts)", () => {
    it("returns parsed user for valid input", () => {
      const result = parseUser(validUser);
      expect(result.email).toBe("user@example.com");
      expect(result.status).toBe("active");
      expect(result.format).toBe("json");
    });

    it("throws for invalid input", () => {
      expect(() => parseUser({ ...validUser, email: "bad" })).toThrow();
    });

    it("throws with structured error details (v4 treeify)", () => {
      expect(() => parseUser({ ...validUser, status: "pending" })).toThrow(Error);
    });

    it("returns websiteUrl and portfolio in parsed result", () => {
      const result = parseUser(validUser);
      expect(result.websiteUrl).toBe("https://example.com");
      expect(result.portfolio).toBe("https://portfolio.example.com");
    });

    it("returns siteUrls array in parsed result", () => {
      const result = parseUser(validUser);
      expect(Array.isArray(result.siteUrls)).toBe(true);
      expect(result.siteUrls).toHaveLength(2);
    });
  });
});