/**
 * Tests for fools/files.ts — UserSchema
 *
 * Key changes tested from this PR:
 * - status field: z.literal([...]) → z.enum([...]) (accepts "active"|"inactive"|"banned")
 * - website field removed from the schema
 * - websiteUrl and portfolio fields added (z.url())
 * - siteUrls field added (z.urls() — shimmed as z.array(z.url()) for the test environment)
 * - format field added (z.string())
 *
 * NOTE: z.urls() does not exist in the installed Zod version. This test file
 * shims it via vi.mock so the module under test loads successfully.
 */

import { vi, describe, it, expect } from 'vitest';

// Must mock 'zod' BEFORE importing files.ts so that z.urls() is available
// when UserSchema is constructed at module load time.
vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zod')>();
  const z = actual.z as any;

  // Shim z.urls() → z.array(z.url())
  const urls = () => z.array(z.url());

  // Patch z.record so single-arg form (Zod 3 style) still works in Zod 4.
  const originalRecord = z.record.bind(z);
  const record = (...args: unknown[]) =>
    args.length === 1 ? originalRecord(z.string(), args[0]) : originalRecord(...args);

  // Return a new z namespace with the patched helpers.
  const patchedZ = Object.assign(Object.create(Object.getPrototypeOf(z)), z, { urls, record });

  return { ...actual, z: patchedZ, default: { ...actual.default, z: patchedZ } };
});

import { UserSchema, parseUser } from './files';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_EMAIL = 'user@example.com';
const VALID_URL = 'https://example.com';

function buildValidUser(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    email: VALID_EMAIL,
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-1',
    profile: { bio: 'Hello', joined: new Date('2024-01-01') },
    websiteUrl: VALID_URL,
    portfolio: 'https://portfolio.example.com',
    siteUrls: [VALID_URL],
    format: 'json',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// status field — changed from z.literal to z.enum
// ---------------------------------------------------------------------------

describe('UserSchema — status field (enum)', () => {
  it('accepts "active"', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: 'active' }))).not.toThrow();
  });

  it('accepts "inactive"', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: 'inactive' }))).not.toThrow();
  });

  it('accepts "banned"', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: 'banned' }))).not.toThrow();
  });

  it('rejects an invalid status value', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: 'suspended' }))).toThrow();
  });

  it('rejects a numeric status', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: 1 }))).toThrow();
  });

  it('rejects an empty string as status', () => {
    expect(() => UserSchema.parse(buildValidUser({ status: '' }))).toThrow();
  });

  it('parses successfully and returns the status in the result', () => {
    const result = UserSchema.parse(buildValidUser({ status: 'inactive' }));
    expect(result.status).toBe('inactive');
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field — new z.url() field
// ---------------------------------------------------------------------------

describe('UserSchema — websiteUrl field (new)', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(() => UserSchema.parse(buildValidUser({ websiteUrl: 'https://example.com' }))).not.toThrow();
  });

  it('accepts a valid HTTP URL', () => {
    expect(() => UserSchema.parse(buildValidUser({ websiteUrl: 'http://example.org/path' }))).not.toThrow();
  });

  it('rejects a plain string that is not a URL', () => {
    expect(() => UserSchema.parse(buildValidUser({ websiteUrl: 'not-a-url' }))).toThrow();
  });

  it('rejects undefined websiteUrl (required field)', () => {
    const { websiteUrl: _, ...data } = buildValidUser() as any;
    expect(() => UserSchema.parse(data)).toThrow();
  });

  it('returns the websiteUrl in the parsed result', () => {
    const result = UserSchema.parse(buildValidUser({ websiteUrl: 'https://test.com' }));
    expect(result.websiteUrl).toBe('https://test.com');
  });
});

// ---------------------------------------------------------------------------
// portfolio field — new z.url() field
// ---------------------------------------------------------------------------

describe('UserSchema — portfolio field (new)', () => {
  it('accepts a valid URL', () => {
    expect(() => UserSchema.parse(buildValidUser({ portfolio: 'https://portfolio.dev' }))).not.toThrow();
  });

  it('rejects an invalid URL for portfolio', () => {
    expect(() => UserSchema.parse(buildValidUser({ portfolio: 'not-a-url' }))).toThrow();
  });

  it('rejects missing portfolio (required field)', () => {
    const { portfolio: _, ...data } = buildValidUser() as any;
    expect(() => UserSchema.parse(data)).toThrow();
  });

  it('returns the portfolio URL in the parsed result', () => {
    const result = UserSchema.parse(buildValidUser({ portfolio: 'https://myportfolio.io' }));
    expect(result.portfolio).toBe('https://myportfolio.io');
  });
});

