import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// Valid base input for the User schema in fools/file.ts
const validUser: unknown = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  website: 'https://example.com',
  websites: ['https://site1.example.com', 'https://site2.example.com'],
  trail: 'https://trail.example.com',
  trails: 'some-trail-value',
};

describe('User schema (fools/file.ts) – schema is syntactically valid and functional', () => {
  it('parses a fully valid user object', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('returns typed data for a valid input', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.active).toBe(true);
    }
  });
});

describe('User schema – id field', () => {
  it('accepts a valid UUID', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing id', () => {
    const { id, ...noId } = validUser as Record<string, unknown>;
    const result = User.safeParse(noId);
    expect(result.success).toBe(false);
  });
});

describe('User schema – email field', () => {
  it('accepts a valid email', () => {
    const result = User.safeParse({ ...validUser, email: 'hello@world.io' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = User.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const { email, ...noEmail } = validUser as Record<string, unknown>;
    const result = User.safeParse(noEmail);
    expect(result.success).toBe(false);
  });
});

describe('User schema – age field (coerced)', () => {
  it('accepts a numeric age above 18', () => {
    const result = User.safeParse({ ...validUser, age: 20 });
    expect(result.success).toBe(true);
  });

  it('accepts age as a numeric string (coercion)', () => {
    const result = User.safeParse({ ...validUser, age: '21' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(21);
  });

  it('rejects age below 18', () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('rejects exactly 17', () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 18', () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });
});

describe('User schema – active field (stringbool)', () => {
  it('parses "true" as boolean true', () => {
    const result = User.safeParse({ ...validUser, active: 'true' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('parses "false" as boolean false', () => {
    const result = User.safeParse({ ...validUser, active: 'false' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it('parses "1" as boolean true', () => {
    const result = User.safeParse({ ...validUser, active: '1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('parses "0" as boolean false', () => {
    const result = User.safeParse({ ...validUser, active: '0' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });
});

describe('User schema – role field', () => {
  it('accepts "admin"', () => {
    const result = User.safeParse({ ...validUser, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('accepts "user"', () => {
    const result = User.safeParse({ ...validUser, role: 'user' });
    expect(result.success).toBe(true);
  });

  it('accepts "manager"', () => {
    const result = User.safeParse({ ...validUser, role: 'manager' });
    expect(result.success).toBe(true);
  });

  it('rejects an unlisted role', () => {
    const result = User.safeParse({ ...validUser, role: 'guest' });
    expect(result.success).toBe(false);
  });
});

describe('User schema – website and websites fields', () => {
  it('accepts a valid URL for website', () => {
    const result = User.safeParse({ ...validUser, website: 'https://my.site.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for website', () => {
    const result = User.safeParse({ ...validUser, website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts an array of valid URLs for websites', () => {
    const result = User.safeParse({ ...validUser, websites: ['https://a.com', 'https://b.org'] });
    expect(result.success).toBe(true);
  });

  it('rejects websites containing an invalid URL', () => {
    const result = User.safeParse({ ...validUser, websites: ['https://ok.com', 'bad-url'] });
    expect(result.success).toBe(false);
  });

  it('accepts an empty array for websites', () => {
    const result = User.safeParse({ ...validUser, websites: [] });
    expect(result.success).toBe(true);
  });
});

describe('User schema – trails field (min length 1)', () => {
  it('accepts a non-empty string for trails', () => {
    const result = User.safeParse({ ...validUser, trails: 'some-trail' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty string for trails', () => {
    const result = User.safeParse({ ...validUser, trails: '' });
    expect(result.success).toBe(false);
  });
});

describe('parseUser helper (fools/file.ts)', () => {
  it('returns user data for valid input', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({ ...validUser, email: 'bad' })).toThrow();
  });

  it('throws when required field is absent', () => {
    const { id, ...noId } = validUser as Record<string, unknown>;
    expect(() => parseUser(noId)).toThrow();
  });
});