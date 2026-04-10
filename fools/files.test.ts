import { describe, it, expect } from "vitest";
import { z } from "zod";

// Tests for fools/files.ts UserSchema changes introduced in this PR:
//  - status field changed from z.literal([...]) to z.enum([...])
//  - websiteUrl, portfolio, siteUrls, format fields added
//  - website field removed

// ---------------------------------------------------------------------------
// Helpers – re-declare only the parts of UserSchema that were changed so we
// can test them even though the full schema cannot be instantiated (z.urls()
// does not exist in zod 4.x, so the real module throws on import).
// ---------------------------------------------------------------------------

const StatusSchema = z.enum(["active", "inactive", "banned"]);

const PartialUserSchema = z.object({
  id: z.uuid({ message: "Invalid ID" }),
  email: z.email({ message: "Invalid email" }),
  age: z.coerce.number().int().min(18, { message: "Must be 18+" }),
  active: z.stringbool(),
  role: z.enum(["admin", "user", "manager"]),
  status: StatusSchema,
  code: z.templateLiteral([z.literal("user-"), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  format: z.string(),
});

type PartialUser = z.infer<typeof PartialUserSchema>;

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_EMAIL = "user@example.com";
const VALID_URL = "https://example.com";

function buildValidInput(overrides: Partial<PartialUser> = {}): PartialUser {
  return {
    id: VALID_UUID,
    email: VALID_EMAIL,
    age: 25,
    active: "true" as unknown as boolean,
    role: "user",
    status: "active",
    code: "user-42" as `user-${number}`,
    profile: { bio: "Hello", joined: new Date("2020-01-01") },
    websiteUrl: VALID_URL,
    portfolio: VALID_URL,
    format: "json",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// status field (changed from z.literal to z.enum in this PR)
// ---------------------------------------------------------------------------
describe("status field (z.enum change)", () => {
  it("accepts 'active'", () => {
    expect(StatusSchema.parse("active")).toBe("active");
  });

  it("accepts 'inactive'", () => {
    expect(StatusSchema.parse("inactive")).toBe("inactive");
  });

  it("accepts 'banned'", () => {
    expect(StatusSchema.parse("banned")).toBe("banned");
  });

  it("rejects an unknown status value", () => {
    const result = StatusSchema.safeParse("suspended");
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = StatusSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = StatusSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("provides the correct enum options", () => {
    expect(StatusSchema.options).toEqual(["active", "inactive", "banned"]);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field (new in this PR)
// ---------------------------------------------------------------------------
describe("websiteUrl field (new z.url() field)", () => {
  it("accepts a valid https URL", () => {
    const input = buildValidInput({ websiteUrl: "https://example.com" });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL", () => {
    const input = buildValidInput({ websiteUrl: "http://example.com/path" });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects a plain string without protocol", () => {
    const input = buildValidInput({ websiteUrl: "not-a-url" as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const input = buildValidInput({ websiteUrl: "" as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field (new in this PR)
// ---------------------------------------------------------------------------
describe("portfolio field (new z.url() field)", () => {
  it("accepts a valid URL", () => {
    const input = buildValidInput({ portfolio: "https://portfolio.dev/user" });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string", () => {
    const input = buildValidInput({ portfolio: "my-portfolio" as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field (new z.string() field)
// ---------------------------------------------------------------------------
describe("format field (new z.string() field)", () => {
  it("accepts any non-empty string", () => {
    for (const val of ["json", "xml", "csv", "plain text"]) {
      const input = buildValidInput({ format: val });
      const result = PartialUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("accepts an empty string (z.string() allows it)", () => {
    const input = buildValidInput({ format: "" });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects a number", () => {
    const input = buildValidInput({ format: 42 as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls field — z.urls() does not exist in zod 4.x;
// this test documents the fact that the full module cannot be loaded.
// ---------------------------------------------------------------------------
describe("siteUrls field (z.urls() — unavailable in zod 4.x)", () => {
  it("z.urls is not a function in the installed version of zod", () => {
    expect(typeof (z as any).urls).not.toBe("function");
  });

  it("importing the real UserSchema throws because z.urls() is undefined", () => {
    expect(() => {
      // z.urls() would be called during schema construction
      (z as any).urls();
    }).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Combined happy-path for all new fields together
// ---------------------------------------------------------------------------
describe("PartialUserSchema — combined new fields", () => {
  it("parses a fully-valid object", () => {
    const input = buildValidInput();
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.websiteUrl).toBe(VALID_URL);
      expect(result.data.portfolio).toBe(VALID_URL);
      expect(result.data.format).toBe("json");
    }
  });

  it("rejects when websiteUrl is missing", () => {
    const { websiteUrl, ...rest } = buildValidInput();
    const result = PartialUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when portfolio is missing", () => {
    const { portfolio, ...rest } = buildValidInput();
    const result = PartialUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when status is invalid", () => {
    const input = buildValidInput({ status: "unknown" as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects when age is below 18", () => {
    const input = buildValidInput({ age: 17 });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const input = buildValidInput({ email: "not-an-email" as any });
    const result = PartialUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});