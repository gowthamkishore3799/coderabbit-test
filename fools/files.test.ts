// Tests for UserSchema in fools/files.ts
// Run with: npx vitest run files.test.ts (after installing vitest)
import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser, type User } from './files';

// A valid user object matching the updated schema
function makeValidUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'alice@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://alice.example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
    format: 'json',
    ...overrides,
  };
}

describe('UserSchema (fools/files.ts)', () => {
  // ---------------------------------------------------------------
  // status field: changed from z.literal to z.enum
  // ---------------------------------------------------------------
  describe('status field', () => {
    it('accepts "active" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'active' }));
      expect(result.success).toBe(true);
    });

    it('accepts "inactive" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'inactive' }));
      expect(result.success).toBe(true);
    });

    it('accepts "banned" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'banned' }));
      expect(result.success).toBe(true);
    });

    it('rejects an unknown status value', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'suspended' }));
      expect(result.success).toBe(false);
    });

    it('rejects an empty string as status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: '' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing status', () => {
      const { status, ...rest } = makeValidUser() as Record<string, unknown>;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // websiteUrl field: new field added (z.url())
  // ---------------------------------------------------------------
  describe('websiteUrl field', () => {
    it('accepts a valid https URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'https://example.com' }));
      expect(result.success).toBe(true);
    });

    it('accepts a valid http URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'http://example.com' }));
      expect(result.success).toBe(true);
    });

    it('rejects a non-URL string', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'not-a-url' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const data = makeValidUser();
      delete (data as Record<string, unknown>).websiteUrl;
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // portfolio field: new field added (z.url())
  // ---------------------------------------------------------------
  describe('portfolio field', () => {
    it('accepts a valid URL for portfolio', () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: 'https://portfolio.dev' }));
      expect(result.success).toBe(true);
    });

    it('rejects a bare domain without protocol', () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: 'portfolio.dev' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const data = makeValidUser();
      delete (data as Record<string, unknown>).portfolio;
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // siteUrls field: new field added (z.urls())
  // ---------------------------------------------------------------
  describe('siteUrls field', () => {
    it('accepts an array of valid URLs', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ siteUrls: ['https://a.com', 'https://b.com'] })
      );
      expect(result.success).toBe(true);
    });

    it('accepts an empty array for siteUrls', () => {
      const result = UserSchema.safeParse(makeValidUser({ siteUrls: [] }));
      expect(result.success).toBe(true);
    });

    it('rejects an array containing a non-URL string', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ siteUrls: ['https://valid.com', 'not-a-url'] })
      );
      expect(result.success).toBe(false);
    });

    it('rejects a plain string instead of an array', () => {
      const result = UserSchema.safeParse(makeValidUser({ siteUrls: 'https://example.com' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing siteUrls', () => {
      const data = makeValidUser();
      delete (data as Record<string, unknown>).siteUrls;
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // format field: new field added (z.string())
  // ---------------------------------------------------------------
  describe('format field', () => {
    it('accepts any non-empty string for format', () => {
      const result = UserSchema.safeParse(makeValidUser({ format: 'csv' }));
      expect(result.success).toBe(true);
    });

    it('accepts an empty string for format (z.string() has no min constraint)', () => {
      const result = UserSchema.safeParse(makeValidUser({ format: '' }));
      expect(result.success).toBe(true);
    });

    it('rejects missing format', () => {
      const data = makeValidUser();
      delete (data as Record<string, unknown>).format;
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // website field: REMOVED — should not be in strict schema
  // (UserSchema uses z.object, not strictObject, so extra keys are stripped)
  // ---------------------------------------------------------------
  describe('removed website field', () => {
    it('ignores a website field if provided (stripped by Zod object)', () => {
      const result = UserSchema.safeParse(makeValidUser({ website: 'https://example.com' }));
      // z.object strips unknown keys; extra field does not cause failure
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).website).toBeUndefined();
      }
    });
  });

  // ---------------------------------------------------------------
  // role field: z.enum (pre-existing, but verifying it still works)
  // ---------------------------------------------------------------
  describe('role field', () => {
    it.each(['admin', 'user', 'manager'] as const)('accepts role "%s"', (role) => {
      const result = UserSchema.safeParse(makeValidUser({ role }));
      expect(result.success).toBe(true);
    });

    it('rejects an invalid role', () => {
      const result = UserSchema.safeParse(makeValidUser({ role: 'superadmin' }));
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // profile.joined indentation fix (field must still validate)
  // ---------------------------------------------------------------
  describe('profile field', () => {
    it('accepts a profile with a valid Date for joined', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ profile: { bio: 'test', joined: new Date() } })
      );
      expect(result.success).toBe(true);
    });

    it('rejects a profile where joined is a string instead of Date', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ profile: { bio: 'test', joined: '2024-01-01' } })
      );
      expect(result.success).toBe(false);
    });

    it('accepts a profile without optional bio', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ profile: { joined: new Date() } })
      );
      expect(result.success).toBe(true);
    });

    it('rejects extra keys on strictObject profile', () => {
      const result = UserSchema.safeParse(
        makeValidUser({ profile: { bio: 'test', joined: new Date(), extra: 'not allowed' } })
      );
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // parseUser helper function
  // ---------------------------------------------------------------
  describe('parseUser()', () => {
    it('returns parsed data for a valid input', () => {
      const input = makeValidUser();
      const user = parseUser(input);
      expect(user.email).toBe('alice@example.com');
      expect(user.status).toBe('active');
      expect(user.websiteUrl).toBe('https://alice.example.com');
      expect(user.portfolio).toBe('https://portfolio.example.com');
      expect(user.format).toBe('json');
    });

    it('throws an Error for invalid input', () => {
      expect(() => parseUser({ id: 'bad', email: 'notanemail' })).toThrow();
    });

    it('throws an Error when status is invalid', () => {
      expect(() => parseUser(makeValidUser({ status: 'pending' }))).toThrow();
    });
  });

  // ---------------------------------------------------------------
  // Full valid parse: regression test
  // ---------------------------------------------------------------
  describe('full valid object parse', () => {
    it('successfully parses a complete valid user', () => {
      const input = makeValidUser();
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
        expect(result.data.websiteUrl).toBeDefined();
        expect(result.data.portfolio).toBeDefined();
        expect(Array.isArray(result.data.siteUrls)).toBe(true);
        expect(typeof result.data.format).toBe('string');
      }
    });
  });
});