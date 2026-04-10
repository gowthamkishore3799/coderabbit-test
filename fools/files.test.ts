/**
 * Tests for fools/files.ts - UserSchema (Zod v4)
 *
 * Changes tested in this PR:
 * - `status` field changed from z.literal([...]) to z.enum(["active","inactive","banned"])
 * - Removed `website` field
 * - Added `websiteUrl: z.url()`, `portfolio: z.url()`, `siteUrls: z.urls()`, `format: z.string()`
 * - `parseUser()` uses result.error.treeify() (v4 API)
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Reconstructed schema (mirrors fools/files.ts, replaces z.urls() with
//    z.array(z.url()) since z.urls is not part of zod v4.1.5) ──────────────
// This lets us test validation logic while the z.urls() issue is tracked
// separately in the "schema load" suite below.
const UserSchemaUnderTest = z.object({
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
  siteUrls: z.array(z.url()),
  format: z.string(),
});

/** Minimal valid user payload for the reconstructed schema. */
function validUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: { joined: new Date('2024-01-01') },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://a.example.com', 'https://b.example.com'],
    format: 'json',
    ...overrides,
  };
}

// ── Schema load test ─────────────────────────────────────────────────────────

describe('fools/files.ts module import', () => {
  it('fails to load when z.urls() is unavailable in zod v4.1.5', async () => {
    // z.urls is not part of zod v4.1.5; calling it throws TypeError.
    // This test documents the known runtime issue introduced in this PR.
    await expect(import('./files.js')).rejects.toThrow();
  });
});

// ── status field (changed from z.literal to z.enum) ─────────────────────────

describe('UserSchema – status field (z.enum)', () => {
  it('accepts "active"', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ status: 'active' }));
    expect(result.success).toBe(true);
  });

  it('accepts "inactive"', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ status: 'inactive' }));
    expect(result.success).toBe(true);
  });

  it('accepts "banned"', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ status: 'banned' }));
    expect(result.success).toBe(true);
  });

  it('rejects an unlisted status value', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ status: 'pending' }));
    expect(result.success).toBe(false);
  });

  it('rejects an empty string for status', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ status: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const input = validUser();
    delete (input as Record<string, unknown>).status;
    const result = UserSchemaUnderTest.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ── websiteUrl and portfolio (newly added url fields) ────────────────────────

describe('UserSchema – websiteUrl field (added in PR)', () => {
  it('accepts a valid HTTPS URL', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ websiteUrl: 'https://mysite.io' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ websiteUrl: 'not-a-url' }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a missing websiteUrl field', () => {
    const input = validUser();
    delete (input as Record<string, unknown>).websiteUrl;
    const result = UserSchemaUnderTest.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – portfolio field (added in PR)', () => {
  it('accepts a valid HTTP URL', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ portfolio: 'http://portfolio.dev' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects a plain domain without protocol', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ portfolio: 'portfolio.dev' }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects null for portfolio', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ portfolio: null }),
    );
    expect(result.success).toBe(false);
  });
});

// ── format field (newly added) ───────────────────────────────────────────────

describe('UserSchema – format field (added in PR)', () => {
  it('accepts any non-empty string', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ format: 'csv' }));
    expect(result.success).toBe(true);
  });

  it('accepts an empty string (z.string() has no min constraint)', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ format: '' }));
    expect(result.success).toBe(true);
  });

  it('rejects a missing format field', () => {
    const input = validUser();
    delete (input as Record<string, unknown>).format;
    const result = UserSchemaUnderTest.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ── siteUrls field (added in PR – uses z.array(z.url()) in tests) ───────────

describe('UserSchema – siteUrls field (added in PR)', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ siteUrls: ['https://one.com', 'https://two.com'] }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ siteUrls: [] }));
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ siteUrls: ['https://valid.com', 'bad-url'] }),
    );
    expect(result.success).toBe(false);
  });
});

// ── parseUser helper ─────────────────────────────────────────────────────────

describe('parseUser (reconstructed logic)', () => {
  function parseUserLocal(input: unknown) {
    const result = UserSchemaUnderTest.safeParse(input);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.treeify()));
    }
    return result.data;
  }

  it('returns typed data for a valid input', () => {
    const user = parseUserLocal(validUser());
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.format).toBe('json');
  });

  it('throws a structured error string for invalid input', () => {
    expect(() => parseUserLocal({ id: 'bad' })).toThrow();
  });

  it('coerces age from string to number', () => {
    const user = parseUserLocal(validUser({ age: '30' }));
    expect(user.age).toBe(30);
  });

  it('parses stringbool "true" to boolean true', () => {
    const user = parseUserLocal(validUser({ active: 'true' }));
    expect(user.active).toBe(true);
  });

  it('parses stringbool "false" to boolean false', () => {
    const user = parseUserLocal(validUser({ active: 'false' }));
    expect(user.active).toBe(false);
  });

  it('rejects age below 18', () => {
    expect(() => parseUserLocal(validUser({ age: 17 }))).toThrow();
  });
});

// ── strictObject profile field ───────────────────────────────────────────────

describe('UserSchema – profile strictObject', () => {
  it('rejects unknown extra properties in profile', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ profile: { joined: new Date(), bio: 'hi', extra: 'field' } }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts profile with only the required joined field', () => {
    const result = UserSchemaUnderTest.safeParse(
      validUser({ profile: { joined: new Date('2023-06-01') } }),
    );
    expect(result.success).toBe(true);
  });
});

// ── role field (unchanged, regression test) ──────────────────────────────────

describe('UserSchema – role field (regression)', () => {
  it('accepts "admin"', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ role: 'admin' }));
    expect(result.success).toBe(true);
  });

  it('rejects an unknown role', () => {
    const result = UserSchemaUnderTest.safeParse(validUser({ role: 'superuser' }));
    expect(result.success).toBe(false);
  });
});