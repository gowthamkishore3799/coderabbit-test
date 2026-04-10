/**
 * Tests for UserSchema in fools/files.ts
 *
 * Covers PR changes:
 * - status field changed from z.literal([...]) to z.enum([...])
 * - websiteUrl field added (z.url())
 * - portfolio field added (z.url())
 * - siteUrls field added (z.urls())  – shimmed as z.array(z.url()) in this test
 * - format field added (z.string())
 * - website field (z.url()) removed; schema no longer has a top-level `website`
 *
 * z.urls() is not part of the Zod public API. We shim it via vi.mock('zod')
 * so the module can be loaded and the schema behaviour can be verified.
 */

import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Shim z.urls before fools/files.ts is imported.
// vi.hoisted ensures the shim is in place when vi.mock runs (hoisted order).
// ---------------------------------------------------------------------------
const { shimmedZ } = vi.hoisted(async () => {
  const original = await import("zod");
  const z = original.z;
  // z.urls is not a real Zod export; shim it as z.array(z.url()).
  const urls = () => z.array(z.url());
  const shimmedZ = Object.assign(Object.create(null), z, { urls });
  return { shimmedZ };
});

vi.mock("zod", async () => {
  const original = await import("zod");
  const z = original.z;
  const urls = () => z.array(z.url());
  // Return a namespace-shaped object with z.urls patched.
  return { ...original, z: Object.assign(Object.create(null), z, { urls }) };
});

import { UserSchema, parseUser } from "./files";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_URL = "https://example.com";

/** Builds a complete valid user object; individual fields can be overridden. */
function makeValidUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: VALID_UUID,
    email: "user@example.com",
    age: 25,
    active: "true",
    role: "user",
    status: "active",
    code: "user-42",
    profile: {
      bio: "Hello world",
      joined: new Date("2023-01-01"),
    },
    websiteUrl: VALID_URL,
    portfolio: "https://portfolio.example.com",
    siteUrls: ["https://site1.com", "https://site2.com"],
    format: "json",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Valid input
