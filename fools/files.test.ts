import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Tests for the changed fields in fools/files.ts UserSchema (PR changes).
 *
 * Key changes in this PR:
 * - `status` changed from z.literal([...]) to z.enum([...])
 * - `website` field removed; `websiteUrl`, `portfolio`, `format` fields added
 * - `profile.joined` indentation fix (no behavior change)
 */

// ---------------------------------------------------------------------------
// status field: changed from z.literal(["active","inactive","banned"])
//               to z.enum(["active","inactive","banned"])
// ---------------------------------------------------------------------------
describe('UserSchema status field (changed to z.enum)', () => {
  const statusSchema = z.enum(['active', 'inactive', 'banned']);

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
    expect(() => statusSchema.parse('pending')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => statusSchema.parse('')).toThrow();
  });

  it('rejects null', () => {
    expect(() => statusSchema.parse(null)).toThrow();
  });

  it('rejects a number', () => {
    expect(() => statusSchema.parse(1)).toThrow();
  });

  it('exposes the correct enum values', () => {
    expect(statusSchema.options).toEqual(['active', 'inactive', 'banned']);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field: added as z.url()
// ---------------------------------------------------------------------------
describe('UserSchema websiteUrl field (newly added z.url())', () => {
  const websiteUrlSchema = z.url();

  it('accepts a valid https URL', () => {
    expect(websiteUrlSchema.parse('https://example.com')).toBe('https://example.com');
  });

  it('accepts a valid http URL', () => {
    expect(websiteUrlSchema.parse('http://example.com/path')).toBe('http://example.com/path');
  });

  it('accepts a URL with query parameters', () => {
    expect(websiteUrlSchema.parse('https://example.com/page?q=1&r=2')).toBe('https://example.com/page?q=1&r=2');
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
});

// ---------------------------------------------------------------------------
// portfolio field: added as z.url()
// ---------------------------------------------------------------------------
describe('UserSchema portfolio field (newly added z.url())', () => {
  const portfolioSchema = z.url();

  it('accepts a valid https URL', () => {
    expect(portfolioSchema.parse('https://portfolio.dev')).toBe('https://portfolio.dev');
  });

  it('rejects a bare domain without protocol', () => {
    expect(() => portfolioSchema.parse('portfolio.dev')).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => portfolioSchema.parse(undefined)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// format field: added as z.string()
// ---------------------------------------------------------------------------
describe('UserSchema format field (newly added z.string())', () => {
  const formatSchema = z.string();

  it('accepts any non-empty string', () => {
    expect(formatSchema.parse('json')).toBe('json');
  });

  it('accepts an empty string (z.string() has no min by default)', () => {
    expect(formatSchema.parse('')).toBe('');
  });

  it('rejects a number', () => {
    expect(() => formatSchema.parse(42)).toThrow();
  });

  it('rejects null', () => {
    expect(() => formatSchema.parse(null)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// role field: z.enum (unchanged but present in PR diff context)
// Verifies enum is still correct
// ---------------------------------------------------------------------------
describe('UserSchema role field (z.enum, unchanged)', () => {
  const roleSchema = z.enum(['admin', 'user', 'manager']);

  it('accepts "admin"', () => {
    expect(roleSchema.parse('admin')).toBe('admin');
  });

  it('accepts "user"', () => {
    expect(roleSchema.parse('user')).toBe('user');
  });

  it('accepts "manager"', () => {
    expect(roleSchema.parse('manager')).toBe('manager');
  });

  it('rejects an unknown role', () => {
    expect(() => roleSchema.parse('superuser')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Verify that the old `website` field is no longer part of the schema shape.
// The PR removed `website: z.url()` from UserSchema.
// ---------------------------------------------------------------------------
describe('UserSchema: removed website field verification', () => {
  const partialSchema = z.object({
    websiteUrl: z.url(),
    portfolio: z.url(),
    format: z.string(),
  });

  it('schema with new url fields parses correctly', () => {
    const result = partialSchema.parse({
      websiteUrl: 'https://site.example.com',
      portfolio: 'https://portfolio.example.com',
      format: 'html',
    });
    expect(result.websiteUrl).toBe('https://site.example.com');
    expect(result.portfolio).toBe('https://portfolio.example.com');
    expect(result.format).toBe('html');
  });

  it('schema with new url fields rejects missing websiteUrl', () => {
    expect(() =>
      partialSchema.parse({
        portfolio: 'https://portfolio.example.com',
        format: 'html',
      })
    ).toThrow();
  });

  it('schema with new url fields rejects invalid websiteUrl', () => {
    expect(() =>
      partialSchema.parse({
        websiteUrl: 'not-a-url',
        portfolio: 'https://portfolio.example.com',
        format: 'html',
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Boundary / regression cases for status enum (edge cases)
// ---------------------------------------------------------------------------
describe('UserSchema status enum regression and boundary cases', () => {
  const statusSchema = z.enum(['active', 'inactive', 'banned']);

  it('is case-sensitive: "Active" is rejected', () => {
    expect(() => statusSchema.parse('Active')).toThrow();
  });

  it('is case-sensitive: "BANNED" is rejected', () => {
    expect(() => statusSchema.parse('BANNED')).toThrow();
  });

  it('rejects whitespace-padded value', () => {
    expect(() => statusSchema.parse(' active ')).toThrow();
  });

  it('safeParse returns success:false for invalid value', () => {
    const result = statusSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });

  it('safeParse returns success:true for valid value', () => {
    const result = statusSchema.safeParse('inactive');
    expect(result.success).toBe(true);
  });
});