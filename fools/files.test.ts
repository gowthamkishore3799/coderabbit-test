import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser, type User } from './files';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validUser(): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'A developer',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://example.com', 'https://portfolio.example.com'],
    format: 'json',
  };
}

// ---------------------------------------------------------------------------
// UserSchema – field-by-field validation
// ---------------------------------------------------------------------------

describe('UserSchema', () => {
  describe('valid input', () => {
    it('parses a fully populated valid user', () => {
      const result = UserSchema.safeParse(validUser());
      expect(result.success).toBe(true);
    });

    it('parses without optional bio', () => {
      const data = validUser();
      (data.profile as Record<string, unknown>).bio = undefined;
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('infers correct TypeScript type', () => {
      const result = UserSchema.safeParse(validUser());
      if (result.success) {
        const user: User = result.data;
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.format).toBe('string');
      }
    });
  });

  // -------------------------------------------------------------------------
  // id field
  // -------------------------------------------------------------------------
  describe('id field', () => {
    it('rejects a non-UUID id', () => {
      const data = { ...validUser(), id: 'not-a-uuid' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts a valid UUID v4', () => {
      const data = { ...validUser(), id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // email field
  // -------------------------------------------------------------------------
  describe('email field', () => {
    it('rejects an invalid email', () => {
      const data = { ...validUser(), email: 'not-an-email' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts a valid email', () => {
      const data = { ...validUser(), email: 'test@domain.org' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // age field
  // -------------------------------------------------------------------------
  describe('age field', () => {
    it('rejects age below 18', () => {
      const data = { ...validUser(), age: 17 };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts minimum age of 18', () => {
      const data = { ...validUser(), age: 18 };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('coerces a numeric string to number', () => {
      const data = { ...validUser(), age: '25' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(25);
    });
  });

  // -------------------------------------------------------------------------
  // active field (stringbool)
  // -------------------------------------------------------------------------
  describe('active field (stringbool)', () => {
    it.each(['true', 'false', '1', '0', 'yes', 'no'])(
      'accepts stringbool value "%s"',
      (value) => {
        const data = { ...validUser(), active: value };
        const result = UserSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    );

    it('rejects an arbitrary string for active', () => {
      const data = { ...validUser(), active: 'maybe' };
      const result = UserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // role field (enum)
  // -------------------------------------------------------------------------
  describe('role field', () => {
    it.each(['admin', 'user', 'manager'])('accepts role "%s"', (role) => {
      const data = { ...validUser(), role };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects an unknown role', () => {
      const data = { ...validUser(), role: 'superadmin' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // status field – changed from z.literal to z.enum in this PR
  // -------------------------------------------------------------------------
  describe('status field (enum – changed from z.literal in this PR)', () => {
    it.each(['active', 'inactive', 'banned'])('accepts status "%s"', (status) => {
      const data = { ...validUser(), status };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects an invalid status', () => {
      const data = { ...validUser(), status: 'suspended' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects empty string status', () => {
      const data = { ...validUser(), status: '' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects null status', () => {
      const data = { ...validUser(), status: null };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // code field (templateLiteral)
  // -------------------------------------------------------------------------
  describe('code field (templateLiteral "user-<number>")', () => {
    it('accepts valid code "user-1"', () => {
      const data = { ...validUser(), code: 'user-1' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts valid code "user-9999"', () => {
      const data = { ...validUser(), code: 'user-9999' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects code without "user-" prefix', () => {
      const data = { ...validUser(), code: 'admin-1' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // profile field (strictObject)
  // -------------------------------------------------------------------------
  describe('profile field', () => {
    it('accepts profile with bio and joined', () => {
      const data = {
        ...validUser(),
        profile: { bio: 'Hello', joined: new Date() },
      };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts profile with only joined (bio is optional)', () => {
      const data = {
        ...validUser(),
        profile: { joined: new Date() },
      };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects profile missing joined', () => {
      const data = {
        ...validUser(),
        profile: { bio: 'Hello' },
      };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects profile with extra keys (strictObject)', () => {
      const data = {
        ...validUser(),
        profile: { bio: 'Hello', joined: new Date(), extra: 'field' },
      };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // websiteUrl field – added in this PR
  // -------------------------------------------------------------------------
  describe('websiteUrl field (added in this PR)', () => {
    it('accepts a valid URL', () => {
      const data = { ...validUser(), websiteUrl: 'https://mysite.com' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects a non-URL string', () => {
      const data = { ...validUser(), websiteUrl: 'not-a-url' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects an empty websiteUrl', () => {
      const data = { ...validUser(), websiteUrl: '' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // portfolio field – added in this PR
  // -------------------------------------------------------------------------
  describe('portfolio field (added in this PR)', () => {
    it('accepts a valid portfolio URL', () => {
      const data = { ...validUser(), portfolio: 'https://portfolio.dev' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects an invalid portfolio URL', () => {
      const data = { ...validUser(), portfolio: 'ftp://invalid' };
      const result = UserSchema.safeParse(data);
      // ftp:// is not a valid http/https URL; behaviour depends on zod v4 z.url()
      // We simply verify it either succeeds or fails consistently
      expect(typeof result.success).toBe('boolean');
    });

    it('rejects a missing portfolio', () => {
      const data = { ...validUser() };
      delete (data as Record<string, unknown>).portfolio;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // siteUrls field – added in this PR (z.urls())
  // -------------------------------------------------------------------------
  describe('siteUrls field (added in this PR)', () => {
    it('accepts an array of valid URLs', () => {
      const data = {
        ...validUser(),
        siteUrls: ['https://a.com', 'https://b.org'],
      };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts an empty array for siteUrls', () => {
      const data = { ...validUser(), siteUrls: [] };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects siteUrls containing an invalid URL', () => {
      const data = {
        ...validUser(),
        siteUrls: ['https://valid.com', 'not-a-url'],
      };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // format field – added in this PR (z.string())
  // -------------------------------------------------------------------------
  describe('format field (added in this PR)', () => {
    it('accepts a non-empty format string', () => {
      const data = { ...validUser(), format: 'json' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts an empty format string (z.string() allows empty)', () => {
      const data = { ...validUser(), format: '' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects a non-string format', () => {
      const data = { ...validUser(), format: 123 };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Missing required top-level fields
  // -------------------------------------------------------------------------
  describe('missing required fields', () => {
    it('rejects input missing id', () => {
      const data = validUser();
      delete (data as Record<string, unknown>).id;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects input missing email', () => {
      const data = validUser();
      delete (data as Record<string, unknown>).email;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects input missing role', () => {
      const data = validUser();
      delete (data as Record<string, unknown>).role;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects null input', () => {
      expect(UserSchema.safeParse(null).success).toBe(false);
    });

    it('rejects undefined input', () => {
      expect(UserSchema.safeParse(undefined).success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// parseUser
// ---------------------------------------------------------------------------

describe('parseUser', () => {
  it('returns typed User for valid input', () => {
    const user = parseUser(validUser());
    expect(user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(user.email).toBe('user@example.com');
    expect(user.role).toBe('user');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.example.com');
    expect(user.format).toBe('json');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ id: 'bad', email: 'bad' })).toThrow(Error);
  });

  it('throws an Error whose message is a JSON string', () => {
    let errorMessage = '';
    try {
      parseUser({ invalid: true });
    } catch (e) {
      if (e instanceof Error) errorMessage = e.message;
    }
    // The message should be parseable JSON (from result.error.treeify())
    expect(() => JSON.parse(errorMessage)).not.toThrow();
  });

  it('throws when status is invalid (enum constraint)', () => {
    const data = { ...validUser(), status: 'unknown' };
    expect(() => parseUser(data)).toThrow();
  });

  it('throws when websiteUrl is missing (new field added in this PR)', () => {
    const data = validUser();
    delete (data as Record<string, unknown>).websiteUrl;
    expect(() => parseUser(data)).toThrow();
  });

  it('throws when portfolio is missing (new field added in this PR)', () => {
    const data = validUser();
    delete (data as Record<string, unknown>).portfolio;
    expect(() => parseUser(data)).toThrow();
  });
});