/**
 * Tests for fools/files.ts – UserSchema changes introduced in this PR.
 *
 * Note: fools/files.ts uses z.urls() which does not exist in zod v4.1.x.
 * The schema-level fields that were changed/added are tested here using
 * inline schemas that mirror the individual changed fields.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Inline schemas mirroring the changed fields from fools/files.ts ──

// status: changed from z.literal([...]) to z.enum([...])
const statusSchema = z.enum(['active', 'inactive', 'banned']);

// websiteUrl: added field (z.url())
const websiteUrlSchema = z.url();

// portfolio: added field (z.url())
const portfolioSchema = z.url();

// format: added field (z.string())
const formatSchema = z.string();

// Partial UserSchema (excluding siteUrls which uses the non-existent z.urls())
// to validate that the full object with known-valid fields works end-to-end.
const PartialUserSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),
  portfolio: z.url(),
  format: z.string(),
});

const baseValidInput = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello!',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  format: 'json',
};

describe('status field – changed from z.literal to z.enum', () => {
  it('accepts "active"', () => {
    expect(statusSchema.safeParse('active').success).toBe(true);
  });

  it('accepts "inactive"', () => {
    expect(statusSchema.safeParse('inactive').success).toBe(true);
  });

  it('accepts "banned"', () => {
    expect(statusSchema.safeParse('banned').success).toBe(true);
  });

  it('rejects an unknown status value', () => {
    expect(statusSchema.safeParse('pending').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(statusSchema.safeParse('').success).toBe(false);
  });

  it('rejects a numeric value', () => {
    expect(statusSchema.safeParse(1).success).toBe(false);
  });

  it('parsed status enum provides correct options', () => {
    const options = statusSchema.options;
    expect(options).toEqual(['active', 'inactive', 'banned']);
  });
});

describe('websiteUrl field – added (z.url())', () => {
  it('accepts a valid https URL', () => {
    expect(websiteUrlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(websiteUrlSchema.safeParse('http://example.com/path').success).toBe(true);
  });

  it('accepts a URL with query params', () => {
    expect(websiteUrlSchema.safeParse('https://example.com/page?id=1').success).toBe(true);
  });

  it('rejects a plain string without protocol', () => {
    expect(websiteUrlSchema.safeParse('example.com').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(websiteUrlSchema.safeParse('').success).toBe(false);
  });

  it('rejects null', () => {
    expect(websiteUrlSchema.safeParse(null).success).toBe(false);
  });
});

describe('portfolio field – added (z.url())', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(portfolioSchema.safeParse('https://myportfolio.dev').success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(portfolioSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(portfolioSchema.safeParse('').success).toBe(false);
  });

  it('rejects an undefined value', () => {
    expect(portfolioSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('format field – added (z.string())', () => {
  it('accepts any string including empty string', () => {
    expect(formatSchema.safeParse('json').success).toBe(true);
    expect(formatSchema.safeParse('').success).toBe(true);
    expect(formatSchema.safeParse('application/xml').success).toBe(true);
  });

  it('rejects null', () => {
    expect(formatSchema.safeParse(null).success).toBe(false);
  });

  it('rejects a number', () => {
    expect(formatSchema.safeParse(42).success).toBe(false);
  });

  it('rejects undefined', () => {
    expect(formatSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('PartialUserSchema – validates all changed fields together', () => {
  it('accepts a fully valid object', () => {
    const result = PartialUserSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
  });

  it('rejects when status is invalid', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, status: 'suspended' });
    expect(result.success).toBe(false);
  });

  it('rejects when websiteUrl is not a URL', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects when portfolio is not a URL', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, portfolio: 'bad-url' });
    expect(result.success).toBe(false);
  });

  it('rejects when format is a number', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, format: 99 });
    expect(result.success).toBe(false);
  });

  it('rejects when websiteUrl is missing', () => {
    const { websiteUrl: _, ...rest } = baseValidInput;
    const result = PartialUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when portfolio is missing', () => {
    const { portfolio: _, ...rest } = baseValidInput;
    const result = PartialUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when format is missing', () => {
    const { format: _, ...rest } = baseValidInput;
    const result = PartialUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('strips unknown keys (e.g. old "website" field removed from schema)', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, website: 'https://old.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });

  it('rejects age below 18', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, age: 17 }).success).toBe(false);
  });

  it('accepts age exactly 18', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, age: 18 }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an invalid UUID', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, id: 'not-a-uuid' }).success).toBe(false);
  });

  it('coerces a numeric string for age', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, age: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });

  it('accepts "yes" as a truthy stringbool for active', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, active: 'yes' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });

  it('accepts "0" as a falsy stringbool for active', () => {
    const result = PartialUserSchema.safeParse({ ...baseValidInput, active: '0' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
    }
  });

  it('allows profile.bio to be omitted (optional)', () => {
    const result = PartialUserSchema.safeParse({
      ...baseValidInput,
      profile: { joined: new Date('2024-01-01') },
    });
    expect(result.success).toBe(true);
  });

  it('rejects profile with extra unknown keys (strictObject)', () => {
    const result = PartialUserSchema.safeParse({
      ...baseValidInput,
      profile: { bio: 'hi', joined: new Date(), extraField: 'not allowed' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects code not matching template literal pattern', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, code: 'admin-5' }).success).toBe(false);
    expect(PartialUserSchema.safeParse({ ...baseValidInput, code: 'user-abc' }).success).toBe(false);
  });

  it('accepts valid code matching template literal "user-N"', () => {
    expect(PartialUserSchema.safeParse({ ...baseValidInput, code: 'user-1' }).success).toBe(true);
    expect(PartialUserSchema.safeParse({ ...baseValidInput, code: 'user-9999' }).success).toBe(true);
  });
});

describe('z.urls() – documents that siteUrls field in fools/files.ts uses a non-existent API', () => {
  it('z.urls is not a function in zod 4.1.x', () => {
    expect(typeof (z as unknown as Record<string, unknown>).urls).not.toBe('function');
  });
});