/**
 * Tests for fools/files.ts
 *
 * Covers the PR changes to UserSchema:
 * - status field changed from z.literal([...]) to z.enum([...])
 * - website field removed
 * - websiteUrl, portfolio, siteUrls, format fields added
 * - parseUser() error handling
 */

import { UserSchema, parseUser, type User } from './files';

// ---------------------------------------------------------------------------
// Shared valid base input — satisfies all required fields after PR changes
// ---------------------------------------------------------------------------
function validUserInput(): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2023-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: 'https://site1.com https://site2.com',
    format: 'json',
  };
}

describe('UserSchema — status field (changed from z.literal to z.enum)', () => {
  it('accepts "active" as status', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts "inactive" as status', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts "banned" as status', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), status: 'banned' });
    expect(result.success).toBe(true);
  });

  it('rejects unknown status value', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as status', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing status field', () => {
    const input = validUserInput();
    delete input['status'];
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — websiteUrl field (new)', () => {
  it('accepts a valid HTTPS URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), websiteUrl: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid HTTP URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), websiteUrl: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing websiteUrl field', () => {
    const input = validUserInput();
    delete input['websiteUrl'];
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — portfolio field (new)', () => {
  it('accepts a valid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), portfolio: 'https://portfolio.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for portfolio', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), portfolio: 'just-text' });
    expect(result.success).toBe(false);
  });

  it('rejects missing portfolio field', () => {
    const input = validUserInput();
    delete input['portfolio'];
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — siteUrls field (new, z.urls())', () => {
  it('accepts a valid space-separated URL string for siteUrls', () => {
    const result = UserSchema.safeParse({
      ...validUserInput(),
      siteUrls: 'https://site1.com https://site2.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a single URL for siteUrls', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), siteUrls: 'https://single.com' });
    expect(result.success).toBe(true);
  });

  it('rejects missing siteUrls field', () => {
    const input = validUserInput();
    delete input['siteUrls'];
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — format field (new)', () => {
  it('accepts any non-empty string for format', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for format (plain z.string() has no min constraint)', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects missing format field', () => {
    const input = validUserInput();
    delete input['format'];
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema — website field (removed)', () => {
  it('parses successfully without a website field', () => {
    const input = validUserInput();
    // Confirm no website field needed
    expect('website' in input).toBe(false);
    const result = UserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('ignores an extra website field gracefully (z.object strips unknown keys)', () => {
    const result = UserSchema.safeParse({
      ...validUserInput(),
      website: 'https://extra.com',
    });
    // z.object() strips unknown keys and succeeds
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['website']).toBeUndefined();
    }
  });
});

describe('UserSchema — pre-existing fields still work correctly', () => {
  it('accepts a valid complete user object', () => {
    const result = UserSchema.safeParse(validUserInput());
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for id', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), age: 17 });
    expect(result.success).toBe(false);
  });

  it('accepts age exactly 18', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), age: 18 });
    expect(result.success).toBe(true);
  });

  it('coerces string age to number', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), age: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });

  it('accepts valid stringbool values for active', () => {
    for (const val of ['true', 'false', '1', '0', 'yes', 'no']) {
      const result = UserSchema.safeParse({ ...validUserInput(), active: val });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid stringbool value for active', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), active: 'maybe' });
    expect(result.success).toBe(false);
  });

  it('accepts valid role enum values', () => {
    for (const role of ['admin', 'user', 'manager']) {
      const result = UserSchema.safeParse({ ...validUserInput(), role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid role value', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), role: 'superuser' });
    expect(result.success).toBe(false);
  });

  it('accepts valid template literal code (user-<number>)', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), code: 'user-1234' });
    expect(result.success).toBe(true);
  });

  it('rejects code not matching template literal', () => {
    const result = UserSchema.safeParse({ ...validUserInput(), code: 'admin-1234' });
    expect(result.success).toBe(false);
  });

  it('accepts profile without optional bio', () => {
    const result = UserSchema.safeParse({
      ...validUserInput(),
      profile: { joined: new Date('2023-01-01') },
    });
    expect(result.success).toBe(true);
  });

  it('rejects extra properties in strictObject profile', () => {
    const result = UserSchema.safeParse({
      ...validUserInput(),
      profile: { bio: 'hi', joined: new Date(), unexpected: 'value' },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseUser()', () => {
  it('returns parsed user data for valid input', () => {
    const input = validUserInput();
    const user = parseUser(input);
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
    expect(user.status).toBe('active');
    expect(user.format).toBe('json');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ ...validUserInput(), email: 'not-an-email' })).toThrow(Error);
  });

  it('throws an Error containing JSON when validation fails', () => {
    try {
      parseUser({ ...validUserInput(), age: 10 });
      fail('Expected parseUser to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      // The error message should be a JSON representation of the tree
      const msg = (e as Error).message;
      expect(() => JSON.parse(msg)).not.toThrow();
    }
  });

  it('throws for completely empty input', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws for null input', () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it('infers correct TypeScript type — data.websiteUrl is a string', () => {
    const user: User = parseUser(validUserInput());
    expect(typeof user.websiteUrl).toBe('string');
    expect(typeof user.portfolio).toBe('string');
    expect(typeof user.format).toBe('string');
    expect(typeof user.status).toBe('string');
  });
});