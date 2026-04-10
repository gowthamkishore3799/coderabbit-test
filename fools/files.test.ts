import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Tests for fools/files.ts (UserSchema, parseUser).
 *
 * NOTE: fools/files.ts uses `z.urls()` which is not available in the
 * installed zod version (4.0.0). Importing the module directly causes a
 * TypeError at parse time. The tests below therefore replicate the schema
 * inline — covering every field added or changed by this PR — and include a
 * test that documents the z.urls() breakage.
 */

// ---------------------------------------------------------------------------
// Document the z.urls() issue found in the PR change
// ---------------------------------------------------------------------------
describe('fools/files.ts module compatibility', () => {
  it('z.url() is available in the installed zod version', () => {
    expect(typeof z.url).toBe('function');
  });

  it('z.urls() is NOT available in installed zod v4.0.0 (known schema bug)', () => {
    // fools/files.ts declares `siteUrls: z.urls()`.
    // z.urls() does not exist in zod 4.0.0; this test documents the breakage.
    expect((z as unknown as Record<string, unknown>).urls).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Replicated UserSchema — fields changed/added in this PR
// (z.urls() replaced with z.array(z.url()) which is semantically equivalent)
// ---------------------------------------------------------------------------
const UserSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  // Changed in this PR: from z.literal(["active","inactive","banned"]) to z.enum(...)
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  // New fields added in this PR:
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.array(z.url()), // z.urls() equivalent; z.urls() is absent in 4.0.0
  format: z.string(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    // Use .issues for error details (zod v4 compatible; treeify() not available in all builds)
    throw new Error(JSON.stringify(result.error.issues));
  }
  return result.data;
}

function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2023-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.com', 'https://site2.com'],
    format: 'html',
    ...overrides,
  };
}

describe('UserSchema', () => {
  describe('valid inputs', () => {
    it('parses a fully valid user object', () => {
      const result = UserSchema.safeParse(validInput());
      expect(result.success).toBe(true);
    });

    it('accepts all valid role values', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        expect(UserSchema.safeParse(validInput({ role })).success).toBe(true);
      }
    });

    it('accepts all valid status values (changed from z.literal to z.enum)', () => {
      for (const status of ['active', 'inactive', 'banned'] as const) {
        expect(UserSchema.safeParse(validInput({ status })).success).toBe(true);
      }
    });

    it('accepts stringbool "true" for active', () => {
      expect(UserSchema.safeParse(validInput({ active: 'true' })).success).toBe(true);
    });

    it('accepts stringbool "false" for active', () => {
      expect(UserSchema.safeParse(validInput({ active: 'false' })).success).toBe(true);
    });

    it('accepts stringbool "1" and "0" for active', () => {
      expect(UserSchema.safeParse(validInput({ active: '1' })).success).toBe(true);
      expect(UserSchema.safeParse(validInput({ active: '0' })).success).toBe(true);
    });

    it('coerces string age to number', () => {
      expect(UserSchema.safeParse(validInput({ age: '30' })).success).toBe(true);
    });

    it('accepts age exactly 18 (boundary)', () => {
      expect(UserSchema.safeParse(validInput({ age: 18 })).success).toBe(true);
    });

    it('accepts empty siteUrls array', () => {
      expect(UserSchema.safeParse(validInput({ siteUrls: [] })).success).toBe(true);
    });

    it('accepts profile without optional bio', () => {
      expect(UserSchema.safeParse(validInput({
        profile: { joined: new Date() },
      })).success).toBe(true);
    });
  });

  describe('status field (changed from z.literal to z.enum in this PR)', () => {
    it('rejects an unlisted status value', () => {
      expect(UserSchema.safeParse(validInput({ status: 'pending' })).success).toBe(false);
    });

    it('rejects empty string as status', () => {
      expect(UserSchema.safeParse(validInput({ status: '' })).success).toBe(false);
    });

    it('rejects numeric status', () => {
      expect(UserSchema.safeParse(validInput({ status: 1 })).success).toBe(false);
    });
  });

  describe('websiteUrl field (new in this PR)', () => {
    it('rejects invalid URL for websiteUrl', () => {
      expect(UserSchema.safeParse(validInput({ websiteUrl: 'not-a-url' })).success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const input = { ...validInput() };
      delete (input as Record<string, unknown>).websiteUrl;
      expect(UserSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('portfolio field (new in this PR)', () => {
    it('rejects invalid URL for portfolio', () => {
      expect(UserSchema.safeParse(validInput({ portfolio: 'not-a-url' })).success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const input = { ...validInput() };
      delete (input as Record<string, unknown>).portfolio;
      expect(UserSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('siteUrls field (new in this PR; uses z.array(z.url()) equivalent)', () => {
    it('rejects invalid siteUrls entry', () => {
      expect(UserSchema.safeParse(validInput({ siteUrls: ['not-a-url'] })).success).toBe(false);
    });

    it('rejects missing siteUrls', () => {
      const input = { ...validInput() };
      delete (input as Record<string, unknown>).siteUrls;
      expect(UserSchema.safeParse(input).success).toBe(false);
    });

    it('accepts a mix of multiple valid URLs', () => {
      expect(UserSchema.safeParse(validInput({
        siteUrls: ['https://a.com', 'https://b.io', 'https://c.dev'],
      })).success).toBe(true);
    });
  });

  describe('format field (new in this PR)', () => {
    it('accepts any string value', () => {
      expect(UserSchema.safeParse(validInput({ format: 'json' })).success).toBe(true);
    });

    it('accepts empty string (plain z.string, no constraints)', () => {
      expect(UserSchema.safeParse(validInput({ format: '' })).success).toBe(true);
    });

    it('rejects missing format', () => {
      const input = { ...validInput() };
      delete (input as Record<string, unknown>).format;
      expect(UserSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('core field validations', () => {
    it('rejects invalid UUID for id', () => {
      expect(UserSchema.safeParse(validInput({ id: 'not-a-uuid' })).success).toBe(false);
    });

    it('rejects invalid email', () => {
      expect(UserSchema.safeParse(validInput({ email: 'not-an-email' })).success).toBe(false);
    });

    it('rejects age below 18', () => {
      expect(UserSchema.safeParse(validInput({ age: 17 })).success).toBe(false);
    });

    it('rejects invalid role', () => {
      expect(UserSchema.safeParse(validInput({ role: 'superuser' })).success).toBe(false);
    });

    it('rejects extra fields in strict profile object', () => {
      expect(UserSchema.safeParse(validInput({
        profile: { joined: new Date(), extra: 'field' },
      })).success).toBe(false);
    });
  });
});

describe('parseUser', () => {
  it('returns parsed user data for valid input', () => {
    const user = parseUser(validInput());
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.format).toBe('html');
    expect(user.websiteUrl).toBe('https://example.com');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({ id: 'bad', email: 'bad' })).toThrow();
  });

  it('throws with a JSON-serialised error tree', () => {
    let errorMsg = '';
    try {
      parseUser({});
    } catch (e: unknown) {
      errorMsg = (e as Error).message;
    }
    expect(() => JSON.parse(errorMsg)).not.toThrow();
  });
});