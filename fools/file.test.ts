import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// A fully-valid user object for fools/file.ts (the PR removed the stray non-code line)
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'bob@example.com',
  age: 22,
  active: 'true',
  role: 'user' as const,
  website: 'https://bob.example.com',
  websites: ['https://blog.bob.com', 'https://work.bob.com'],
  trail: 'https://trail.bob.com',
  trails: 'main-trail',
};

describe('User schema (fools/file.ts) – valid data', () => {
  it('accepts a fully valid user object', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('accepts all role enum values', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = User.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it('accepts active as "true"', () => {
    const result = User.safeParse({ ...validUser, active: 'true' });
    expect(result.success).toBe(true);
  });

  it('accepts active as "false"', () => {
    const result = User.safeParse({ ...validUser, active: 'false' });
    expect(result.success).toBe(true);
  });

  it('accepts active as "1"', () => {
    const result = User.safeParse({ ...validUser, active: '1' });
    expect(result.success).toBe(true);
  });

  it('accepts active as "0"', () => {
    const result = User.safeParse({ ...validUser, active: '0' });
    expect(result.success).toBe(true);
  });

  it('accepts age exactly 18 (boundary)', () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it('coerces string age to number', () => {
    const result = User.safeParse({ ...validUser, age: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });

  it('accepts an empty websites array', () => {
    const result = User.safeParse({ ...validUser, websites: [] });
    expect(result.success).toBe(true);
  });
});

describe('User schema (fools/file.ts) – id validation', () => {
  it('rejects a non-UUID id', () => {
    const result = User.safeParse({ ...validUser, id: 'abc-123' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing id', () => {
    const { id: _id, ...noId } = validUser;
    const result = User.safeParse(noId);
    expect(result.success).toBe(false);
  });
});

describe('User schema (fools/file.ts) – email validation', () => {
  it('rejects an invalid email', () => {
    const result = User.safeParse({ ...validUser, email: 'invalid-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const { email: _email, ...noEmail } = validUser;
    const result = User.safeParse(noEmail);
    expect(result.success).toBe(false);
  });
});

describe('User schema (fools/file.ts) – age validation', () => {
  it('rejects age below 18', () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('rejects age of 0', () => {
    const result = User.safeParse({ ...validUser, age: 0 });
    expect(result.success).toBe(false);
  });
});

describe('User schema (fools/file.ts) – website field', () => {
  it('rejects an invalid website URL', () => {
    const result = User.safeParse({ ...validUser, website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing website', () => {
    const { website: _w, ...noWebsite } = validUser;
    const result = User.safeParse(noWebsite);
    expect(result.success).toBe(false);
  });
});

describe('User schema (fools/file.ts) – websites array', () => {
  it('rejects websites array containing invalid URL', () => {
    const result = User.safeParse({ ...validUser, websites: ['not-a-url'] });
    expect(result.success).toBe(false);
  });

  it('accepts websites with multiple valid URLs', () => {
    const result = User.safeParse({
      ...validUser,
      websites: ['https://a.com', 'https://b.com', 'https://c.com'],
    });
    expect(result.success).toBe(true);
  });
});

describe('User schema (fools/file.ts) – trails field', () => {
  it('rejects an empty trails string', () => {
    const result = User.safeParse({ ...validUser, trails: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a non-empty trails string', () => {
    const result = User.safeParse({ ...validUser, trails: 'some-trail' });
    expect(result.success).toBe(true);
  });
});

describe('parseUser (fools/file.ts)', () => {
  it('returns typed user data for valid input', () => {
    const user = parseUser(validUser);
    expect(user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(user.email).toBe('bob@example.com');
    expect(user.role).toBe('user');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({ email: 'bad-email', age: 5 })).toThrow();
  });

  it('throws for null input', () => {
    expect(() => parseUser(null)).toThrow();
  });

  it('throws when id is not a UUID', () => {
    expect(() => parseUser({ ...validUser, id: 'invalid' })).toThrow();
  });

  it('throws when age is below 18', () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it('throws when trail is not a valid URL', () => {
    expect(() => parseUser({ ...validUser, trail: 'ftp://not-http' })).toThrow();
  });
});