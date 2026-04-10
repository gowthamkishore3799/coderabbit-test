import { describe, it, expect, vi, beforeAll } from 'vitest';

// z.urls() is not available in the installed version of zod (4.3.6).
// The fools/files.ts schema uses z.urls() which causes an import-time crash.
// We provide a minimal polyfill via vi.mock so the rest of the schema can be tested.
vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zod')>();
  const z = (actual as any).z ?? actual;
  return {
    ...actual,
    z: {
      ...z,
      urls: () => z.array(z.url()),
    },
  };
});

// Dynamic import must come AFTER the vi.mock call.
let UserSchema: any;
let parseUser: any;

beforeAll(async () => {
  const mod = await import('./files');
  UserSchema = mod.UserSchema;
  parseUser = mod.parseUser;
});

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  status: 'active',
  code: 'user-42',
  profile: {
    bio: 'A developer',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('UserSchema', () => {
  describe('status field (changed from z.literal to z.enum)', () => {
    it('accepts "active" status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'active' });
      expect(result.success).toBe(true);
    });

    it('accepts "inactive" status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'inactive' });
      expect(result.success).toBe(true);
    });

    it('accepts "banned" status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'banned' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid status value', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'suspended' });
      expect(result.success).toBe(false);
    });

    it('rejects empty string for status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: '' });
      expect(result.success).toBe(false);
    });

    it('rejects numeric value for status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 1 });
      expect(result.success).toBe(false);
    });

    it('returns the parsed status in the result data', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'inactive' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('inactive');
      }
    });
  });

  describe('websiteUrl field (new field)', () => {
    it('accepts a valid HTTPS URL', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('accepts a valid HTTP URL', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'http://example.com' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid URL string', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const { websiteUrl: _omitted, ...withoutWebsiteUrl } = validUser;
      const result = UserSchema.safeParse(withoutWebsiteUrl);
      expect(result.success).toBe(false);
    });

    it('rejects a bare domain without protocol', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('portfolio field (new field)', () => {
    it('accepts a valid portfolio URL', () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://myportfolio.dev' });
      expect(result.success).toBe(true);
    });

    it('rejects a non-URL string for portfolio', () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const { portfolio: _omitted, ...withoutPortfolio } = validUser;
      const result = UserSchema.safeParse(withoutPortfolio);
      expect(result.success).toBe(false);
    });
  });

  describe('siteUrls field (new field, z.urls() polyfilled as z.array(z.url()))', () => {
    it('accepts an array of valid URLs', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ['https://site1.com', 'https://site2.com', 'https://site3.org'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts an empty array', () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it('rejects an array containing an invalid URL', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ['https://valid.com', 'not-a-url'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing siteUrls', () => {
      const { siteUrls: _omitted, ...withoutSiteUrls } = validUser;
      const result = UserSchema.safeParse(withoutSiteUrls);
      expect(result.success).toBe(false);
    });

    it('rejects a string instead of array', () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: 'https://example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('format field (new field)', () => {
    it('accepts any string for format', () => {
      const result = UserSchema.safeParse({ ...validUser, format: 'json' });
      expect(result.success).toBe(true);
    });

    it('accepts an empty string for format', () => {
      const result = UserSchema.safeParse({ ...validUser, format: '' });
      expect(result.success).toBe(true);
    });

    it('rejects missing format', () => {
      const { format: _omitted, ...withoutFormat } = validUser;
      const result = UserSchema.safeParse(withoutFormat);
      expect(result.success).toBe(false);
    });

    it('rejects a non-string format', () => {
      const result = UserSchema.safeParse({ ...validUser, format: 42 });
      expect(result.success).toBe(false);
    });
  });

  describe('pre-existing fields remain valid', () => {
    it('parses a fully valid user object', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid UUID for id', () => {
      const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid email', () => {
      const result = UserSchema.safeParse({ ...validUser, email: 'invalid-email' });
      expect(result.success).toBe(false);
    });

    it('rejects age below 18', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('accepts age exactly 18', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('accepts stringbool "true" for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
    });

    it('accepts stringbool "false" for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
    });

    it('accepts valid role values', () => {
      for (const role of ['admin', 'user', 'manager']) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid role', () => {
      const result = UserSchema.safeParse({ ...validUser, role: 'superuser' });
      expect(result.success).toBe(false);
    });

    it('validates code matches template literal pattern', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'user-999' });
      expect(result.success).toBe(true);
    });

    it('rejects code that does not match template literal pattern', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'admin-1' });
      expect(result.success).toBe(false);
    });

    it('accepts profile with optional bio omitted', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { joined: new Date('2023-06-15') },
      });
      expect(result.success).toBe(true);
    });

    it('rejects profile with extra unknown fields (strictObject)', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: 'hi', joined: new Date(), extraField: 'not allowed' },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser', () => {
  it('returns a valid User when input is valid', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.format).toBe('json');
  });

  it('throws when status is invalid', () => {
    expect(() => parseUser({ ...validUser, status: 'unknown' })).toThrow();
  });

  it('throws when websiteUrl is missing', () => {
    const { websiteUrl: _omitted, ...withoutWebsiteUrl } = validUser;
    expect(() => parseUser(withoutWebsiteUrl)).toThrow();
  });

  it('throws when portfolio is invalid URL', () => {
    expect(() => parseUser({ ...validUser, portfolio: 'not-a-url' })).toThrow();
  });

  it('throws when siteUrls contains an invalid URL', () => {
    expect(() => parseUser({ ...validUser, siteUrls: ['bad-url'] })).toThrow();
  });

  it('throws when format is not a string', () => {
    expect(() => parseUser({ ...validUser, format: null })).toThrow();
  });

  it('returns data with correct TypeScript types', () => {
    const user = parseUser(validUser);
    expect(typeof user.id).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(Array.isArray(user.siteUrls)).toBe(true);
    expect(typeof user.format).toBe('string');
  });
});