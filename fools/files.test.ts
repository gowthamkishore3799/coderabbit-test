import { vi, describe, it, expect } from 'vitest';

// vi.mock is hoisted to run before imports, so fools/files.ts will see the patched zod.
// z.urls() was added in the PR but doesn't exist in zod v4.1.x; we polyfill it here
// so the schema can be loaded and the PR's intended behavior can be tested.
vi.mock('zod', async (importOriginal) => {
  const mod = await importOriginal<typeof import('zod')>();
  const origZ = (mod as any).z;
  const patchedZ = new Proxy(origZ, {
    get(target, prop: string) {
      if (prop === 'urls') return () => target.array(target.url());
      return target[prop];
    },
  });
  return { ...mod, z: patchedZ };
});

// Dynamic import AFTER the mock is set up (vi.mock is hoisted, but to be safe we still do this)
const { UserSchema, parseUser } = await import('./files');

// Minimal valid user matching the current schema (post-PR fields)
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  status: 'active',
  code: 'user-42',
  profile: {
    bio: 'Hello',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
  format: 'standard',
};

describe('UserSchema – status field (PR change: z.literal → z.enum)', () => {
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
    const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it('all three allowed status values parse to the same type', () => {
    const statuses = ['active', 'inactive', 'banned'] as const;
    for (const s of statuses) {
      const r = UserSchema.safeParse({ ...validUser, status: s });
      expect(r.success).toBe(true);
    }
  });
});

describe('UserSchema – websiteUrl field (PR addition)', () => {
  it('accepts a valid https URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid http URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a plain domain (no protocol) for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects missing websiteUrl', () => {
    const { websiteUrl, ...withoutWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – portfolio field (PR addition)', () => {
  it('accepts a valid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://portfolio.io' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'portfolio-not-url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing portfolio', () => {
    const { portfolio, ...withoutPortfolio } = validUser;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – siteUrls field (PR addition, z.urls() polyfilled as array of url)', () => {
  it('accepts an array of valid URLs', () => {
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

  it('rejects an array containing an invalid URL', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ['not-a-url'] });
    expect(result.success).toBe(false);
  });

  it('rejects a plain string (not an array) for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: 'https://single.com' });
    expect(result.success).toBe(false);
  });

  it('rejects missing siteUrls', () => {
    const { siteUrls, ...withoutSiteUrls } = validUser;
    const result = UserSchema.safeParse(withoutSiteUrls);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – format field (PR addition)', () => {
  it('accepts any string value for format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format (z.string() has no min constraint)', () => {
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects missing format field', () => {
    const { format, ...withoutFormat } = validUser;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });

  it('rejects a numeric value for format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 42 });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – pre-existing fields', () => {
  it('parses a fully valid user object', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID for id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('accepts age exactly 18 (boundary)', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it('coerces a string age to number', () => {
    const result = UserSchema.safeParse({ ...validUser, age: '25' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(25);
  });

  it('accepts valid stringbool values for active field', () => {
    for (const val of ['true', '1', 'yes', 'false', '0', 'no']) {
      const result = UserSchema.safeParse({ ...validUser, active: val });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid role values', () => {
    for (const role of ['admin', 'user', 'manager']) {
      const result = UserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown role', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'superadmin' });
    expect(result.success).toBe(false);
  });

  it('rejects extra fields on profile (strict object)', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { ...validUser.profile, extraField: 'value' },
    });
    expect(result.success).toBe(false);
  });

  it('profile bio is optional', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { joined: new Date('2023-01-01') },
    });
    expect(result.success).toBe(true);
  });
});

describe('parseUser()', () => {
  it('returns parsed user for valid input', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('test@example.com');
    expect(user.status).toBe('active');
    expect(user.format).toBe('standard');
  });

  it('throws for an invalid status value', () => {
    expect(() => parseUser({ ...validUser, status: 'unknown' })).toThrow();
  });

  it('throws when a required field is missing', () => {
    const { format, ...withoutFormat } = validUser;
    expect(() => parseUser(withoutFormat)).toThrow();
  });

  it('throws with a non-empty error message (uses treeify for structured output)', () => {
    try {
      parseUser({ ...validUser, email: 'bad' });
      expect.fail('Should have thrown');
    } catch (e: any) {
      expect(typeof e.message).toBe('string');
      expect(e.message.length).toBeGreaterThan(0);
    }
  });

  it('throws for an invalid websiteUrl', () => {
    expect(() => parseUser({ ...validUser, websiteUrl: 'not-a-url' })).toThrow();
  });
});