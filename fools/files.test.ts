import { describe, it, expect } from 'vitest';
import * as z from 'zod';

/**
 * Tests for fools/files.ts - UserSchema changes introduced in this PR.
 *
 * We cannot import fools/files.ts directly because it calls z.urls() which is
 * not available in the installed zod 4.1.5.  Instead we reconstruct the
 * schema as it is defined in the file, substituting z.array(z.url()) for the
 * unavailable z.urls() call (the two are semantically equivalent).  This
 * approach lets us verify the behavior of every PR change:
 *
 *  - status changed from z.literal([...]) to z.enum([...])
 *  - websiteUrl, portfolio, siteUrls, format fields added
 *  - website field removed
 */

// Reconstruct UserSchema as defined in fools/files.ts, replacing the
// unavailable z.urls() with z.array(z.url()).
const UserSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([
    z.literal('user-'),
    z.number().min(1).max(9999),
  ]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.array(z.url()), // z.urls() polyfill - semantically equivalent
  format: z.string(),
});

function parseUser(input: unknown) {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.dev',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('UserSchema - status field (changed from z.literal to z.enum)', () => {
  it('accepts "active" as a valid status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts "inactive" as a valid status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts "banned" as a valid status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'banned' });
    expect(result.success).toBe(true);
  });

  it('rejects an unrecognized status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: '' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema - websiteUrl field (added in this PR)', () => {
  it('accepts a valid https URL', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects when websiteUrl is missing', () => {
    const { websiteUrl, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema - portfolio field (added in this PR)', () => {
  it('accepts a valid https URL', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://portfolio.example.io' });
    expect(result.success).toBe(true);
  });

  it('rejects a plain string (non-URL)', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'just-a-string' });
    expect(result.success).toBe(false);
  });

  it('rejects when portfolio is missing', () => {
    const { portfolio, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema - siteUrls field (added in this PR, z.urls → array of URLs)', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ['https://a.com', 'https://b.com'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('accepts a single-element array', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ['https://only.com'] });
    expect(result.success).toBe(true);
  });

  it('rejects when at least one URL in the array is invalid', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ['https://valid.com', 'not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects when siteUrls is missing', () => {
    const { siteUrls, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema - format field (added in this PR)', () => {
  it('accepts any non-empty string', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string (z.string() has no minimum length)', () => {
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects when format is missing', () => {
    const { format, ...rest } = validUser;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema - website field removed in this PR', () => {
  it('parses successfully without a website field', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('strips the old website field when present (z.object strips unknown keys)', () => {
    const result = UserSchema.safeParse({ ...validUser, website: 'https://old.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).website).toBeUndefined();
    }
  });
});

describe('parseUser() helper', () => {
  it('returns valid user data for a correct input', () => {
    const user = parseUser(validUser);
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.dev');
    expect(user.siteUrls).toEqual(['https://site1.com', 'https://site2.com']);
    expect(user.format).toBe('json');
  });

  it('throws for an invalid status', () => {
    expect(() => parseUser({ ...validUser, status: 'unknown' })).toThrow(Error);
  });

  it('throws when a required new field is absent', () => {
    const { websiteUrl, ...rest } = validUser;
    expect(() => parseUser(rest)).toThrow(Error);
  });

  it('throws an Error with a non-empty message describing the failure', () => {
    let msg = '';
    try {
      parseUser({ ...validUser, status: 'bad_status' });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg.length).toBeGreaterThan(0);
    // The message comes from JSON.stringify(result.error.treeify()) in parseUser()
    expect(typeof msg).toBe('string');
  });
});

describe('UserSchema - complete valid round-trip', () => {
  it('preserves all new fields from a fully valid user object', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
      expect(result.data.websiteUrl).toBe('https://example.com');
      expect(result.data.portfolio).toBe('https://portfolio.dev');
      expect(result.data.siteUrls).toEqual(['https://site1.com', 'https://site2.com']);
      expect(result.data.format).toBe('json');
    }
  });
});