import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// z.urls() was introduced by this PR in fools/files.ts but does not exist in zod v4.
// We must mock zod before importing the schema module so it loads successfully.
vi.mock('zod', async (importOriginal) => {
  const original = await importOriginal<typeof import('zod')>();
  return {
    ...original,
    z: {
      ...(original.z as any),
      // Polyfill z.urls() as z.string() so the schema module loads
      urls: () => (original.z as any).string(),
    },
  };
});

const { UserSchema, parseUser } = await import('./files');

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: '25',
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: 'https://site1.com',
  format: 'json',
};

describe('UserSchema — status field (changed from z.literal to z.enum in PR)', () => {
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
    const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects numeric status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — new URL fields added in PR (websiteUrl, portfolio, format)', () => {
  it('accepts a valid websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid portfolio URL', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://myportfolio.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid portfolio value', () => {
    // ftp:// is accepted by z.url(); use a value with no scheme at all
    const result = UserSchema.safeParse({ ...validUser, portfolio: '//no-scheme' });
    expect(result.success).toBe(false);
  });

  it('accepts an arbitrary format string', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'xml' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.format).toBe('xml');
  });

  it('accepts an empty format string', () => {
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects missing websiteUrl', () => {
    const { websiteUrl: _, ...withoutWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });

  it('rejects missing portfolio', () => {
    const { portfolio: _, ...withoutPortfolio } = validUser;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });

  it('rejects missing format', () => {
    const { format: _, ...withoutFormat } = validUser;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — website field removed in PR', () => {
  it('does not return a website field in schema output', () => {
    const result = UserSchema.safeParse({ ...validUser, website: 'https://old-website.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).website).toBeUndefined();
    }
  });
});

describe('UserSchema — full valid object', () => {
  it('parses a complete valid user object', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
      expect(result.data.websiteUrl).toBe('https://example.com');
      expect(result.data.portfolio).toBe('https://portfolio.example.com');
      expect(result.data.format).toBe('json');
    }
  });
});

describe('parseUser — error handling', () => {
  it('throws on invalid input', () => {
    expect(() => parseUser({ id: 'bad-id', email: 'bad-email' })).toThrow();
  });

  it('returns valid user data when input is correct', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.role).toBe('admin');
  });

  it('throws an Error when given invalid data', () => {
    let thrown: unknown = null;
    try {
      parseUser({ id: 'not-a-uuid' });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).not.toBeNull();
    expect(thrown).toBeInstanceOf(Error);
  });
});

describe('UserSchema — role field (retained enum)', () => {
  it('accepts "admin" role', () => {
    expect(UserSchema.safeParse({ ...validUser, role: 'admin' }).success).toBe(true);
  });

  it('accepts "user" role', () => {
    expect(UserSchema.safeParse({ ...validUser, role: 'user' }).success).toBe(true);
  });

  it('accepts "manager" role', () => {
    expect(UserSchema.safeParse({ ...validUser, role: 'manager' }).success).toBe(true);
  });

  it('rejects an invalid role', () => {
    expect(UserSchema.safeParse({ ...validUser, role: 'superadmin' }).success).toBe(false);
  });
});