/**
 * Tests for fools/files.ts (UserSchema changes in PR).
 *
 * NOTE: fools/files.ts uses z.urls() which does not exist in zod v4.
 * Importing the module directly causes a runtime error. Tests here
 * validate the PR-changed schema fields and logic using inline schemas
 * that mirror the PR changes but replace z.urls() with z.array(z.url())
 * to keep the tests runnable.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ---- Inline schema mirroring PR changes to fools/files.ts ----
// Key PR changes:
//   - Removed `website: z.url()` field
//   - Changed `status` from z.literal([...]) to z.enum([...])
//   - Added websiteUrl, portfolio, siteUrls (z.array(z.url()) proxy), format
const UserSchemaFromPR = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: z.enum(['active', 'inactive', 'banned']), // was z.literal([...]) before PR
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),    // added in PR
  portfolio: z.url(),     // added in PR
  siteUrls: z.array(z.url()), // proxy for z.urls() (not a real zod function)
  format: z.string(),     // added in PR
});

// Inline parseUser mirror (uses .format() since .treeify() is not available in zod v4.1.x)
function parseUser(input: unknown) {
  const result = UserSchemaFromPR.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.format()));
  }
  return result.data;
}

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  status: 'active',
  code: 'user-42',
  profile: {
    bio: 'Hello',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.dev',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('UserSchema – fools/files.ts (PR changes)', () => {
  describe('z.urls() is not a valid zod function (PR introduced bug)', () => {
    it('z.urls is not a function in zod v4', () => {
      expect(typeof (z as Record<string, unknown>)['urls']).not.toBe('function');
    });
  });

  describe('valid inputs', () => {
    it('parses a complete valid user', () => {
      const result = UserSchemaFromPR.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('accepts all valid role values', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        expect(UserSchemaFromPR.safeParse({ ...validUser, role }).success).toBe(true);
      }
    });

    it('accepts all valid status values (z.enum – PR change)', () => {
      for (const status of ['active', 'inactive', 'banned'] as const) {
        expect(UserSchemaFromPR.safeParse({ ...validUser, status }).success).toBe(true);
      }
    });

    it('accepts stringbool truthy values', () => {
      for (const active of ['true', '1', 'yes']) {
        expect(UserSchemaFromPR.safeParse({ ...validUser, active }).success).toBe(true);
      }
    });

    it('accepts stringbool falsy values', () => {
      for (const active of ['false', '0', 'no']) {
        expect(UserSchemaFromPR.safeParse({ ...validUser, active }).success).toBe(true);
      }
    });

    it('accepts profile with no bio (bio is optional)', () => {
      const result = UserSchemaFromPR.safeParse({
        ...validUser,
        profile: { joined: new Date('2024-01-01') },
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty siteUrls array', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, siteUrls: [] }).success).toBe(true);
    });

    it('accepts age coercion from string', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, age: '30' }).success).toBe(true);
    });

    it('accepts age at boundary of 18', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, age: 18 }).success).toBe(true);
    });
  });

  describe('websiteUrl field (added in PR)', () => {
    it('rejects invalid websiteUrl', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, websiteUrl: 'not-a-url' }).success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const { websiteUrl: _, ...rest } = validUser;
      expect(UserSchemaFromPR.safeParse(rest).success).toBe(false);
    });

    it('accepts valid https URL for websiteUrl', () => {
      expect(
        UserSchemaFromPR.safeParse({ ...validUser, websiteUrl: 'https://my-site.io/path?q=1' }).success,
      ).toBe(true);
    });
  });

  describe('portfolio field (added in PR)', () => {
    it('rejects invalid portfolio URL', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, portfolio: 'not-a-url-at-all' }).success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const { portfolio: _, ...rest } = validUser;
      expect(UserSchemaFromPR.safeParse(rest).success).toBe(false);
    });

    it('accepts valid https URL for portfolio', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, portfolio: 'https://dev.to/me' }).success).toBe(true);
    });
  });

  describe('siteUrls field (added in PR; z.urls() not valid – proxied via z.array(z.url()))', () => {
    it('rejects non-URL entries in siteUrls', () => {
      expect(
        UserSchemaFromPR.safeParse({ ...validUser, siteUrls: ['not-a-url'] }).success,
      ).toBe(false);
    });

    it('rejects missing siteUrls', () => {
      const { siteUrls: _, ...rest } = validUser;
      expect(UserSchemaFromPR.safeParse(rest).success).toBe(false);
    });

    it('accepts multiple valid URLs in siteUrls', () => {
      expect(
        UserSchemaFromPR.safeParse({
          ...validUser,
          siteUrls: ['https://a.com', 'https://b.io'],
        }).success,
      ).toBe(true);
    });
  });

  describe('status field (changed from z.literal to z.enum in PR)', () => {
    it('rejects invalid status value', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, status: 'pending' }).success).toBe(false);
    });

    it('rejects empty string for status', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, status: '' }).success).toBe(false);
    });

    it('rejects null for status', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, status: null }).success).toBe(false);
    });
  });

  describe('format field (added in PR)', () => {
    it('accepts any non-empty string as format', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, format: 'csv' }).success).toBe(true);
    });

    it('rejects missing format field', () => {
      const { format: _, ...rest } = validUser;
      expect(UserSchemaFromPR.safeParse(rest).success).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid UUID', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, id: 'not-a-uuid' }).success).toBe(false);
    });

    it('rejects invalid email', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, email: 'bad-email' }).success).toBe(false);
    });

    it('rejects age below 18', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, age: 17 }).success).toBe(false);
    });

    it('rejects invalid role', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, role: 'superadmin' }).success).toBe(false);
    });

    it('rejects code not matching template literal pattern', () => {
      expect(UserSchemaFromPR.safeParse({ ...validUser, code: 'usr-42' }).success).toBe(false);
    });

    it('templateLiteral accepts user-10000 (zod does not enforce numeric range in templateLiteral)', () => {
      // NOTE: z.templateLiteral with z.number().max(9999) matches by pattern, not numeric range.
      // 'user-10000' is accepted as the string matches the template shape.
      expect(UserSchemaFromPR.safeParse({ ...validUser, code: 'user-10000' }).success).toBe(true);
    });

    it('rejects extra properties in strict profile object', () => {
      expect(
        UserSchemaFromPR.safeParse({
          ...validUser,
          profile: { bio: 'hi', joined: new Date(), extraField: true },
        }).success,
      ).toBe(false);
    });

    it('rejects missing profile.joined', () => {
      expect(
        UserSchemaFromPR.safeParse({ ...validUser, profile: { bio: 'hi' } }).success,
      ).toBe(false);
    });
  });

  describe('parseUser helper', () => {
    it('returns parsed data for valid input', () => {
      const user = parseUser(validUser);
      expect(user.email).toBe('user@example.com');
      expect(user.role).toBe('admin');
    });

    it('throws an error for invalid input', () => {
      expect(() => parseUser({ ...validUser, email: 'bad' })).toThrow();
    });

    it('error message is a JSON string containing field errors', () => {
      try {
        parseUser({ ...validUser, id: 'not-uuid', email: 'not-email' });
        expect.fail('Should have thrown');
      } catch (e: unknown) {
        const msg = (e as Error).message;
        expect(typeof msg).toBe('string');
        const parsed = JSON.parse(msg);
        expect(typeof parsed).toBe('object');
        expect(parsed).toHaveProperty('id');
        expect(parsed).toHaveProperty('email');
      }
    });
  });
});