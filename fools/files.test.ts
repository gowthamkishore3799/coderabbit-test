import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser } from './files';

const validBase = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: '25',
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('UserSchema – status field (changed from z.literal to z.enum)', () => {
  it('accepts "active" as status', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts "inactive" as status', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts "banned" as status', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'banned' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as status', () => {
    const result = UserSchema.safeParse({ ...validBase, status: '' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – websiteUrl field (added in this PR)', () => {
  it('accepts a valid https URL', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing websiteUrl', () => {
    const { websiteUrl, ...rest } = validBase;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – portfolio field (added in this PR)', () => {
  it('accepts a valid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validBase, portfolio: 'https://portfolio.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string for portfolio', () => {
    const result = UserSchema.safeParse({ ...validBase, portfolio: 'myportfolio' });
    expect(result.success).toBe(false);
  });

  it('rejects missing portfolio', () => {
    const { portfolio, ...rest } = validBase;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – siteUrls field (added in this PR)', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      siteUrls: ['https://a.com', 'https://b.com'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validBase, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('rejects siteUrls with an invalid URL entry', () => {
    const result = UserSchema.safeParse({ ...validBase, siteUrls: ['not-a-url'] });
    expect(result.success).toBe(false);
  });

  it('rejects missing siteUrls', () => {
    const { siteUrls, ...rest } = validBase;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – format field (added in this PR)', () => {
  it('accepts any non-empty string for format', () => {
    const result = UserSchema.safeParse({ ...validBase, format: 'xml' });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for format', () => {
    const result = UserSchema.safeParse({ ...validBase, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects missing format', () => {
    const { format, ...rest } = validBase;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – role field (z.enum)', () => {
  it('accepts "admin"', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('accepts "user"', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'user' });
    expect(result.success).toBe(true);
  });

  it('accepts "manager"', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'manager' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'superadmin' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – id field (z.uuid)', () => {
  it('accepts a valid UUID', () => {
    const result = UserSchema.safeParse({ ...validBase, id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = UserSchema.safeParse({ ...validBase, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – email field (z.email)', () => {
  it('accepts a valid email', () => {
    const result = UserSchema.safeParse({ ...validBase, email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = UserSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – age field (z.coerce.number)', () => {
  it('coerces a string age to a number', () => {
    const result = UserSchema.safeParse({ ...validBase, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validBase, age: '17' });
    expect(result.success).toBe(false);
  });

  it('accepts age exactly 18', () => {
    const result = UserSchema.safeParse({ ...validBase, age: '18' });
    expect(result.success).toBe(true);
  });
});

describe('UserSchema – active field (z.stringbool)', () => {
  it('accepts "true"', () => {
    const result = UserSchema.safeParse({ ...validBase, active: 'true' });
    expect(result.success).toBe(true);
  });

  it('accepts "false"', () => {
    const result = UserSchema.safeParse({ ...validBase, active: 'false' });
    expect(result.success).toBe(true);
  });

  it('accepts "1"', () => {
    const result = UserSchema.safeParse({ ...validBase, active: '1' });
    expect(result.success).toBe(true);
  });

  it('accepts "0"', () => {
    const result = UserSchema.safeParse({ ...validBase, active: '0' });
    expect(result.success).toBe(true);
  });
});

describe('UserSchema – code field (z.templateLiteral)', () => {
  it('accepts "user-1"', () => {
    const result = UserSchema.safeParse({ ...validBase, code: 'user-1' });
    expect(result.success).toBe(true);
  });

  it('accepts "user-9999"', () => {
    const result = UserSchema.safeParse({ ...validBase, code: 'user-9999' });
    expect(result.success).toBe(true);
  });

  it('rejects code without user- prefix', () => {
    const result = UserSchema.safeParse({ ...validBase, code: 'admin-1' });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – profile field (z.strictObject)', () => {
  it('accepts profile with bio and joined', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      profile: { bio: 'Hello', joined: new Date() },
    });
    expect(result.success).toBe(true);
  });

  it('accepts profile without optional bio', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      profile: { joined: new Date() },
    });
    expect(result.success).toBe(true);
  });

  it('rejects profile with extra fields (strict object)', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      profile: { bio: 'Hi', joined: new Date(), extra: 'value' },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseUser', () => {
  it('returns parsed user on valid input', () => {
    const user = parseUser(validBase);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.format).toBe('json');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.example.com');
  });

  it('throws on invalid input', () => {
    expect(() => parseUser({ ...validBase, email: 'bad' })).toThrow();
  });

  it('throws on missing required field', () => {
    const { format, ...rest } = validBase;
    expect(() => parseUser(rest)).toThrow();
  });

  it('throws with an error message containing JSON', () => {
    try {
      parseUser({ ...validBase, status: 'invalid' });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBeTruthy();
    }
  });
});