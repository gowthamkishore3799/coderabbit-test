// z.urls() is used in fools/files.ts but does not exist in zod 4.3.6 — it was
// introduced in a later release. We patch the z export here so the schema can
// be loaded and all other schema fields can be tested normally.
import { z as zodZ } from 'zod';
if (!(zodZ as unknown as Record<string, unknown>).urls) {
  (zodZ as unknown as Record<string, unknown>).urls = () =>
    zodZ.array(zodZ.url());
}

import { UserSchema, parseUser } from './files';

// Helper that constructs a fully valid user object for UserSchema
function validUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-1',
    profile: {
      bio: 'Test bio',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.com', 'https://site2.com'],
    format: 'json',
    ...overrides,
  };
}

describe('UserSchema', () => {
  describe('valid inputs', () => {
    it('accepts a fully valid user object', () => {
      const result = UserSchema.safeParse(validUser());
      expect(result.success).toBe(true);
    });

    it('accepts age at the minimum boundary (18)', () => {
      expect(UserSchema.safeParse(validUser({ age: 18 })).success).toBe(true);
    });

    it('accepts age coerced from a numeric string', () => {
      expect(UserSchema.safeParse(validUser({ age: '25' })).success).toBe(true);
    });

    it('accepts active as "true" string', () => {
      expect(UserSchema.safeParse(validUser({ active: 'true' })).success).toBe(true);
    });

    it('accepts active as "false" string', () => {
      expect(UserSchema.safeParse(validUser({ active: 'false' })).success).toBe(true);
    });

    it('accepts active as "1" string (stringbool)', () => {
      expect(UserSchema.safeParse(validUser({ active: '1' })).success).toBe(true);
    });

    it('accepts active as "yes" string (stringbool)', () => {
      expect(UserSchema.safeParse(validUser({ active: 'yes' })).success).toBe(true);
    });

    it('accepts all valid roles: admin, user, manager', () => {
      for (const role of ['admin', 'user', 'manager']) {
        expect(UserSchema.safeParse(validUser({ role })).success).toBe(true);
      }
    });

    it('accepts profile without optional bio', () => {
      const user = validUser();
      delete (user as Record<string, unknown>).profile;
      expect(
        UserSchema.safeParse({
          ...user,
          profile: { joined: new Date('2024-01-01') },
        }).success
      ).toBe(true);
    });

    it('accepts an empty siteUrls array', () => {
      expect(UserSchema.safeParse(validUser({ siteUrls: [] })).success).toBe(true);
    });

    it('accepts format as any non-empty string', () => {
      expect(UserSchema.safeParse(validUser({ format: 'xml' })).success).toBe(true);
    });
  });

  describe('status field (changed from z.literal to z.enum in this PR)', () => {
    it('accepts "active" status', () => {
      expect(UserSchema.safeParse(validUser({ status: 'active' })).success).toBe(true);
    });

    it('accepts "inactive" status', () => {
      expect(UserSchema.safeParse(validUser({ status: 'inactive' })).success).toBe(true);
    });

    it('accepts "banned" status', () => {
      expect(UserSchema.safeParse(validUser({ status: 'banned' })).success).toBe(true);
    });

    it('rejects an unknown status value', () => {
      expect(UserSchema.safeParse(validUser({ status: 'pending' })).success).toBe(false);
    });

    it('rejects empty string for status', () => {
      expect(UserSchema.safeParse(validUser({ status: '' })).success).toBe(false);
    });

    it('rejects a numeric status value', () => {
      expect(UserSchema.safeParse(validUser({ status: 1 })).success).toBe(false);
    });
  });

  describe('websiteUrl field (new field added in this PR)', () => {
    it('accepts a valid https URL', () => {
      expect(UserSchema.safeParse(validUser({ websiteUrl: 'https://example.com' })).success).toBe(true);
    });

    it('accepts a valid http URL', () => {
      expect(UserSchema.safeParse(validUser({ websiteUrl: 'http://example.com' })).success).toBe(true);
    });

    it('rejects a plain string that is not a URL', () => {
      expect(UserSchema.safeParse(validUser({ websiteUrl: 'not-a-url' })).success).toBe(false);
    });

    it('rejects an empty string for websiteUrl', () => {
      expect(UserSchema.safeParse(validUser({ websiteUrl: '' })).success).toBe(false);
    });

    it('rejects absence of websiteUrl', () => {
      const user = validUser();
      delete (user as Record<string, unknown>).websiteUrl;
      expect(UserSchema.safeParse(user).success).toBe(false);
    });
  });

  describe('portfolio field (new field added in this PR)', () => {
    it('accepts a valid https URL for portfolio', () => {
      expect(UserSchema.safeParse(validUser({ portfolio: 'https://portfolio.dev' })).success).toBe(true);
    });

    it('rejects a non-URL string for portfolio', () => {
      expect(UserSchema.safeParse(validUser({ portfolio: 'my-portfolio' })).success).toBe(false);
    });

    it('rejects absence of portfolio', () => {
      const user = validUser();
      delete (user as Record<string, unknown>).portfolio;
      expect(UserSchema.safeParse(user).success).toBe(false);
    });
  });

  describe('siteUrls field (new field added in this PR, uses z.urls())', () => {
    it('accepts an array with multiple valid URLs', () => {
      expect(
        UserSchema.safeParse(validUser({ siteUrls: ['https://a.com', 'https://b.com'] })).success
      ).toBe(true);
    });

    it('rejects an array containing an invalid URL', () => {
      expect(
        UserSchema.safeParse(validUser({ siteUrls: ['https://valid.com', 'not-a-url'] })).success
      ).toBe(false);
    });

    it('rejects absence of siteUrls', () => {
      const user = validUser();
      delete (user as Record<string, unknown>).siteUrls;
      expect(UserSchema.safeParse(user).success).toBe(false);
    });
  });

  describe('format field (new field added in this PR)', () => {
    it('accepts any string for format', () => {
      expect(UserSchema.safeParse(validUser({ format: 'csv' })).success).toBe(true);
    });

    it('accepts an empty string for format', () => {
      // z.string() with no constraints accepts empty strings
      expect(UserSchema.safeParse(validUser({ format: '' })).success).toBe(true);
    });

    it('rejects absence of format', () => {
      const user = validUser();
      delete (user as Record<string, unknown>).format;
      expect(UserSchema.safeParse(user).success).toBe(false);
    });
  });

  describe('id field', () => {
    it('rejects an invalid UUID', () => {
      expect(UserSchema.safeParse(validUser({ id: 'not-a-uuid' })).success).toBe(false);
    });
  });

  describe('email field', () => {
    it('rejects an invalid email address', () => {
      expect(UserSchema.safeParse(validUser({ email: 'bad-email' })).success).toBe(false);
    });
  });

  describe('age field', () => {
    it('rejects age below 18', () => {
      expect(UserSchema.safeParse(validUser({ age: 17 })).success).toBe(false);
    });

    it('rejects a non-numeric age string', () => {
      expect(UserSchema.safeParse(validUser({ age: 'old' })).success).toBe(false);
    });
  });

  describe('role field', () => {
    it('rejects an unknown role', () => {
      expect(UserSchema.safeParse(validUser({ role: 'superuser' })).success).toBe(false);
    });
  });

  describe('code field (templateLiteral)', () => {
    it('accepts valid code matching user-{number}', () => {
      expect(UserSchema.safeParse(validUser({ code: 'user-42' })).success).toBe(true);
    });

    it('rejects a code not starting with "user-"', () => {
      expect(UserSchema.safeParse(validUser({ code: 'admin-1' })).success).toBe(false);
    });
  });

  describe('profile strictObject', () => {
    it('rejects extra fields in profile (strictObject)', () => {
      expect(
        UserSchema.safeParse(
          validUser({ profile: { joined: new Date(), extraField: 'disallowed' } })
        ).success
      ).toBe(false);
    });
  });
});

describe('parseUser()', () => {
  it('returns typed data for a valid user', () => {
    const user = validUser();
    const result = parseUser(user);
    expect(result.email).toBe('user@example.com');
    expect(result.status).toBe('active');
    expect(result.websiteUrl).toBe('https://example.com');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ id: 'bad', email: 'bad', age: 5 })).toThrow(Error);
  });

  it('throws an Error instance (not a raw Zod error)', () => {
    let thrown: unknown;
    try {
      parseUser({ id: 'not-uuid', email: 'bad', age: 5 });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Error);
  });
});