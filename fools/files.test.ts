import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser, type User } from './files';

// Minimal valid input that satisfies every field in UserSchema
const validBase: unknown = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: '25',          // coerce.number accepts strings
  active: 'true',     // stringbool
  role: 'user',
  status: 'active',
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
  format: 'markdown',
};

// ---------------------------------------------------------------------------
// UserSchema – complete valid object
// ---------------------------------------------------------------------------
describe('UserSchema – valid data', () => {
  it('accepts a fully valid object', () => {
    const result = UserSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('infers the correct TypeScript shape on success', () => {
    const result = UserSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      const data: User = result.data;
      expect(data.email).toBe('user@example.com');
      expect(data.format).toBe('markdown');
    }
  });
});

// ---------------------------------------------------------------------------
// status field – changed from z.literal to z.enum in this PR
// ---------------------------------------------------------------------------
describe('UserSchema – status field (z.enum)', () => {
  it('accepts "active"', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts "inactive"', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts "banned"', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'banned' });
    expect(result.success).toBe(true);
  });

  it('rejects an unlisted status value', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 'suspended' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string for status', () => {
    const result = UserSchema.safeParse({ ...validBase, status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status value', () => {
    const result = UserSchema.safeParse({ ...validBase, status: 1 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl field – new URL field added in this PR
// ---------------------------------------------------------------------------
describe('UserSchema – websiteUrl field (new)', () => {
  it('accepts a valid https URL', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'https://my-site.io' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid http URL', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'http://example.com/path?q=1' });
    expect(result.success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string as websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validBase, websiteUrl: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing websiteUrl field', () => {
    const { websiteUrl: _removed, ...rest } = validBase as Record<string, unknown>;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// portfolio field – new URL field added in this PR
// ---------------------------------------------------------------------------
describe('UserSchema – portfolio field (new)', () => {
  it('accepts a valid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validBase, portfolio: 'https://github.com/user' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string for portfolio', () => {
    const result = UserSchema.safeParse({ ...validBase, portfolio: 'github.com/user' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing portfolio field', () => {
    const { portfolio: _removed, ...rest } = validBase as Record<string, unknown>;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// siteUrls field – new z.urls() field added in this PR
// ---------------------------------------------------------------------------
describe('UserSchema – siteUrls field (new)', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      siteUrls: ['https://a.example.com', 'https://b.example.com'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a single valid URL in the array', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      siteUrls: ['https://single.example.com'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      siteUrls: ['https://valid.com', 'not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing siteUrls field', () => {
    const { siteUrls: _removed, ...rest } = validBase as Record<string, unknown>;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// format field – new z.string() field added in this PR
// ---------------------------------------------------------------------------
describe('UserSchema – format field (new)', () => {
  it('accepts any non-empty string for format', () => {
    const result = UserSchema.safeParse({ ...validBase, format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format (z.string has no min)', () => {
    const result = UserSchema.safeParse({ ...validBase, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing format field', () => {
    const { format: _removed, ...rest } = validBase as Record<string, unknown>;
    const result = UserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a numeric format value', () => {
    const result = UserSchema.safeParse({ ...validBase, format: 42 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// website field – removed in this PR; schema must NOT accept it as required
// ---------------------------------------------------------------------------
describe('UserSchema – website field (removed in this PR)', () => {
  it('still validates successfully when no website field is provided', () => {
    // The old schema had `website` as required; its removal means the schema
    // is valid without it.  Make sure the current schema parses without it.
    const result = UserSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// role field (unchanged but covered for completeness)
// ---------------------------------------------------------------------------
describe('UserSchema – role field', () => {
  it('accepts "admin"', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('accepts "manager"', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'manager' });
    expect(result.success).toBe(true);
  });

  it('rejects an unlisted role', () => {
    const result = UserSchema.safeParse({ ...validBase, role: 'superadmin' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// age field – coercion
// ---------------------------------------------------------------------------
describe('UserSchema – age coercion', () => {
  it('coerces a string age to a number', () => {
    const result = UserSchema.safeParse({ ...validBase, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects an age below 18', () => {
    const result = UserSchema.safeParse({ ...validBase, age: 16 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// profile – strictObject (no extra keys allowed)
// ---------------------------------------------------------------------------
describe('UserSchema – profile strictObject', () => {
  it('rejects profile with extra keys', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      profile: {
        bio: 'bio',
        joined: new Date('2024-01-01'),
        extraField: 'not allowed',
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts profile with only required joined field', () => {
    const result = UserSchema.safeParse({
      ...validBase,
      profile: { joined: new Date('2024-01-01') },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper function
// ---------------------------------------------------------------------------
describe('parseUser', () => {
  it('returns the parsed User when input is valid', () => {
    const user = parseUser(validBase);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
  });

  it('throws an Error when input is invalid', () => {
    expect(() =>
      parseUser({ ...validBase, status: 'unknown_status' })
    ).toThrow(Error);
  });

  it('throws an Error when required fields are missing', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('error message is a JSON string (v4 treeify format)', () => {
    try {
      parseUser({ ...validBase, email: 'not-an-email' });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(() => JSON.parse((e as Error).message)).not.toThrow();
    }
  });
});