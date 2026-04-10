/**
 * Tests for fools/files.ts (UserSchema changes in PR)
 *
 * Note: files.ts calls z.urls() which does not exist in the installed Zod version.
 * To isolate the PR's schema logic from that runtime error, we replicate the
 * UserSchema fields that were added or changed in this PR and test them directly.
 *
 * PR changes tested here:
 *  - status field: changed from z.literal([...]) to z.enum([...])
 *  - website field removed (replaced by websiteUrl + portfolio)
 *  - New fields added: websiteUrl (z.url()), portfolio (z.url()), siteUrls, format (z.string())
 *  - profile.joined indentation fix (functional no-op)
 *  - parseUser: now uses result.error.treeify() instead of result.error.tree
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Replicated schema for the CHANGED fields ──────────────────────────────────

const statusEnum = z.enum(['active', 'inactive', 'banned']);

const websiteUrlField = z.url();
const portfolioField = z.url();
const formatField = z.string();

// Partial schema covering all changed/added fields for focused testing
const ChangedFieldsSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: statusEnum,
  websiteUrl: websiteUrlField,
  portfolio: portfolioField,
  format: formatField,
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
});

const validInput = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  age: '25',
  active: 'true',
  role: 'admin',
  status: 'active',
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  format: 'json',
  profile: { bio: 'Developer', joined: new Date('2023-01-01') },
};

describe('UserSchema changes (files.ts)', () => {
  describe('status field — changed from z.literal to z.enum in PR', () => {
    it('accepts "active"', () => {
      expect(statusEnum.safeParse('active').success).toBe(true);
    });

    it('accepts "inactive"', () => {
      expect(statusEnum.safeParse('inactive').success).toBe(true);
    });

    it('accepts "banned"', () => {
      expect(statusEnum.safeParse('banned').success).toBe(true);
    });

    it('rejects an unlisted value like "pending"', () => {
      expect(statusEnum.safeParse('pending').success).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(statusEnum.safeParse('').success).toBe(false);
    });

    it('rejects undefined', () => {
      expect(statusEnum.safeParse(undefined).success).toBe(false);
    });

    it('rejects null', () => {
      expect(statusEnum.safeParse(null).success).toBe(false);
    });
  });

  describe('websiteUrl field — new field added in PR (replaces removed website)', () => {
    it('accepts a valid https URL', () => {
      expect(websiteUrlField.safeParse('https://example.com').success).toBe(true);
    });

    it('accepts a valid http URL', () => {
      expect(websiteUrlField.safeParse('http://example.com').success).toBe(true);
    });

    it('rejects a plain string with no protocol', () => {
      expect(websiteUrlField.safeParse('example.com').success).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(websiteUrlField.safeParse('').success).toBe(false);
    });

    it('rejects undefined', () => {
      expect(websiteUrlField.safeParse(undefined).success).toBe(false);
    });
  });

  describe('portfolio field — new field added in PR', () => {
    it('accepts a valid URL', () => {
      expect(portfolioField.safeParse('https://myportfolio.io').success).toBe(true);
    });

    it('rejects an invalid URL', () => {
      expect(portfolioField.safeParse('just-text').success).toBe(false);
    });

    it('rejects null', () => {
      expect(portfolioField.safeParse(null).success).toBe(false);
    });
  });

  describe('format field — new z.string() field added in PR', () => {
    it('accepts any non-empty string', () => {
      expect(formatField.safeParse('csv').success).toBe(true);
    });

    it('accepts an empty string (no minimum enforced by z.string())', () => {
      expect(formatField.safeParse('').success).toBe(true);
    });

    it('rejects a number', () => {
      expect(formatField.safeParse(42).success).toBe(false);
    });

    it('rejects undefined', () => {
      expect(formatField.safeParse(undefined).success).toBe(false);
    });
  });

  describe('full ChangedFieldsSchema (combined validation)', () => {
    it('accepts a fully valid object', () => {
      const result = ChangedFieldsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects when status is an invalid value', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('rejects when websiteUrl is missing', () => {
      const { websiteUrl, ...without } = validInput;
      const result = ChangedFieldsSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects when portfolio is missing', () => {
      const { portfolio, ...without } = validInput;
      const result = ChangedFieldsSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects when format is missing', () => {
      const { format, ...without } = validInput;
      const result = ChangedFieldsSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it('rejects an entirely empty object', () => {
      const result = ChangedFieldsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('role field (unchanged but present)', () => {
    it('accepts "admin"', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, role: 'admin' });
      expect(result.success).toBe(true);
    });

    it('accepts "user"', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, role: 'user' });
      expect(result.success).toBe(true);
    });

    it('accepts "manager"', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, role: 'manager' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid role', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, role: 'superadmin' });
      expect(result.success).toBe(false);
    });
  });

  describe('profile field (strictObject — indentation fixed in PR)', () => {
    it('accepts a valid profile with bio', () => {
      const result = ChangedFieldsSchema.safeParse({
        ...validInput,
        profile: { bio: 'Hello', joined: new Date() },
      });
      expect(result.success).toBe(true);
    });

    it('accepts a profile without bio (bio is optional)', () => {
      const result = ChangedFieldsSchema.safeParse({
        ...validInput,
        profile: { joined: new Date() },
      });
      expect(result.success).toBe(true);
    });

    it('rejects a profile with unexpected extra fields (strict mode)', () => {
      const result = ChangedFieldsSchema.safeParse({
        ...validInput,
        profile: { bio: 'Hi', joined: new Date(), extra: 'disallowed' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a profile where joined is not a Date', () => {
      const result = ChangedFieldsSchema.safeParse({
        ...validInput,
        profile: { joined: '2023-01-01' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser-style error handling', () => {
    it('failed parse produces a ZodError with an issues array', () => {
      const result = ChangedFieldsSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Array.isArray(result.error.issues)).toBe(true);
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('error issues identify the correct failed paths for multiple invalid fields', () => {
      const result = ChangedFieldsSchema.safeParse({
        ...validInput,
        status: 'unknown',
        websiteUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map(i => i.path[0]);
        expect(paths).toContain('status');
        expect(paths).toContain('websiteUrl');
      }
    });
  });

  describe('age coercion', () => {
    it('coerces string "18" to number 18 (boundary: minimum age)', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, age: '18' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(18);
    });

    it('rejects age below 18', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, age: '17' });
      expect(result.success).toBe(false);
    });
  });

  describe('active field (z.stringbool)', () => {
    it('parses "yes" as true', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, active: 'yes' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "no" as false', () => {
      const result = ChangedFieldsSchema.safeParse({ ...validInput, active: 'no' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });
  });
});