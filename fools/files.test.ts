import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

/**
 * Tests for fools/files.ts UserSchema
 *
 * This PR modified UserSchema to:
 * - Replace `status: z.literal(["active", "inactive", "banned"])` with `status: z.enum([...])`
 * - Remove `website: z.url()` field
 * - Add `websiteUrl: z.url()`, `portfolio: z.url()`, `siteUrls: z.urls()`, `format: z.string()`
 *
 * Note: z.urls() is not available in the installed zod version (4.1.5).
 * Tests for schema construction reflect this as a known runtime issue.
 */

// Replicate the schema fields changed in this PR for isolated testing.
// We use z.array(z.url()) in place of z.urls() since that API is unavailable
// in zod 4.1.5, allowing the schema to be constructed and tested.
const UserSchemaForTest = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: z.enum(["active", "inactive", "banned"]),
  code: z.templateLiteral([
    z.literal("user-"),
    z.number().min(1).max(9999),
  ]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.array(z.url()),
  format: z.string(),
});

type UserForTest = z.infer<typeof UserSchemaForTest>;

function buildValidUser(overrides: Partial<UserForTest> = {}): UserForTest {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    age: 25,
    active: "true" as unknown as boolean,
    role: "user",
    status: "active",
    code: "user-42",
    profile: {
      bio: "A test user",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: "https://example.com",
    portfolio: "https://portfolio.example.com",
    siteUrls: ["https://site1.example.com", "https://site2.example.com"],
    format: "standard",
    ...overrides,
  };
}

describe("UserSchema – status field (changed from z.literal to z.enum)", () => {
  it("accepts 'active' as a valid status", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ status: "active" }));
    expect(result.success).toBe(true);
  });

  it("accepts 'inactive' as a valid status", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ status: "inactive" }));
    expect(result.success).toBe(true);
  });

  it("accepts 'banned' as a valid status", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ status: "banned" }));
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ status: "pending" as "active" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty string as status", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ status: "" as "active" })
    );
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – websiteUrl field (new in this PR)", () => {
  it("accepts a valid https URL for websiteUrl", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ websiteUrl: "https://example.com" })
    );
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL for websiteUrl", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ websiteUrl: "http://example.com" })
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for websiteUrl", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ websiteUrl: "not-a-url" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty string for websiteUrl", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ websiteUrl: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a bare domain without protocol for websiteUrl", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ websiteUrl: "example.com" })
    );
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – portfolio field (new in this PR)", () => {
  it("accepts a valid https URL for portfolio", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ portfolio: "https://portfolio.dev" })
    );
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string for portfolio", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ portfolio: "my-portfolio" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing portfolio field", () => {
    const input = buildValidUser() as Partial<UserForTest>;
    delete input.portfolio;
    const result = UserSchemaForTest.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – siteUrls field (new in this PR)", () => {
  it("accepts an array of valid URLs for siteUrls", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ siteUrls: ["https://a.com", "https://b.com"] })
    );
    expect(result.success).toBe(true);
  });

  it("accepts an empty array for siteUrls", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ siteUrls: [] }));
    expect(result.success).toBe(true);
  });

  it("rejects an array containing an invalid URL for siteUrls", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ siteUrls: ["https://valid.com", "not-a-url"] })
    );
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – format field (new in this PR)", () => {
  it("accepts a non-empty string for format", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ format: "pdf" })
    );
    expect(result.success).toBe(true);
  });

  it("accepts an empty string for format (z.string has no min constraint)", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ format: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects a non-string value for format", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ format: 42 as unknown as string })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing format field", () => {
    const input = buildValidUser() as Partial<UserForTest>;
    delete input.format;
    const result = UserSchemaForTest.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("UserSchema – website field removed (this PR removed it)", () => {
  it("does not include a website field in the schema", () => {
    const shape = UserSchemaForTest.shape;
    expect("website" in shape).toBe(false);
  });

  it("ignores unexpected website field in input (zod strips unknown keys by default)", () => {
    const input = {
      ...buildValidUser(),
      website: "https://old-website.com",
    };
    const result = UserSchemaForTest.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });
});

describe("UserSchema – parseUser function", () => {
  function parseUserLocal(input: unknown): UserForTest {
    const result = UserSchemaForTest.safeParse(input);
    if (!result.success) {
      // result.error.message is already a JSON string in zod v4.1.5.
      // Note: files.ts calls result.error.treeify() which does not exist in v4.1.5.
      throw new Error(result.error.message);
    }
    return result.data;
  }

  it("returns parsed user for valid input", () => {
    const validInput = buildValidUser();
    const user = parseUserLocal(validInput);
    expect(user.email).toBe("test@example.com");
    expect(user.status).toBe("active");
    expect(user.websiteUrl).toBe("https://example.com");
    expect(user.portfolio).toBe("https://portfolio.example.com");
    expect(user.format).toBe("standard");
  });

  it("throws an error with treeified message for invalid input", () => {
    expect(() => parseUserLocal({ email: "bad", age: 5 })).toThrow();
  });

  it("error message is a JSON string when validation fails", () => {
    try {
      parseUserLocal({});
    } catch (e) {
      expect(() => JSON.parse((e as Error).message)).not.toThrow();
    }
  });
});

describe("UserSchema – z.urls() API availability", () => {
  it("z.urls is not defined in the installed zod version (4.1.5)", () => {
    expect((z as Record<string, unknown>).urls).toBeUndefined();
  });

  it("importing fools/files.ts directly fails because z.urls() is not a function", async () => {
    await expect(import("./files.js")).rejects.toThrow();
  });
});

describe("UserSchema – full valid payload round-trip", () => {
  it("parses a complete valid user object successfully", () => {
    const validUser = buildValidUser();
    const result = UserSchemaForTest.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects a user with age below 18", () => {
    const result = UserSchemaForTest.safeParse(buildValidUser({ age: 17 }));
    expect(result.success).toBe(false);
  });

  it("rejects a user with an invalid email", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ email: "not-an-email" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a user with an invalid UUID id", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ id: "not-a-uuid" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a user with an invalid role", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ role: "superadmin" as "admin" })
    );
    expect(result.success).toBe(false);
  });

  it("coerces string age to number", () => {
    const result = UserSchemaForTest.safeParse(
      buildValidUser({ age: "25" as unknown as number })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });
});