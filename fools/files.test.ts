import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser } from './files';

// A fully-valid user object matching the current UserSchema definition
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://alice.example.com',
  portfolio: 'https://portfolio.alice.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'standard',
};

describe('UserSchema – valid data', () => {
  it('accepts a fully valid user object', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('accepts all valid status enum values', () => {
    for (const status of ['active', 'inactive', 'banned'] as const) {
      const result = UserSchema.safeParse({ ...validUser, status });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid role enum values', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = UserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all truthy stringbool values for active', () => {
    for (const active of ['true', '1', 'yes']) {
      const result = UserSchema.safeParse({ ...validUser, active });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all falsy stringbool values for active', () => {
    for (const active of ['false', '0', 'no']) {
      const result = UserSchema.safeParse({ ...validUser, active });
      expect(result.success).toBe(true);
    }
  });

  it('accepts age exactly 18 (boundary)', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it('accepts profile with no bio (optional field)', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { joined: new Date('2023-01-01') },
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty siteUrls array', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('accepts a single-element siteUrls array', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: ['https://only-site.com'] });
    expect(result.success).toBe(true);
  });

  it('coerces string age to number', () => {
    const result = UserSchema.safeParse({ ...validUser, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });
});

describe('UserSchema – id field', () => {
  it('rejects a non-UUID id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing id', () => {
    const { id: _id, ...noId } = validUser;
    const result = UserSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – email field', () => {
  it('rejects an invalid email', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const { email: _email, ...noEmail } = validUser;
    const result = UserSchema.safeParse(noEmail);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – age field', () => {
  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('rejects age of 0', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric string age', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 'twenty' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – status field (changed from z.literal to z.enum)', () => {
  it('rejects an invalid status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing status', () => {
    const { status: _status, ...noStatus } = validUser;
    const result = UserSchema.safeParse(noStatus);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – websiteUrl field (new field)', () => {
  it('rejects an invalid websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing websiteUrl', () => {
    const { websiteUrl: _w, ...noWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(noWebsiteUrl);
    expect(result.success).toBe(false);
  });

  it('accepts an https URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://my-site.io' });
    expect(result.success).toBe(true);
  });
});

describe('UserSchema – portfolio field (new field)', () => {
  it('rejects an invalid portfolio URL', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'just-a-string' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing portfolio', () => {
    const { portfolio: _p, ...noPortfolio } = validUser;
    const result = UserSchema.safeParse(noPortfolio);
    expect(result.success).toBe(false);
  });

  it('accepts a valid https URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://portfolio.dev' });
    expect(result.success).toBe(true);
  });
});

describe('UserSchema – siteUrls field (new field)', () => {
  it('rejects a siteUrls array containing an invalid URL', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      siteUrls: ['https://valid.com', 'not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-array siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUser, siteUrls: 'https://site.com' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing siteUrls', () => {
    const { siteUrls: _s, ...noSiteUrls } = validUser;
    const result = UserSchema.safeParse(noSiteUrls);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – format field (new field)', () => {
  it('accepts any non-empty string for format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format', () => {
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing format field', () => {
    const { format: _f, ...noFormat } = validUser;
    const result = UserSchema.safeParse(noFormat);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – profile strict object', () => {
  it('rejects extra fields on profile (strict object)', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { bio: 'hi', joined: new Date(), extraField: 'not-allowed' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing joined date in profile', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { bio: 'hello' },
    });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – code template literal', () => {
  it('accepts valid code like user-1', () => {
    const result = UserSchema.safeParse({ ...validUser, code: 'user-1' });
    expect(result.success).toBe(true);
  });

  it('accepts valid code at boundary user-9999', () => {
    const result = UserSchema.safeParse({ ...validUser, code: 'user-9999' });
    expect(result.success).toBe(true);
  });

  it('rejects code without user- prefix', () => {
    const result = UserSchema.safeParse({ ...validUser, code: 'admin-42' });
    expect(result.success).toBe(false);
  });
});

describe('parseUser', () => {
  it('returns typed user data for valid input', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('alice@example.com');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://alice.example.com');
    expect(user.portfolio).toBe('https://portfolio.alice.com');
    expect(user.siteUrls).toEqual(['https://site1.com', 'https://site2.com']);
    expect(user.format).toBe('standard');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({ email: 'bad', age: 5 })).toThrow();
  });

  it('throws with a stringified error for invalid input', () => {
    expect(() => parseUser(null)).toThrow();
  });

  it('throws when status is an invalid enum value', () => {
    expect(() => parseUser({ ...validUser, status: 'unknown_status' })).toThrow();
  });

  it('throws when websiteUrl is missing', () => {
    const { websiteUrl: _w, ...noUrl } = validUser;
    expect(() => parseUser(noUrl)).toThrow();
  });
});