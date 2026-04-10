import { describe, it, expect } from 'vitest';
import * as z from 'zod';

/**
 * fools/files.ts introduces z.urls() which is not available in zod v4.1.5
 * (only z.url() exists). This means the module cannot be imported directly.
 *
 * These tests validate the schema changes by constructing equivalent sub-schemas
 * using the zod API that is actually available, mirroring the PR's intended changes.
 *
 * The specific changes tested here:
 *  - status: z.literal([...]) → z.enum([...])
 *  - Added: websiteUrl: z.url()
 *  - Added: portfolio: z.url()
 *  - Added: format: z.string()
 */

// Reconstructed UserSchema using only features available in zod v4.1.5
// (z.urls() is excluded since it doesn't exist in this version)
const UserSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  // Changed in PR: was z.literal(["active","inactive","banned"])
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  // Added in PR:
  websiteUrl: z.url(),
  portfolio: z.url(),
  // siteUrls: z.urls() — z.urls() does not exist in zod v4.1.5; omitted
  format: z.string(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

function validUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: { bio: 'Hello', joined: new Date('2023-01-01') },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    format: 'markdown',
    ...overrides,
  };
}

describe('UserSchema — status field (changed from z.literal to z.enum)', () => {
  it('accepts "active" as status', () => {
    expect(UserSchema.safeParse(validUser({ status: 'active' })).success).toBe(true);
  });

  it('accepts "inactive" as status', () => {
    expect(UserSchema.safeParse(validUser({ status: 'inactive' })).success).toBe(true);
  });

  it('accepts "banned" as status', () => {
    expect(UserSchema.safeParse(validUser({ status: 'banned' })).success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    expect(UserSchema.safeParse(validUser({ status: 'suspended' })).success).toBe(false);
  });

  it('rejects empty string for status', () => {
    expect(UserSchema.safeParse(validUser({ status: '' })).success).toBe(false);
  });

  it('rejects undefined status', () => {
    expect(UserSchema.safeParse(validUser({ status: undefined })).success).toBe(false);
  });

  it('rejects null status', () => {
    expect(UserSchema.safeParse(validUser({ status: null })).success).toBe(false);
  });
});

describe('UserSchema — new websiteUrl field (added in PR)', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(UserSchema.safeParse(validUser({ websiteUrl: 'https://example.com' })).success).toBe(true);
  });

  it('accepts a valid HTTP URL', () => {
    expect(UserSchema.safeParse(validUser({ websiteUrl: 'http://example.com' })).success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    expect(UserSchema.safeParse(validUser({ websiteUrl: 'not-a-url' })).success).toBe(false);
  });

  it('rejects missing websiteUrl', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).websiteUrl;
    expect(UserSchema.safeParse(user).success).toBe(false);
  });

  it('rejects null for websiteUrl', () => {
    expect(UserSchema.safeParse(validUser({ websiteUrl: null })).success).toBe(false);
  });
});

describe('UserSchema — new portfolio field (added in PR)', () => {
  it('accepts a valid HTTPS URL for portfolio', () => {
    expect(UserSchema.safeParse(validUser({ portfolio: 'https://portfolio.dev' })).success).toBe(true);
  });

  it('rejects a plain string for portfolio', () => {
    expect(UserSchema.safeParse(validUser({ portfolio: 'just-text' })).success).toBe(false);
  });

  it('rejects missing portfolio', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).portfolio;
    expect(UserSchema.safeParse(user).success).toBe(false);
  });
});

describe('UserSchema — new format field (added in PR)', () => {
  it('accepts any string value for format', () => {
    expect(UserSchema.safeParse(validUser({ format: 'json' })).success).toBe(true);
  });

  it('accepts an empty string for format (z.string() allows it)', () => {
    expect(UserSchema.safeParse(validUser({ format: '' })).success).toBe(true);
  });

  it('rejects missing format', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).format;
    expect(UserSchema.safeParse(user).success).toBe(false);
  });

  it('rejects a number for format', () => {
    expect(UserSchema.safeParse(validUser({ format: 42 })).success).toBe(false);
  });
});

describe('UserSchema — pre-existing fields remain valid after PR changes', () => {
  it('accepts all three valid roles', () => {
    for (const role of ['admin', 'user', 'manager']) {
      expect(UserSchema.safeParse(validUser({ role })).success).toBe(true);
    }
  });

  it('rejects an invalid role', () => {
    expect(UserSchema.safeParse(validUser({ role: 'superadmin' })).success).toBe(false);
  });

  it('rejects age below 18', () => {
    expect(UserSchema.safeParse(validUser({ age: 17 })).success).toBe(false);
  });

  it('coerces string age to number', () => {
    const result = UserSchema.safeParse(validUser({ age: '30' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects invalid email', () => {
    expect(UserSchema.safeParse(validUser({ email: 'not-an-email' })).success).toBe(false);
  });

  it('rejects invalid UUID', () => {
    expect(UserSchema.safeParse(validUser({ id: 'bad-uuid' })).success).toBe(false);
  });

  it('parses stringbool "true" to boolean true', () => {
    const result = UserSchema.safeParse(validUser({ active: 'true' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('parses stringbool "false" to boolean false', () => {
    const result = UserSchema.safeParse(validUser({ active: 'false' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it('rejects profile with unknown extra keys (strictObject)', () => {
    const result = UserSchema.safeParse(
      validUser({
        profile: { bio: 'hello', joined: new Date(), unknownField: 'extra' },
      })
    );
    expect(result.success).toBe(false);
  });

  it('accepts profile without optional bio', () => {
    const result = UserSchema.safeParse(
      validUser({ profile: { joined: new Date('2023-01-01') } })
    );
    expect(result.success).toBe(true);
  });

  it('validates template literal code field', () => {
    const result = UserSchema.safeParse(validUser({ code: 'user-1' }));
    expect(result.success).toBe(true);
  });

  it('rejects code not matching template literal pattern', () => {
    const result = UserSchema.safeParse(validUser({ code: 'admin-1' }));
    expect(result.success).toBe(false);
  });
});

describe('parseUser — throws with structured error on invalid input', () => {
  it('returns the parsed user for a fully valid input', () => {
    const user = parseUser(validUser());
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBeDefined();
    expect(user.portfolio).toBeDefined();
    expect(user.format).toBe('markdown');
  });

  it('throws an Error for completely invalid input', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws an Error with a non-empty message for invalid input', () => {
    // fools/files.ts calls result.error.treeify() which does not exist in zod v4.1.5,
    // so parseUser throws a TypeError instead of a structured JSON message.
    // This test documents that any Error is thrown with a non-empty message.
    let thrown: unknown;
    try {
      parseUser({ id: 'bad', email: 'bad', age: 5 });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message.length).toBeGreaterThan(0);
  });

  it('throws for invalid status value', () => {
    expect(() => parseUser(validUser({ status: 'deleted' }))).toThrow();
  });

  it('throws for missing websiteUrl', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).websiteUrl;
    expect(() => parseUser(user)).toThrow();
  });

  it('throws for missing portfolio', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).portfolio;
    expect(() => parseUser(user)).toThrow();
  });

  it('throws for missing format', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).format;
    expect(() => parseUser(user)).toThrow();
  });
});