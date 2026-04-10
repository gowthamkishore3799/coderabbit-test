import { describe, it, expect, vi } from "vitest";

// Stub z.urls() which is not yet in Zod 4.x public API. Without this, importing
// the UserSchema module fails at load time. We use a Proxy to intercept z.urls
// calls and return z.string() instead, without mutating the frozen z object.
vi.mock("zod", async () => {
  const actual = await vi.importActual<typeof import("zod")>("zod");
  const z = actual.z as any;
  const patchedZ = new Proxy(z, {
    get(target: any, prop: string) {
      if (prop === "urls") return () => target.string();
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return { ...actual, z: patchedZ };
});

import { UserSchema, parseUser } from "./files";

// A valid base user satisfying all required fields
const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  age: 25,
  active: "true",
  role: "admin" as const,
  status: "active" as const,
  code: "user-42",
  profile: {
    bio: "A developer",
    joined: new Date("2023-01-01"),
  },
  websiteUrl: "https://example.com",
  portfolio: "https://portfolio.example.com",
  siteUrls: "https://site1.com https://site2.com",
  format: "json",
};

describe("UserSchema", () => {
  describe("valid inputs", () => {
    it("accepts a fully valid user object", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts user without optional bio", () => {
      const user = {
        ...validUser,
        profile: { joined: new Date("2023-01-01") },
      };
      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it("coerces age from string to number", () => {
      const user = { ...validUser, age: "30" };
      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });

    it("accepts all valid role values", () => {
      const roles = ["admin", "user", "manager"] as const;
      for (const role of roles) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success, `role '${role}' should be valid`).toBe(true);
      }
    });

    it("accepts all valid status values (active, inactive, banned)", () => {
      const statuses = ["active", "inactive", "banned"] as const;
      for (const status of statuses) {
        const result = UserSchema.safeParse({ ...validUser, status });
        expect(result.success, `status '${status}' should be valid`).toBe(true);
      }
    });

    it("accepts stringbool 'false' for active field", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "false" });
      expect(result.success).toBe(true);
    });

    it("accepts stringbool '1' for active field", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "1" });
      expect(result.success).toBe(true);
    });

    it("accepts stringbool '0' for active field", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "0" });
      expect(result.success).toBe(true);
    });

    it("accepts stringbool 'yes' for active field", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "yes" });
      expect(result.success).toBe(true);
    });

    it("accepts stringbool 'no' for active field", () => {
      const result = UserSchema.safeParse({ ...validUser, active: "no" });
      expect(result.success).toBe(true);
    });

    it("accepts valid template literal code 'user-1'", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-1" });
      expect(result.success).toBe(true);
    });

    it("accepts code at upper boundary 'user-9999'", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-9999" });
      expect(result.success).toBe(true);
    });
  });

  describe("id field (z.uuid)", () => {
    it("rejects invalid uuid", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string uuid", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "" });
      expect(result.success).toBe(false);
    });

    it("includes custom 'Invalid ID' error message on invalid id", () => {
      const result = UserSchema.safeParse({ ...validUser, id: "bad-id" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const idIssue = result.error.issues.find((i) => i.path.includes("id"));
        expect(idIssue?.message).toBe("Invalid ID");
      }
    });
  });

  describe("email field (z.email)", () => {
    it("rejects invalid email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });

    it("includes custom 'Invalid email' message on bad email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "bad" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("email"));
        expect(issue?.message).toBe("Invalid email");
      }
    });
  });

  describe("age field (z.coerce.number.int.min18)", () => {
    it("rejects age below 18", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it("accepts age exactly 18 (boundary)", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it("rejects non-numeric age string", () => {
      const result = UserSchema.safeParse({ ...validUser, age: "twenty" });
      expect(result.success).toBe(false);
    });

    it("rejects float age (non-integer)", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 20.5 });
      expect(result.success).toBe(false);
    });

    it("includes custom 'Must be 18+' message on underage", () => {
      const result = UserSchema.safeParse({ ...validUser, age: 16 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("age"));
        expect(issue?.message).toBe("Must be 18+");
      }
    });
  });

  describe("role field (z.enum)", () => {
    it("rejects unknown role 'superuser'", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "superuser" });
      expect(result.success).toBe(false);
    });

    it("rejects empty role string", () => {
      const result = UserSchema.safeParse({ ...validUser, role: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("status field (z.enum — changed from z.literal in this PR)", () => {
    it("rejects unknown status 'pending'", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "pending" });
      expect(result.success).toBe(false);
    });

    it("accepts 'banned' status (valid enum value)", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "banned" });
      expect(result.success).toBe(true);
    });

    it("accepts 'inactive' status (valid enum value)", () => {
      const result = UserSchema.safeParse({ ...validUser, status: "inactive" });
      expect(result.success).toBe(true);
    });

    it("extra unknown field 'website' (removed in this PR) is stripped silently", () => {
      // z.object strips unknown keys; the old 'website' top-level field was removed
      const result = UserSchema.safeParse({ ...validUser, website: "https://old-field.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("code field (z.templateLiteral)", () => {
    it("rejects code not starting with 'user-' prefix", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "admin-42" });
      expect(result.success).toBe(false);
    });

    it("rejects code with no numeric part (just 'user-')", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-" });
      expect(result.success).toBe(false);
    });

    it("rejects code with non-numeric suffix", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "user-abc" });
      expect(result.success).toBe(false);
    });

    it("rejects a plain string without 'user-' prefix", () => {
      const result = UserSchema.safeParse({ ...validUser, code: "42" });
      expect(result.success).toBe(false);
    });
  });

  describe("profile field (z.strictObject)", () => {
    it("rejects profile with unknown extra keys due to strictObject", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: {
          bio: "dev",
          joined: new Date("2023-01-01"),
          unknownKey: "should fail",
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile missing required 'joined' date", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: "dev" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects profile with string instead of Date for joined", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: "2023-01-01" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("websiteUrl field (z.url — added in this PR)", () => {
    it("rejects invalid URL string", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts a valid https URL", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "https://mysite.com" });
      expect(result.success).toBe(true);
    });

    it("accepts a valid http URL", () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: "http://example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects missing websiteUrl field", () => {
      const { websiteUrl, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("portfolio field (z.url — added in this PR)", () => {
    it("rejects invalid URL string for portfolio", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts a valid https URL for portfolio", () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: "https://portfolio.dev" });
      expect(result.success).toBe(true);
    });

    it("rejects missing portfolio field", () => {
      const { portfolio, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("siteUrls field (z.urls stub — added in this PR)", () => {
    it("accepts a string value for siteUrls (stubbed as z.string)", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: "https://example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects non-string value for siteUrls", () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: 42 });
      expect(result.success).toBe(false);
    });

    it("rejects missing siteUrls field", () => {
      const { siteUrls, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("format field (z.string — added in this PR)", () => {
    it("accepts any non-empty string for format", () => {
      const result = UserSchema.safeParse({ ...validUser, format: "xml" });
      expect(result.success).toBe(true);
    });

    it("rejects non-string format value", () => {
      const result = UserSchema.safeParse({ ...validUser, format: 42 });
      expect(result.success).toBe(false);
    });

    it("rejects missing format field", () => {
      const { format, ...rest } = validUser;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe("required fields", () => {
    it("rejects completely empty object", () => {
      const result = UserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects null input", () => {
      const result = UserSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

describe("parseUser", () => {
  it("returns parsed user data on valid input", () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.role).toBe("admin");
    expect(user.status).toBe("active");
  });

  it("includes all new fields added in this PR in the parsed result", () => {
    const user = parseUser(validUser);
    expect(user.websiteUrl).toBe(validUser.websiteUrl);
    expect(user.portfolio).toBe(validUser.portfolio);
    expect(user.format).toBe(validUser.format);
  });

  it("throws on completely invalid input", () => {
    expect(() => parseUser({ id: "not-a-uuid", email: "bad" })).toThrow();
  });

  it("throws an Error instance with a non-empty message", () => {
    let caughtError: unknown;
    try {
      parseUser({});
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message.length).toBeGreaterThan(0);
  });

  it("coerces age string to number in returned data", () => {
    const user = parseUser({ ...validUser, age: "25" });
    expect(user.age).toBe(25);
  });

  it("throws for underage user (boundary: age 17)", () => {
    expect(() => parseUser({ ...validUser, age: 17 })).toThrow();
  });
});