// ---------------------------------------------------------------------------
describe("UserSchema – valid data", () => {
  it("accepts a fully populated valid user", () => {
    const result = UserSchema.safeParse(makeValidUser());
    expect(result.success).toBe(true);
  });

  it("accepts optional bio being absent", () => {
    const user = makeValidUser({ profile: { joined: new Date("2023-01-01") } });
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it("coerces age string to number", () => {
    const result = UserSchema.safeParse(makeValidUser({ age: "30" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it("accepts empty siteUrls array", () => {
    const result = UserSchema.safeParse(makeValidUser({ siteUrls: [] }));
    expect(result.success).toBe(true);
  });

  it("accepts format as any string value", () => {
    for (const fmt of ["json", "csv", "xml", ""]) {
      const result = UserSchema.safeParse(makeValidUser({ format: fmt }));
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// status field – changed from z.literal([...]) to z.enum([...])
// ---------------------------------------------------------------------------
describe("UserSchema – status field (changed to z.enum)", () => {
  it.each(["active", "inactive", "banned"] as const)(
    "accepts status = %s",
    (status) => {
      const result = UserSchema.safeParse(makeValidUser({ status }));
      expect(result.success).toBe(true);
    }
  );

  it("rejects status values outside the enum", () => {
    for (const bad of ["pending", "suspended", "ACTIVE", ""]) {
      const result = UserSchema.safeParse(makeValidUser({ status: bad }));
      expect(result.success).toBe(false);
    }
  });

  it("rejects missing status", () => {
    const user = makeValidUser();
    delete (user as any).status;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field – newly added z.url()
// ---------------------------------------------------------------------------
describe("UserSchema – websiteUrl field (newly added)", () => {
  it("accepts a valid https URL for websiteUrl", () => {
    const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "https://mysite.com" }));
    expect(result.success).toBe(true);
  });

  it("accepts http URLs for websiteUrl", () => {
    const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "http://mysite.com" }));
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for websiteUrl", () => {
    const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "not-a-url" }));
    expect(result.success).toBe(false);
  });

  it("rejects a bare domain without protocol for websiteUrl", () => {
    const result = UserSchema.safeParse(makeValidUser({ websiteUrl: "example.com" }));
    expect(result.success).toBe(false);
  });

  it("rejects missing websiteUrl", () => {
    const user = makeValidUser();
    delete (user as any).websiteUrl;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field – newly added z.url()
// ---------------------------------------------------------------------------
describe("UserSchema – portfolio field (newly added)", () => {
  it("accepts a valid URL for portfolio", () => {
    const result = UserSchema.safeParse(makeValidUser({ portfolio: "https://portfolio.io" }));
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL for portfolio", () => {
    const result = UserSchema.safeParse(makeValidUser({ portfolio: "not-a-url" }));
    expect(result.success).toBe(false);
  });

  it("rejects empty string for portfolio", () => {
    const result = UserSchema.safeParse(makeValidUser({ portfolio: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects missing portfolio", () => {
    const user = makeValidUser();
    delete (user as any).portfolio;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls field – newly added (shimmed as z.array(z.url()))
// ---------------------------------------------------------------------------
describe("UserSchema – siteUrls field (newly added)", () => {
  it("accepts an array of valid URLs", () => {
    const result = UserSchema.safeParse(
      makeValidUser({ siteUrls: ["https://a.com", "https://b.org", "http://c.net"] })
    );
    expect(result.success).toBe(true);
  });

  it("accepts empty array for siteUrls", () => {
    const result = UserSchema.safeParse(makeValidUser({ siteUrls: [] }));
    expect(result.success).toBe(true);
  });

  it("rejects an array containing an invalid URL", () => {
    const result = UserSchema.safeParse(
      makeValidUser({ siteUrls: ["https://valid.com", "not-a-url"] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-array value for siteUrls", () => {
    const result = UserSchema.safeParse(makeValidUser({ siteUrls: "https://single.com" }));
    expect(result.success).toBe(false);
  });

  it("rejects missing siteUrls", () => {
    const user = makeValidUser();
    delete (user as any).siteUrls;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field – newly added z.string()
// ---------------------------------------------------------------------------
describe("UserSchema – format field (newly added)", () => {
  it("accepts any string for format", () => {
    for (const fmt of ["json", "csv", "", "any-value"]) {
      const result = UserSchema.safeParse(makeValidUser({ format: fmt }));
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-string format", () => {
    const result = UserSchema.safeParse(makeValidUser({ format: 123 }));
    expect(result.success).toBe(false);
  });

  it("rejects missing format", () => {
    const user = makeValidUser();
    delete (user as any).format;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Removed website field – schema no longer has a top-level `website` field
// ---------------------------------------------------------------------------
describe("UserSchema – website field removed", () => {
  it("accepts input without a website field (field was removed)", () => {
    const user = makeValidUser();
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it("strictObject on profile rejects unknown keys", () => {
    const user = makeValidUser({
      profile: {
        bio: "test",
        joined: new Date("2023-01-01"),
        extra: "not allowed",
      },
    });
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// id field validation
// ---------------------------------------------------------------------------
describe("UserSchema – id field", () => {
  it("rejects a non-UUID id", () => {
    const result = UserSchema.safeParse(makeValidUser({ id: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const user = makeValidUser();
    delete (user as any).id;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// email field validation
// ---------------------------------------------------------------------------
describe("UserSchema – email field", () => {
  it("rejects an invalid email", () => {
    const result = UserSchema.safeParse(makeValidUser({ email: "not-an-email" }));
    expect(result.success).toBe(false);
  });

  it("accepts a valid email", () => {
    const result = UserSchema.safeParse(makeValidUser({ email: "hello+tag@sub.domain.io" }));
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// age field (coercion + minimum)
// ---------------------------------------------------------------------------
describe("UserSchema – age field", () => {
  it("rejects age below 18", () => {
    const result = UserSchema.safeParse(makeValidUser({ age: 17 }));
    expect(result.success).toBe(false);
  });

  it("accepts age exactly 18", () => {
    const result = UserSchema.safeParse(makeValidUser({ age: 18 }));
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer age", () => {
    const result = UserSchema.safeParse(makeValidUser({ age: 20.5 }));
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// role field
// ---------------------------------------------------------------------------
describe("UserSchema – role field", () => {
  it.each(["admin", "user", "manager"] as const)("accepts role = %s", (role) => {
    const result = UserSchema.safeParse(makeValidUser({ role }));
    expect(result.success).toBe(true);
  });

  it("rejects unknown role", () => {
    const result = UserSchema.safeParse(makeValidUser({ role: "superuser" }));
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// active field (z.stringbool)
// ---------------------------------------------------------------------------
describe("UserSchema – active field (z.stringbool)", () => {
  it.each(["true", "false", "1", "0", "yes", "no"] as const)(
    "accepts active = %s",
    (active) => {
      const result = UserSchema.safeParse(makeValidUser({ active }));
      expect(result.success).toBe(true);
    }
  );

  it("rejects arbitrary string for active", () => {
    const result = UserSchema.safeParse(makeValidUser({ active: "maybe" }));
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper
// ---------------------------------------------------------------------------
describe("parseUser helper", () => {
  it("returns parsed data for valid input", () => {
    const user = makeValidUser();
    const result = parseUser(user);
    expect(result.id).toBe(VALID_UUID);
    expect(result.email).toBe("user@example.com");
    expect(result.status).toBe("active");
    expect(result.websiteUrl).toBe(VALID_URL);
    expect(result.format).toBe("json");
  });

  it("throws for invalid input", () => {
    expect(() => parseUser({ id: "bad", email: "bad" })).toThrow();
  });

  it("returns correct status value from enum", () => {
    const result = parseUser(makeValidUser({ status: "banned" }));
    expect(result.status).toBe("banned");
  });

  it("throws for unknown status value (enum enforcement)", () => {
    expect(() => parseUser(makeValidUser({ status: "unknown" }))).toThrow();
  });
});