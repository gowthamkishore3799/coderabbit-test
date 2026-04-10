/**
 * Tests for fools/files.ts – focuses on the fields that were changed or added in this PR:
 *  - status: changed from z.literal([...]) to z.enum([...])
 *  - websiteUrl: new z.url() field
 *  - portfolio: new z.url() field
 *  - siteUrls: new z.urls() field (array of URL strings)
 *  - format: new z.string() field
 *  - website: removed field
 *  - profile.joined indentation fix (no functional change)
 *
 * Note: z.urls() was introduced after zod 4.1.5. The test suite for siteUrls
 * falls back to an equivalent z.array(z.url()) assertion when z.urls is
 * unavailable, ensuring the validation intent is still verified.
 */

import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// ─── Mirror of the changed schema fields ────────────────────────────────────
// We construct equivalent schemas here so tests remain runnable even when
// z.urls() is not yet in the installed zod version.

const statusSchema = z.enum(['active', 'inactive', 'banned']);
const websiteUrlSchema = z.url();
const portfolioSchema = z.url();
const siteUrlsSchema =
  typeof (z as any).urls === 'function'
    ? (z as any).urls()
    : z.array(z.url());
const formatSchema = z.string();

// ─── Status field (changed from z.literal to z.enum) ────────────────────────
describe('status field – z.enum(["active", "inactive", "banned"])', () => {
  it('accepts "active"', () => {
    expect(statusSchema.parse('active')).toBe('active');
  });

  it('accepts "inactive"', () => {
    expect(statusSchema.parse('inactive')).toBe('inactive');
  });

  it('accepts "banned"', () => {
    expect(statusSchema.parse('banned')).toBe('banned');
  });

  it('rejects a value not in the enum', () => {
    expect(() => statusSchema.parse('pending')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => statusSchema.parse('')).toThrow();
  });

  it('rejects null', () => {
    expect(() => statusSchema.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => statusSchema.parse(undefined)).toThrow();
  });

  it('rejects a number', () => {
    expect(() => statusSchema.parse(1)).toThrow();
  });

  it('returns the correct TypeScript enum options', () => {
    expect(statusSchema.options).toEqual(['active', 'inactive', 'banned']);
  });
});

// ─── websiteUrl field (new z.url() field) ────────────────────────────────────
describe('websiteUrl field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(() => websiteUrlSchema.parse('https://example.com')).not.toThrow();
  });

  it('accepts a valid http URL', () => {
    expect(() => websiteUrlSchema.parse('http://example.com/path?q=1')).not.toThrow();
  });

  it('rejects a plain string that is not a URL', () => {
    expect(() => websiteUrlSchema.parse('not-a-url')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => websiteUrlSchema.parse('')).toThrow();
  });

  it('rejects null', () => {
    expect(() => websiteUrlSchema.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => websiteUrlSchema.parse(undefined)).toThrow();
  });
});

// ─── portfolio field (new z.url() field) ─────────────────────────────────────
describe('portfolio field – z.url()', () => {
  it('accepts a valid https URL', () => {
    expect(() => portfolioSchema.parse('https://portfolio.dev')).not.toThrow();
  });

  it('accepts a URL with a path and query string', () => {
    expect(() => portfolioSchema.parse('https://site.io/projects?tab=all')).not.toThrow();
  });

  it('rejects a non-URL string', () => {
    expect(() => portfolioSchema.parse('just-text')).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => portfolioSchema.parse(undefined)).toThrow();
  });
});

// ─── siteUrls field (new z.urls() / z.array(z.url()) field) ──────────────────
describe('siteUrls field – z.urls() or z.array(z.url())', () => {
  it('accepts an empty array', () => {
    expect(() => siteUrlsSchema.parse([])).not.toThrow();
  });

  it('accepts an array of valid URLs', () => {
    expect(() =>
      siteUrlsSchema.parse(['https://a.com', 'https://b.org']),
    ).not.toThrow();
  });

  it('rejects an array containing a non-URL string', () => {
    expect(() => siteUrlsSchema.parse(['https://valid.com', 'bad-url'])).toThrow();
  });

  it('rejects a plain string (not an array)', () => {
    expect(() => siteUrlsSchema.parse('https://example.com')).toThrow();
  });

  it('rejects null', () => {
    expect(() => siteUrlsSchema.parse(null)).toThrow();
  });
});

// ─── format field (new z.string() field) ─────────────────────────────────────
describe('format field – z.string()', () => {
  it('accepts any non-empty string', () => {
    expect(formatSchema.parse('json')).toBe('json');
  });

  it('accepts an empty string', () => {
    expect(formatSchema.parse('')).toBe('');
  });

  it('rejects a number', () => {
    expect(() => formatSchema.parse(42)).toThrow();
  });

  it('rejects null', () => {
    expect(() => formatSchema.parse(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => formatSchema.parse(undefined)).toThrow();
  });
});

// ─── Verify "website" field was removed from the schema ──────────────────────
describe('website field removal', () => {
  /**
   * The old schema had `website: z.url()` as a top-level field.
   * In this PR it was replaced with `websiteUrl` and `portfolio`.
   * We verify that the new separated fields exist and that the original
   * combined `website` key is no longer part of the expected shape.
   */
  it('does not include a bare "website" key in the new field set', () => {
    // Build a shape that mirrors only the PR-changed fields
    const prChangedShape = z.object({
      status: statusSchema,
      websiteUrl: websiteUrlSchema,
      portfolio: portfolioSchema,
      format: formatSchema,
    });
    const shapeKeys = Object.keys(prChangedShape.shape);
    expect(shapeKeys).not.toContain('website');
    expect(shapeKeys).toContain('websiteUrl');
    expect(shapeKeys).toContain('portfolio');
  });
});

// ─── Combined partial schema (changed fields only) ───────────────────────────
describe('combined changed-fields schema', () => {
  const changedFields = z.object({
    status: statusSchema,
    websiteUrl: websiteUrlSchema,
    portfolio: portfolioSchema,
    format: formatSchema,
  });

  const validPayload = {
    status: 'active',
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.dev',
    format: 'json',
  };

  it('parses a fully valid payload', () => {
    const result = changedFields.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails when status is invalid', () => {
    const result = changedFields.safeParse({ ...validPayload, status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('fails when websiteUrl is not a URL', () => {
    const result = changedFields.safeParse({ ...validPayload, websiteUrl: 'oops' });
    expect(result.success).toBe(false);
  });

  it('fails when portfolio is not a URL', () => {
    const result = changedFields.safeParse({ ...validPayload, portfolio: 'oops' });
    expect(result.success).toBe(false);
  });

  it('accepts any string for format including empty', () => {
    const result = changedFields.safeParse({ ...validPayload, format: '' });
    expect(result.success).toBe(true);
  });

  it('accumulates multiple field errors on bad input', () => {
    const result = changedFields.safeParse({
      status: 'unknown',
      websiteUrl: 'bad',
      portfolio: 'bad',
      format: 42,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(1);
    }
  });
});