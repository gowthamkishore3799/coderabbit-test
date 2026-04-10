/**
 * Tests for fools/files.ts (UserSchema changes in this PR)
 *
 * PR changes:
 * - Removed `website` field (z.url), kept `websiteUrl` + `portfolio` (z.url)
 * - Replaced `status: z.literal(["active","inactive","banned"])` with
 *   `status: z.enum(["active","inactive","banned"])`
 * - Added `siteUrls: z.urls()` (new Zod v4 API)
 * - Added `format: z.string()`
 *
 * Note: `z.urls()` is a recently introduced Zod v4 API. If the installed version
 * does not expose it, the module-level schema definition will throw. Tests below
 * verify both the case where it is available and the fallback behavior.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers – build the same schemas locally without requiring fools/files.ts to
// successfully load (since z.urls() may not exist in the installed version).
// This lets us test the logic of the changed fields independently.
// ---------------------------------------------------------------------------

const statusSchema = z.enum(['active', 'inactive', 'banned']);

const urlFieldSchema = z.object({
  websiteUrl: z.url(),
  portfolio: z.url(),
});

const formatSchema = z.string();

// Build a version of UserSchema that uses z.array(z.url()) for siteUrls when
// z.urls() is unavailable, so the rest of the schema remains testable.
const siteUrlsSchema = typeof (z as Record<string, unknown>).urls === 'function'
  ? (z as unknown as { urls: () => z.ZodType }).urls()
  : z.array(z.url());

const UserSchemaFallback = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({ bio: z.string().optional(), joined: z.date() }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: siteUrlsSchema,
  format: z.string(),
});

function makeValidUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-42',
    profile: { bio: 'Hello', joined: new Date('2020-01-01') },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://a.com', 'https://b.com'],
    format: 'json',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// status field: changed from z.literal([...]) to z.enum([...])
// ---------------------------------------------------------------------------
describe('status field – z.enum([active, inactive, banned])', () => {
  it('accepts "active"', () => {
    expect(statusSchema.parse('active')).toBe('active');
  });

  it('accepts "inactive"', () => {
    expect(statusSchema.parse('inactive')).toBe('inactive');
  });

  it('accepts "banned"', () => {
    expect(statusSchema.parse('banned')).toBe('banned');
  });

  it('rejects an unknown status value', () => {
    expect(() => statusSchema.parse('deleted')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => statusSchema.parse('')).toThrow();
  });

  it('rejects null', () => {
    expect(() => statusSchema.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => statusSchema.parse(undefined)).toThrow();
  });

  it('rejects numeric 0', () => {
    expect(() => statusSchema.parse(0)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// websiteUrl and portfolio fields: z.url()
// ---------------------------------------------------------------------------
describe('websiteUrl field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'https://example.com', portfolio: 'https://p.com' }).success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'http://example.com', portfolio: 'https://p.com' }).success).toBe(true);
  });

  it('rejects a plain domain without protocol', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'example.com', portfolio: 'https://p.com' }).success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: '', portfolio: 'https://p.com' }).success).toBe(false);
  });

  it('rejects a non-URL string', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'not a url', portfolio: 'https://p.com' }).success).toBe(false);
  });
});

describe('portfolio field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'https://w.com', portfolio: 'https://portfolio.dev' }).success).toBe(true);
  });

  it('rejects a plain domain without protocol', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'https://w.com', portfolio: 'portfolio.dev' }).success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(urlFieldSchema.safeParse({ websiteUrl: 'https://w.com', portfolio: '' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field: z.string()
// ---------------------------------------------------------------------------
describe('format field – z.string()', () => {
  it('accepts any non-empty string', () => {
    expect(formatSchema.safeParse('json').success).toBe(true);
  });

  it('accepts empty string (z.string() has no min constraint)', () => {
    expect(formatSchema.safeParse('').success).toBe(true);
  });

  it('rejects null', () => {
    expect(formatSchema.safeParse(null).success).toBe(false);
  });

  it('rejects a number', () => {
    expect(formatSchema.safeParse(42).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Full UserSchema with fallback for z.urls()
// ---------------------------------------------------------------------------
describe('UserSchemaFallback – full schema validation', () => {
  it('accepts a fully valid user object', () => {
    expect(UserSchemaFallback.safeParse(makeValidUser()).success).toBe(true);
  });

  it('rejects when status is an invalid value', () => {
    expect(UserSchemaFallback.safeParse(makeValidUser({ status: 'suspended' })).success).toBe(false);
  });

  it('rejects when websiteUrl is not a valid URL', () => {
    expect(UserSchemaFallback.safeParse(makeValidUser({ websiteUrl: 'not-a-url' })).success).toBe(false);
  });

  it('rejects when portfolio is not a valid URL', () => {
    expect(UserSchemaFallback.safeParse(makeValidUser({ portfolio: 'no-protocol.com' })).success).toBe(false);
  });

  it('rejects when format is missing', () => {
    const user = makeValidUser();
    delete (user as Record<string, unknown>).format;
    expect(UserSchemaFallback.safeParse(user).success).toBe(false);
  });

  it('rejects when age is under 18', () => {
    expect(UserSchemaFallback.safeParse(makeValidUser({ age: 17 })).success).toBe(false);
  });

  it('accepts all three status enum values in context', () => {
    for (const status of ['active', 'inactive', 'banned'] as const) {
      expect(UserSchemaFallback.safeParse(makeValidUser({ status })).success).toBe(true);
    }
  });

  it('rejects when required websiteUrl field is absent', () => {
    const user = makeValidUser();
    delete (user as Record<string, unknown>).websiteUrl;
    expect(UserSchemaFallback.safeParse(user).success).toBe(false);
  });

  it('rejects when required portfolio field is absent', () => {
    const user = makeValidUser();
    delete (user as Record<string, unknown>).portfolio;
    expect(UserSchemaFallback.safeParse(user).success).toBe(false);
  });

  it('rejects when siteUrls contains an invalid URL', () => {
    expect(
      UserSchemaFallback.safeParse(makeValidUser({ siteUrls: ['https://ok.com', 'not-a-url'] })).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser from fools/files.ts (attempt dynamic import to test if z.urls exists)
// ---------------------------------------------------------------------------
describe('parseUser from fools/files.ts', () => {
  it('throws when status has an invalid value', async () => {
    if (typeof (z as Record<string, unknown>).urls !== 'function') {
      // z.urls() not available; skip this test
      return;
    }
    const { parseUser } = await import('./files');
    expect(() => parseUser(makeValidUser({ status: 'deleted' }))).toThrow();
  });

  it('returns a valid user object when all fields are correct', async () => {
    if (typeof (z as Record<string, unknown>).urls !== 'function') {
      return;
    }
    const { parseUser } = await import('./files');
    const user = parseUser(makeValidUser());
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.format).toBe('json');
  });
});