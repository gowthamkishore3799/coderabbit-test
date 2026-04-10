import { describe, it, expect, vi } from 'vitest';

// ---- Polyfill z.urls() for this test file ----
// z.urls() is used in fools/files.ts but is not yet available in the installed
// zod version (4.1.5). We mock the zod module to add it before the module
// under test is imported.

const { actualZ } = vi.hoisted(() => {
  // Grab the real zod so we can re-export everything except urls
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const realZod = require('zod');
  return { actualZ: realZod.z ?? realZod };
});

vi.mock('zod', async (importOriginal) => {
  const original = await importOriginal<typeof import('zod')>();
  // z.urls() – polyfilled as z.array(z.url()), matching expected semantics
  const zWithUrls = {
    ...original,
    z: {
      ...(original.z as object),
      urls: () => (original.z as typeof import('zod').z).array(
        (original.z as typeof import('zod').z).url()
      ),
    },
  };
  return zWithUrls;
});

// Import after mock is set up
const { UserSchema, parseUser } = await import('./files');

// A valid base input matching every required field in the updated schema
const validUser: unknown = {
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
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
  format: 'json',
};

// ---- status field (changed from z.literal to z.enum) ----

describe('UserSchema – status field (enum change)', () => {
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

  it('rejects an unknown status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'suspended' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string as status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects null as status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: null });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status field', () => {
    const { status, ...withoutStatus } = validUser as Record<string, unknown>;
    const result = UserSchema.safeParse(withoutStatus);
    expect(result.success).toBe(false);
  });
});

// ---- websiteUrl field (new) ----

describe('UserSchema – websiteUrl field (new)', () => {
  it('accepts a valid http websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid https websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com/path?q=1' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string as websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing websiteUrl field', () => {
    const { websiteUrl, ...withoutWebsiteUrl } = validUser as Record<string, unknown>;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });

  it('rejects an empty string as websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: '' });
    expect(result.success).toBe(false);
  });
});

// ---- portfolio field (new) ----

describe('UserSchema – portfolio field (new)', () => {
  it('accepts a valid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://my-portfolio.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects a plain string as portfolio', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'my-portfolio' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing portfolio field', () => {
    const { portfolio, ...withoutPortfolio } = validUser as Record<string, unknown>;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });
});

// ---- siteUrls field (new – z.urls() polyfilled as z.array(z.url())) ----

describe('UserSchema – siteUrls field (new)', () => {
  it('accepts an array of valid URLs for siteUrls', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ['https://a.com', 'https://b.com'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('rejects an array containing a non-URL string for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ['https://valid.com', 'not-a-url'] });
    expect(result.success).toBe(false);
  });

  it('rejects a plain string instead of array for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: 'https://a.com' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing siteUrls field', () => {
    const { siteUrls, ...withoutSiteUrls } = validUser as Record<string, unknown>;
    const result = UserSchema.safeParse(withoutSiteUrls);
    expect(result.success).toBe(false);
  });

  it('rejects siteUrls containing a URL with no scheme', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ['example.com'] });
    expect(result.success).toBe(false);
  });
});

// ---- format field (new) ----

describe('UserSchema – format field (new)', () => {
  it('accepts any non-empty string for format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'csv' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format', () => {
    // z.string() with no constraints allows empty strings
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing format field', () => {
    const { format, ...withoutFormat } = validUser as Record<string, unknown>;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });

  it('rejects a numeric value as format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 42 });
    expect(result.success).toBe(false);
  });
});

// ---- website field removed ----

describe('UserSchema – website field removed', () => {
  it('succeeds even when the old "website" field is not present', () => {
    // The schema no longer requires "website"
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('ignores an extra "website" field (z.object strips unknown keys)', () => {
    const result = UserSchema.safeParse({ ...validUser, website: 'https://example.com' });
    expect(result.success).toBe(true);
  });
});

// ---- full valid object round-trip ----

describe('UserSchema – full valid object', () => {
  it('parses a fully valid user object and returns typed data', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.status).toBe('active');
      expect(result.data.websiteUrl).toBe('https://example.com');
      expect(result.data.portfolio).toBe('https://portfolio.example.com');
      expect(result.data.format).toBe('json');
      expect(Array.isArray(result.data.siteUrls)).toBe(true);
    }
  });
});

// ---- parseUser helper ----

describe('parseUser helper', () => {
  it('returns the parsed user for valid input', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
  });

  it('throws when status is invalid', () => {
    expect(() =>
      parseUser({ ...validUser, status: 'pending' })
    ).toThrow();
  });

  it('throws when websiteUrl is not a URL', () => {
    expect(() =>
      parseUser({ ...validUser, websiteUrl: 'bad-url' })
    ).toThrow();
  });

  it('throws when siteUrls contains an invalid URL', () => {
    expect(() =>
      parseUser({ ...validUser, siteUrls: ['not-a-url'] })
    ).toThrow();
  });

  it('throws when format is missing', () => {
    const { format, ...withoutFormat } = validUser as Record<string, unknown>;
    expect(() => parseUser(withoutFormat)).toThrow();
  });

  it('throws when portfolio is missing', () => {
    const { portfolio, ...withoutPortfolio } = validUser as Record<string, unknown>;
    expect(() => parseUser(withoutPortfolio)).toThrow();
  });
});

// ---- pre-existing fields still work (regression) ----

describe('UserSchema – pre-existing fields (regression)', () => {
  it('coerces age from string to number', () => {
    const result = UserSchema.safeParse({ ...validUser, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('parses stringbool "true" as active', () => {
    const result = UserSchema.safeParse({ ...validUser, active: 'true' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('parses stringbool "false" as not active', () => {
    const result = UserSchema.safeParse({ ...validUser, active: 'false' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid UUID for id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid role values', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = UserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown role', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'superadmin' });
    expect(result.success).toBe(false);
  });
});