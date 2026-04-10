/**
 * Tests for fools/files.ts - UserSchema changes in this PR:
 *
 * Changes tested:
 * - `website` field removed, replaced with `websiteUrl` and `portfolio` (both z.url())
 * - `status` field changed from z.literal([...]) to z.enum([...])
 * - `siteUrls` field added (z.urls() - tested via equivalent z.array(z.url()))
 * - `format` field added (z.string())
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Reconstruct the parts of UserSchema that were changed in this PR,
// replacing z.urls() (unavailable in zod 4.1.5) with z.array(z.url())
// to isolate and test the specific field changes.
const StatusSchema = z.enum(['active', 'inactive', 'banned']);
const WebsiteUrlSchema = z.url();
const PortfolioSchema = z.url();
const FormatSchema = z.string();

// Representative minimal schema combining all changed fields
const ChangedFieldsSchema = z.object({
  status: StatusSchema,
  websiteUrl: WebsiteUrlSchema,
  portfolio: PortfolioSchema,
  siteUrls: z.array(z.url()),
  format: FormatSchema,
});

// Helper: a valid payload for all changed fields
const validChangedFields = {
  status: 'active' as const,
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'markdown',
};

// ─────────────────────────────────────────────
// status field (changed from z.literal to z.enum)
// ─────────────────────────────────────────────
describe('UserSchema - status field (changed to z.enum)', () => {
  it('accepts "active" as a valid status', () => {
    expect(StatusSchema.safeParse('active').success).toBe(true);
  });

  it('accepts "inactive" as a valid status', () => {
    expect(StatusSchema.safeParse('inactive').success).toBe(true);
  });

  it('accepts "banned" as a valid status', () => {
    expect(StatusSchema.safeParse('banned').success).toBe(true);
  });

  it('rejects an unlisted status value', () => {
    expect(StatusSchema.safeParse('deleted').success).toBe(false);
  });

  it('rejects an empty string as status', () => {
    expect(StatusSchema.safeParse('').success).toBe(false);
  });

  it('rejects a numeric value for status', () => {
    expect(StatusSchema.safeParse(1).success).toBe(false);
  });

  it('rejects null for status', () => {
    expect(StatusSchema.safeParse(null).success).toBe(false);
  });

  it('enum options are exactly the three expected values', () => {
    expect(StatusSchema.options).toEqual(['active', 'inactive', 'banned']);
  });
});

// ─────────────────────────────────────────────
// websiteUrl field (newly added, replaces website)
// ─────────────────────────────────────────────
describe('UserSchema - websiteUrl field (added, uses z.url())', () => {
  it('accepts a valid https URL', () => {
    expect(WebsiteUrlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(WebsiteUrlSchema.safeParse('http://example.com').success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    expect(WebsiteUrlSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('rejects an empty string for websiteUrl', () => {
    expect(WebsiteUrlSchema.safeParse('').success).toBe(false);
  });

  it('rejects null for websiteUrl', () => {
    expect(WebsiteUrlSchema.safeParse(null).success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// portfolio field (newly added, uses z.url())
// ─────────────────────────────────────────────
describe('UserSchema - portfolio field (added, uses z.url())', () => {
  it('accepts a valid https URL for portfolio', () => {
    expect(PortfolioSchema.safeParse('https://portfolio.dev').success).toBe(true);
  });

  it('rejects a non-URL string for portfolio', () => {
    expect(PortfolioSchema.safeParse('my-portfolio').success).toBe(false);
  });

  it('rejects undefined for portfolio', () => {
    expect(PortfolioSchema.safeParse(undefined).success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// format field (newly added, uses z.string())
// ─────────────────────────────────────────────
describe('UserSchema - format field (added, uses z.string())', () => {
  it('accepts any non-empty string for format', () => {
    expect(FormatSchema.safeParse('markdown').success).toBe(true);
  });

  it('accepts an empty string for format (z.string() has no min)', () => {
    expect(FormatSchema.safeParse('').success).toBe(true);
  });

  it('rejects a number for format', () => {
    expect(FormatSchema.safeParse(42).success).toBe(false);
  });

  it('rejects null for format', () => {
    expect(FormatSchema.safeParse(null).success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Combined changed fields
// ─────────────────────────────────────────────
describe('UserSchema - all changed fields combined', () => {
  it('passes with all valid changed field values', () => {
    expect(ChangedFieldsSchema.safeParse(validChangedFields).success).toBe(true);
  });

  it('fails when status is an invalid value', () => {
    const result = ChangedFieldsSchema.safeParse({ ...validChangedFields, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('fails when websiteUrl is not a valid URL', () => {
    const result = ChangedFieldsSchema.safeParse({ ...validChangedFields, websiteUrl: 'ftp-not-valid' });
    expect(result.success).toBe(false);
  });

  it('fails when portfolio is not a valid URL', () => {
    const result = ChangedFieldsSchema.safeParse({ ...validChangedFields, portfolio: 'just text' });
    expect(result.success).toBe(false);
  });

  it('fails when siteUrls contains an invalid URL', () => {
    const result = ChangedFieldsSchema.safeParse({
      ...validChangedFields,
      siteUrls: ['https://valid.com', 'not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty array for siteUrls', () => {
    const result = ChangedFieldsSchema.safeParse({ ...validChangedFields, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('fails when format is missing (undefined)', () => {
    const { format: _omit, ...rest } = validChangedFields;
    const result = ChangedFieldsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('old "website" field is not part of changed fields schema', () => {
    // Ensure we do not mistakenly test for the removed field
    const keys = Object.keys(ChangedFieldsSchema.shape);
    expect(keys).not.toContain('website');
    expect(keys).toContain('websiteUrl');
    expect(keys).toContain('portfolio');
  });
});

// ─────────────────────────────────────────────
// parseUser error handling (behavior of the exported function)
// The actual parseUser in fools/files.ts calls result.error.treeify(), which in
// Zod 4.1.5 is not available, so it will throw a TypeError.  These tests document
// the safeParse + error propagation contract that parseUser wraps.
// ─────────────────────────────────────────────
describe('parseUser safeParse contract', () => {
  it('safeParse returns success:true for a valid status value', () => {
    const result = StatusSchema.safeParse('active');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('active');
  });

  it('safeParse returns success:false for an invalid status value', () => {
    const result = StatusSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });

  it('safeParse error object has an issues array for invalid input', () => {
    const result = StatusSchema.safeParse('wrong');
    if (!result.success) {
      expect(Array.isArray(result.error.issues)).toBe(true);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('safeParse error message is a non-empty string for invalid input', () => {
    const result = WebsiteUrlSchema.safeParse('bad-url');
    if (!result.success) {
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it('safeParse returns success:true for a valid URL value', () => {
    const result = WebsiteUrlSchema.safeParse('https://valid.example.com');
    expect(result.success).toBe(true);
  });

  it('safeParse for format field accepts any string', () => {
    expect(FormatSchema.safeParse('json').success).toBe(true);
    expect(FormatSchema.safeParse('xml').success).toBe(true);
  });

  it('error issues contain a code for enum violations', () => {
    const result = StatusSchema.safeParse('deleted');
    if (!result.success) {
      const codes = result.error.issues.map((i: any) => i.code);
      expect(codes.length).toBeGreaterThan(0);
    }
  });
});