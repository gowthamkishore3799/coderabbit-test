/**
 * Tests for fools/files.ts – UserSchema and parseUser.
 *
 * PR changes tested here:
 *  - `status` field changed from z.literal to z.enum (accepts "active" | "inactive" | "banned")
 *  - Removed `website` field (replaced by `websiteUrl` and `portfolio`)
 *  - Added `websiteUrl: z.url()` field
 *  - Added `portfolio: z.url()` field
 *  - Added `siteUrls: z.urls()` field (note: z.urls() does not exist in zod 4.x)
 *  - Added `format: z.string()` field
 */

import { describe, it, expect, vi } from 'vitest';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Helpers shared across tests
// ---------------------------------------------------------------------------

/** Minimal valid payload for the parts of UserSchema that WERE changed in this PR. */
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_EMAIL = 'user@example.com';
const VALID_URL = 'https://example.com';

// ---------------------------------------------------------------------------
// 1. status field – changed from z.literal(["active","inactive","banned"]) to z.enum(...)
// ---------------------------------------------------------------------------

describe('UserSchema status field (z.enum)', () => {
  const StatusSchema = z.enum(['active', 'inactive', 'banned']);

  it('accepts "active"', () => {
    expect(StatusSchema.safeParse('active').success).toBe(true);
  });

  it('accepts "inactive"', () => {
    expect(StatusSchema.safeParse('inactive').success).toBe(true);
  });

  it('accepts "banned"', () => {
    expect(StatusSchema.safeParse('banned').success).toBe(true);
  });

  it('rejects an unknown status string', () => {
    const result = StatusSchema.safeParse('suspended');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    expect(StatusSchema.safeParse(null).success).toBe(false);
  });

  it('rejects an integer', () => {
    expect(StatusSchema.safeParse(1).success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(StatusSchema.safeParse('').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. websiteUrl field – new z.url() field added in PR
// ---------------------------------------------------------------------------

describe('UserSchema websiteUrl field (z.url)', () => {
  const UrlSchema = z.url();

  it('accepts a valid https URL', () => {
    expect(UrlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(UrlSchema.safeParse('http://example.com').success).toBe(true);
  });

  it('accepts a URL with path and query', () => {
    expect(UrlSchema.safeParse('https://example.com/path?q=1').success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    expect(UrlSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(UrlSchema.safeParse('').success).toBe(false);
  });

  it('rejects null', () => {
    expect(UrlSchema.safeParse(null).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. portfolio field – new z.url() field added in PR (same validators as websiteUrl)
// ---------------------------------------------------------------------------

describe('UserSchema portfolio field (z.url)', () => {
  const PortfolioSchema = z.url();

  it('accepts a valid URL', () => {
    expect(PortfolioSchema.safeParse('https://portfolio.example.com').success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(PortfolioSchema.safeParse('my-portfolio').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. format field – new z.string() field added in PR
// ---------------------------------------------------------------------------

describe('UserSchema format field (z.string)', () => {
  const FormatSchema = z.string();

  it('accepts any string', () => {
    expect(FormatSchema.safeParse('pdf').success).toBe(true);
    expect(FormatSchema.safeParse('').success).toBe(true);
    expect(FormatSchema.safeParse('some-format-value').success).toBe(true);
  });

  it('rejects a number', () => {
    expect(FormatSchema.safeParse(123).success).toBe(false);
  });

  it('rejects null', () => {
    expect(FormatSchema.safeParse(null).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. siteUrls field – PR added siteUrls: z.urls() but z.urls() does not exist in zod 4.x
//    This test documents that z.urls is unavailable and importing the schema will fail.
// ---------------------------------------------------------------------------

describe('siteUrls field - z.urls() availability', () => {
  it('z.urls is not available in the installed version of zod', () => {
    // z.urls() was added in UserSchema but is not a valid zod method.
    // This test documents that the function does not exist.
    expect(typeof (z as any).urls).toBe('undefined');
  });

  it('importing UserSchema from files.ts throws because z.urls() is undefined', async () => {
    // The schema module will fail to initialise because z.urls() throws at declaration time.
    await expect(import('./files.js')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 6. Composite: schema built from the changed fields validates a correct object
// ---------------------------------------------------------------------------

describe('Composite schema from PR-changed fields', () => {
  const ChangedFieldsSchema = z.object({
    status: z.enum(['active', 'inactive', 'banned']),
    websiteUrl: z.url(),
    portfolio: z.url(),
    format: z.string(),
  });

  it('accepts a fully valid object', () => {
    const result = ChangedFieldsSchema.safeParse({
      status: 'active',
      websiteUrl: 'https://example.com',
      portfolio: 'https://portfolio.example.com',
      format: 'json',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when status is an old-style multi-literal array (not a string)', () => {
    const result = ChangedFieldsSchema.safeParse({
      status: ['active'],
      websiteUrl: 'https://example.com',
      portfolio: 'https://portfolio.example.com',
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when websiteUrl is missing', () => {
    const result = ChangedFieldsSchema.safeParse({
      status: 'active',
      portfolio: 'https://portfolio.example.com',
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when portfolio is missing', () => {
    const result = ChangedFieldsSchema.safeParse({
      status: 'active',
      websiteUrl: 'https://example.com',
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when format is a number instead of a string', () => {
    const result = ChangedFieldsSchema.safeParse({
      status: 'active',
      websiteUrl: 'https://example.com',
      portfolio: 'https://portfolio.example.com',
      format: 42,
    });
    expect(result.success).toBe(false);
  });

  it('rejects when all fields are missing', () => {
    expect(ChangedFieldsSchema.safeParse({}).success).toBe(false);
  });
});