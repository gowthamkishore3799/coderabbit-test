import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Tests for the UserSchema changes in fools/files.ts:
 *
 * - `status` changed from z.literal([...]) to z.enum(["active","inactive","banned"])
 * - Removed `website` field
 * - Added `websiteUrl` and `portfolio` (z.url())
 * - Added `siteUrls` (z.urls() — not a standard zod v4 API; documented below)
 * - Added `format` (z.string())
 *
 * NOTE: z.urls() is not a function in zod v4.1.5. The schema in fools/files.ts
 * throws at module-load time due to this. These tests reconstruct equivalent
 * sub-schemas for the changed fields to verify the intended behaviour, and
 * include a test documenting the z.urls() issue.
 */

// ──────────────────────────────────────────────────────────────────
// Sub-schemas mirroring the changed fields in fools/files.ts
// ──────────────────────────────────────────────────────────────────
const StatusEnum = z.enum(['active', 'inactive', 'banned']);
const UrlField = z.url();
const FormatField = z.string();

// Composite schema for all changed fields (siteUrls stand-in: z.string())
const ChangedFieldsSchema = z.object({
  status: StatusEnum,
  websiteUrl: UrlField,
  portfolio: z.url(),
  siteUrls: z.string(), // intended as z.urls() but that API does not exist
  format: FormatField,
});

const validChangedInput = {
  status: 'active' as const,
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: 'https://site1.com https://site2.com',
  format: 'html',
};

// ──────────────────────────────────────────────────────────────────
// z.urls() – documents the non-standard API used in files.ts
// ──────────────────────────────────────────────────────────────────
describe('z.urls() API availability', () => {
  it('z.urls is not a function in zod v4.1.5', () => {
    // The PR added siteUrls: z.urls() which is not a valid zod API,
    // causing fools/files.ts to throw on import.
    expect(typeof (z as Record<string, unknown>)['urls']).toBe('undefined');
  });
});

// ──────────────────────────────────────────────────────────────────
// status – changed from z.literal([...]) to z.enum([...])
// ──────────────────────────────────────────────────────────────────
describe('status field – z.enum(["active","inactive","banned"])', () => {
  it('accepts "active"', () => {
    expect(StatusEnum.safeParse('active').success).toBe(true);
  });

  it('accepts "inactive"', () => {
    expect(StatusEnum.safeParse('inactive').success).toBe(true);
  });

  it('accepts "banned"', () => {
    expect(StatusEnum.safeParse('banned').success).toBe(true);
  });

  it('rejects "pending" (not in enum)', () => {
    expect(StatusEnum.safeParse('pending').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(StatusEnum.safeParse('').success).toBe(false);
  });

  it('rejects a number', () => {
    expect(StatusEnum.safeParse(1).success).toBe(false);
  });

  it('rejects null', () => {
    expect(StatusEnum.safeParse(null).success).toBe(false);
  });

  it('rejects undefined', () => {
    expect(StatusEnum.safeParse(undefined).success).toBe(false);
  });

  it('has exactly the three declared options', () => {
    expect(StatusEnum.options).toEqual(['active', 'inactive', 'banned']);
  });
});

// ──────────────────────────────────────────────────────────────────
// websiteUrl – newly added (z.url())
// ──────────────────────────────────────────────────────────────────
describe('websiteUrl field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(UrlField.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(UrlField.safeParse('http://example.com').success).toBe(true);
  });

  it('accepts a URL with path and query string', () => {
    expect(UrlField.safeParse('https://example.com/path?q=1&r=2').success).toBe(true);
  });

  it('rejects a plain hostname without protocol', () => {
    expect(UrlField.safeParse('example.com').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(UrlField.safeParse('').success).toBe(false);
  });

  it('rejects null', () => {
    expect(UrlField.safeParse(null).success).toBe(false);
  });

  it('rejects undefined', () => {
    expect(UrlField.safeParse(undefined).success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────
// portfolio – newly added (z.url())
// ──────────────────────────────────────────────────────────────────
describe('portfolio field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(z.url().safeParse('https://myportfolio.io').success).toBe(true);
  });

  it('accepts a URL with subdomain', () => {
    expect(z.url().safeParse('https://user.github.io/repo').success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(z.url().safeParse('not-a-url').success).toBe(false);
  });

  it('rejects null', () => {
    expect(z.url().safeParse(null).success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────
// format – newly added (z.string())
// ──────────────────────────────────────────────────────────────────
describe('format field – z.string()', () => {
  it('accepts "json"', () => {
    expect(FormatField.safeParse('json').success).toBe(true);
  });

  it('accepts "html"', () => {
    expect(FormatField.safeParse('html').success).toBe(true);
  });

  it('accepts an empty string (no min constraint)', () => {
    expect(FormatField.safeParse('').success).toBe(true);
  });

  it('rejects a number', () => {
    expect(FormatField.safeParse(42).success).toBe(false);
  });

  it('rejects null', () => {
    expect(FormatField.safeParse(null).success).toBe(false);
  });

  it('rejects an object', () => {
    expect(FormatField.safeParse({}).success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────
// Combined changed-fields schema
// ──────────────────────────────────────────────────────────────────
describe('ChangedFieldsSchema – all changed fields combined', () => {
  it('parses a valid object with all changed fields', () => {
    expect(ChangedFieldsSchema.safeParse(validChangedInput).success).toBe(true);
  });

  it('all three status values pass with otherwise-valid data', () => {
    for (const status of ['active', 'inactive', 'banned'] as const) {
      expect(ChangedFieldsSchema.safeParse({ ...validChangedInput, status }).success).toBe(true);
    }
  });

  it('rejects when status is an invalid enum value', () => {
    expect(ChangedFieldsSchema.safeParse({ ...validChangedInput, status: 'unknown' }).success).toBe(false);
  });

  it('rejects when websiteUrl is not a URL', () => {
    expect(ChangedFieldsSchema.safeParse({ ...validChangedInput, websiteUrl: 'bad' }).success).toBe(false);
  });

  it('rejects when portfolio is not a URL', () => {
    expect(ChangedFieldsSchema.safeParse({ ...validChangedInput, portfolio: 'bad' }).success).toBe(false);
  });

  it('rejects when status is missing', () => {
    const { status: _, ...rest } = validChangedInput;
    expect(ChangedFieldsSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when websiteUrl is missing', () => {
    const { websiteUrl: _, ...rest } = validChangedInput;
    expect(ChangedFieldsSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when portfolio is missing', () => {
    const { portfolio: _, ...rest } = validChangedInput;
    expect(ChangedFieldsSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when format is missing', () => {
    const { format: _, ...rest } = validChangedInput;
    expect(ChangedFieldsSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an entirely empty object', () => {
    expect(ChangedFieldsSchema.safeParse({}).success).toBe(false);
  });
});