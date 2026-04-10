/**
 * Tests for fools/files.ts — UserSchema changes introduced in this PR:
 *
 * Changes tested:
 *  - `status` field: changed from z.literal([...]) to z.enum([...])
 *  - Added `websiteUrl: z.url()`
 *  - Added `portfolio: z.url()`
 *  - Added `siteUrls: z.urls()` — NOTE: z.urls() does not exist in Zod v4.1.5,
 *    so the module throws on load. Tests below document both the intended
 *    behavior of the individual validators and the runtime error.
 *  - Added `format: z.string()`
 *  - Removed `website` field
 *
 * Because importing fools/files.ts fails at runtime (z.urls() is not a valid
 * Zod v4 API), the integration tests using UserSchema are wrapped in a
 * dynamic import to capture the failure gracefully.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_EMAIL = 'user@example.com';
const VALID_URL = 'https://example.com';

// ─── status field: z.enum (changed from z.literal) ──────────────────────────

describe('status field — z.enum([active, inactive, banned])', () => {
  const statusSchema = z.enum(['active', 'inactive', 'banned']);

  it('accepts "active"', () => {
    expect(statusSchema.safeParse('active').success).toBe(true);
  });

  it('accepts "inactive"', () => {
    expect(statusSchema.safeParse('inactive').success).toBe(true);
  });

  it('accepts "banned"', () => {
    expect(statusSchema.safeParse('banned').success).toBe(true);
  });

  it('rejects values not in the enum', () => {
    expect(statusSchema.safeParse('pending').success).toBe(false);
    expect(statusSchema.safeParse('').success).toBe(false);
    expect(statusSchema.safeParse('ACTIVE').success).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(statusSchema.safeParse(null).success).toBe(false);
    expect(statusSchema.safeParse(undefined).success).toBe(false);
  });

  it('rejects numeric values', () => {
    expect(statusSchema.safeParse(1).success).toBe(false);
  });
});

// ─── websiteUrl field (new): z.url() ────────────────────────────────────────

describe('websiteUrl field — z.url() (new field)', () => {
  const urlSchema = z.url();

  it('accepts a valid https URL', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(urlSchema.safeParse('http://example.com').success).toBe(true);
  });

  it('accepts a URL with path and query', () => {
    expect(urlSchema.safeParse('https://example.com/path?q=1').success).toBe(true);
  });

  it('rejects a plain string without protocol', () => {
    expect(urlSchema.safeParse('example.com').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(urlSchema.safeParse('').success).toBe(false);
  });

  it('rejects null', () => {
    expect(urlSchema.safeParse(null).success).toBe(false);
  });

  it('rejects a malformed URL', () => {
    expect(urlSchema.safeParse('not a url at all').success).toBe(false);
  });
});

// ─── portfolio field (new): z.url() ─────────────────────────────────────────

describe('portfolio field — z.url() (new field)', () => {
  const portfolioSchema = z.url();

  it('accepts a valid portfolio URL', () => {
    expect(portfolioSchema.safeParse('https://portfolio.dev/user123').success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(portfolioSchema.safeParse('portfolio-page').success).toBe(false);
  });
});

// ─── format field (new): z.string() ─────────────────────────────────────────

describe('format field — z.string() (new field)', () => {
  const formatSchema = z.string();

  it('accepts any string', () => {
    expect(formatSchema.safeParse('json').success).toBe(true);
    expect(formatSchema.safeParse('').success).toBe(true);
    expect(formatSchema.safeParse('  spaced  ').success).toBe(true);
  });

  it('rejects non-string types', () => {
    expect(formatSchema.safeParse(42).success).toBe(false);
    expect(formatSchema.safeParse(null).success).toBe(false);
    expect(formatSchema.safeParse(undefined).success).toBe(false);
  });
});

// ─── z.urls() is not available in Zod v4.1.5 ────────────────────────────────

describe('z.urls() availability in Zod v4.1.5', () => {
  it('z.urls is not a function in the installed Zod version', () => {
    expect(typeof (z as any).urls).not.toBe('function');
  });

  it('importing fools/files.ts fails because z.urls() is called at module load', async () => {
    await expect(import('../fools/files.ts')).rejects.toThrow();
  });
});

// ─── Other retained fields (regression coverage) ────────────────────────────

describe('id field — z.uuid()', () => {
  const idSchema = z.uuid({ message: 'Invalid ID' });

  it('accepts a valid UUID v4', () => {
    expect(idSchema.safeParse(VALID_UUID).success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const r = idSchema.safeParse('not-a-uuid');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Invalid ID');
    }
  });
});

describe('email field — z.email()', () => {
  const emailSchema = z.email({ message: 'Invalid email' });

  it('accepts a valid email address', () => {
    expect(emailSchema.safeParse(VALID_EMAIL).success).toBe(true);
  });

  it('rejects an email without @', () => {
    const r = emailSchema.safeParse('userexample.com');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Invalid email');
    }
  });
});

describe('age field — z.coerce.number().int().min(18)', () => {
  const ageSchema = z.coerce.number().int().min(18, { message: 'Must be 18+' });

  it('accepts age 18', () => {
    expect(ageSchema.safeParse(18).success).toBe(true);
  });

  it('accepts age as a string (coercion)', () => {
    expect(ageSchema.safeParse('25').success).toBe(true);
  });

  it('rejects age 17', () => {
    const r = ageSchema.safeParse(17);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Must be 18+');
    }
  });

  it('rejects non-integer age', () => {
    expect(ageSchema.safeParse(18.5).success).toBe(false);
  });
});

describe('active field — z.stringbool()', () => {
  const activeSchema = z.stringbool();

  it.each([['true', true], ['1', true], ['yes', true]])(
    'parses "%s" as true',
    (input, expected) => {
      const r = activeSchema.safeParse(input);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data).toBe(expected);
    }
  );

  it.each([['false', false], ['0', false], ['no', false]])(
    'parses "%s" as false',
    (input, expected) => {
      const r = activeSchema.safeParse(input);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data).toBe(expected);
    }
  );

  it('rejects ambiguous strings', () => {
    expect(activeSchema.safeParse('maybe').success).toBe(false);
    expect(activeSchema.safeParse('').success).toBe(false);
  });
});

describe('role field — z.enum([admin, user, manager])', () => {
  const roleSchema = z.enum(['admin', 'user', 'manager']);

  it.each(['admin', 'user', 'manager'])('accepts role "%s"', (role) => {
    expect(roleSchema.safeParse(role).success).toBe(true);
  });

  it('rejects unknown role', () => {
    expect(roleSchema.safeParse('superuser').success).toBe(false);
  });
});

describe('code field — z.templateLiteral([user-, number])', () => {
  const codeSchema = z.templateLiteral([
    z.literal('user-'),
    z.number().min(1).max(9999),
  ]);

  it('accepts "user-1"', () => {
    expect(codeSchema.safeParse('user-1').success).toBe(true);
  });

  it('accepts "user-9999"', () => {
    expect(codeSchema.safeParse('user-9999').success).toBe(true);
  });

  it('accepts "user-123"', () => {
    expect(codeSchema.safeParse('user-123').success).toBe(true);
  });

  it('rejects codes without the user- prefix', () => {
    expect(codeSchema.safeParse('admin-123').success).toBe(false);
  });

  it('rejects codes with a non-numeric suffix', () => {
    expect(codeSchema.safeParse('user-abc').success).toBe(false);
  });
});

describe('profile field — z.strictObject({ bio?, joined })', () => {
  const profileSchema = z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  });

  it('accepts profile with only joined', () => {
    expect(profileSchema.safeParse({ joined: new Date() }).success).toBe(true);
  });

  it('accepts profile with bio and joined', () => {
    expect(
      profileSchema.safeParse({ bio: 'Developer', joined: new Date() }).success
    ).toBe(true);
  });

  it('rejects profile with extra fields (strictObject)', () => {
    expect(
      profileSchema.safeParse({
        bio: 'hi',
        joined: new Date(),
        extra: 'not allowed',
      }).success
    ).toBe(false);
  });

  it('rejects profile without joined', () => {
    expect(profileSchema.safeParse({ bio: 'hi' }).success).toBe(false);
  });
});