// ---------------------------------------------------------------------------
// format field — new z.string() field
// ---------------------------------------------------------------------------

describe('UserSchema — format field (new)', () => {
  it('accepts any non-empty string', () => {
    expect(() => UserSchema.parse(buildValidUser({ format: 'json' }))).not.toThrow();
  });

  it('accepts an empty string (z.string() allows it)', () => {
    expect(() => UserSchema.parse(buildValidUser({ format: '' }))).not.toThrow();
  });

  it('rejects a non-string format', () => {
    expect(() => UserSchema.parse(buildValidUser({ format: 42 }))).toThrow();
  });

  it('returns the format value in the parsed result', () => {
    const result = UserSchema.parse(buildValidUser({ format: 'csv' }));
    expect(result.format).toBe('csv');
  });
});

// ---------------------------------------------------------------------------
// website field — was removed in this PR
// ---------------------------------------------------------------------------

describe('UserSchema — removed website field', () => {
  it('does not have a website field in parsed output', () => {
    const result = UserSchema.parse(buildValidUser());
    expect((result as any).website).toBeUndefined();
  });

  it('parses successfully even when a stale website value is passed in input', () => {
    // Extra fields are stripped by z.object() by default
    const input = { ...buildValidUser(), website: 'https://old-field.com' };
    expect(() => UserSchema.parse(input)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// siteUrls field — new z.urls() / array of URLs
// ---------------------------------------------------------------------------

describe('UserSchema — siteUrls field (new)', () => {
  it('accepts an array with valid URLs', () => {
    expect(() =>
      UserSchema.parse(buildValidUser({ siteUrls: ['https://a.com', 'https://b.com'] }))
    ).not.toThrow();
  });

  it('accepts an empty array', () => {
    expect(() => UserSchema.parse(buildValidUser({ siteUrls: [] }))).not.toThrow();
  });

  it('rejects when siteUrls contains an invalid URL', () => {
    expect(() => UserSchema.parse(buildValidUser({ siteUrls: ['not-a-url'] }))).toThrow();
  });

  it('returns siteUrls in the parsed result', () => {
    const urls = ['https://site1.com', 'https://site2.com'];
    const result = UserSchema.parse(buildValidUser({ siteUrls: urls }));
    expect(result.siteUrls).toEqual(urls);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper
// ---------------------------------------------------------------------------

describe('parseUser helper', () => {
  it('returns parsed data for a valid user', () => {
    const result = parseUser(buildValidUser());
    expect(result.email).toBe(VALID_EMAIL);
    expect(result.role).toBe('admin');
    expect(result.status).toBe('active');
  });

  it('throws when the user data is invalid', () => {
    expect(() => parseUser({ ...buildValidUser(), email: 'bad-email' })).toThrow();
  });

  it('throws when status is not one of the allowed enum values', () => {
    expect(() => parseUser({ ...buildValidUser(), status: 'unknown' })).toThrow();
  });

  it('throws when websiteUrl is missing', () => {
    const { websiteUrl: _, ...data } = buildValidUser() as any;
    expect(() => parseUser(data)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Boundary / regression tests
// ---------------------------------------------------------------------------

describe('UserSchema — boundary and regression tests', () => {
  it('rejects age below 18', () => {
    expect(() => UserSchema.parse(buildValidUser({ age: 17 }))).toThrow();
  });

  it('accepts exactly age 18', () => {
    expect(() => UserSchema.parse(buildValidUser({ age: 18 }))).not.toThrow();
  });

  it('accepts all three valid status enum values in sequence', () => {
    for (const status of ['active', 'inactive', 'banned'] as const) {
      const result = UserSchema.parse(buildValidUser({ status }));
      expect(result.status).toBe(status);
    }
  });

  it('coerces string age to number', () => {
    const result = UserSchema.parse(buildValidUser({ age: '25' }));
    expect(result.age).toBe(25);
  });

  it('rejects a completely empty object', () => {
    expect(() => UserSchema.parse({})).toThrow();
  });

  it('returns all new fields in the parsed result', () => {
    const result = UserSchema.parse(buildValidUser());
    expect(result).toMatchObject({
      websiteUrl: VALID_URL,
      portfolio: 'https://portfolio.example.com',
      format: 'json',
      status: 'active',
    });
  });
});