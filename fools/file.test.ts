import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: '25',
  active: 'true',
  role: 'admin' as const,
  website: 'https://example.com',
  websites: ['https://site1.example.com', 'https://site2.example.com'],
  trail: 'https://trail.example.com',
  trails: 'some trail text',
};

describe('User schema (fools/file.ts) – module loads cleanly after garbage line removal', () => {
  it('exports the User schema', () => {
    expect(User).toBeDefined();
  });

  it('exports parseUser function', () => {
    expect(typeof parseUser).toBe('function');
  });
});

describe('User schema – id field', () => {
  it('accepts a valid UUID', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID id', () => {
    const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const { id, ...rest } = validUser;
    const result = User.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('User schema – email field', () => {
  it('accepts a valid email address', () => {
    const result = User.safeParse({ ...validUser, email: 'hello@test.org' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = User.safeParse({ ...validUser, email: 'plaintext' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as email', () => {
    const result = User.safeParse({ ...validUser, email: '' });
    expect(result.success).toBe(false);
  });
});

describe('User schema – age field (coerced)', () => {
  it('coerces string "25" to number 25', () => {
    const result = User.safeParse({ ...validUser, age: '25' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(25);
  });

  it('accepts numeric age directly', () => {
    const result = User.safeParse({ ...validUser, age: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects age below 18', () => {
    const result = User.safeParse({ ...validUser, age: '16' });
    expect(result.success).toBe(false);
  });

  it('accepts age exactly 18', () => {
    const result = User.safeParse({ ...validUser, age: '18' });
    expect(result.success).toBe(true);
  });
});

describe('User schema – active field (z.stringbool)', () => {
  it('accepts "true"', () => {
    expect(User.safeParse({ ...validUser, active: 'true' }).success).toBe(true);
  });

  it('accepts "false"', () => {
    expect(User.safeParse({ ...validUser, active: 'false' }).success).toBe(true);
  });

  it('accepts "yes"', () => {
    expect(User.safeParse({ ...validUser, active: 'yes' }).success).toBe(true);
  });

  it('accepts "no"', () => {
    expect(User.safeParse({ ...validUser, active: 'no' }).success).toBe(true);
  });

  it('accepts "1"', () => {
    expect(User.safeParse({ ...validUser, active: '1' }).success).toBe(true);
  });

  it('accepts "0"', () => {
    expect(User.safeParse({ ...validUser, active: '0' }).success).toBe(true);
  });
});

describe('User schema – role field (z.enum)', () => {
  it('accepts "admin"', () => {
    expect(User.safeParse({ ...validUser, role: 'admin' }).success).toBe(true);
  });

  it('accepts "user"', () => {
    expect(User.safeParse({ ...validUser, role: 'user' }).success).toBe(true);
  });

  it('accepts "manager"', () => {
    expect(User.safeParse({ ...validUser, role: 'manager' }).success).toBe(true);
  });

  it('rejects unknown role', () => {
    expect(User.safeParse({ ...validUser, role: 'guest' }).success).toBe(false);
  });
});

describe('User schema – website field (z.url)', () => {
  it('accepts a valid https URL', () => {
    expect(User.safeParse({ ...validUser, website: 'https://example.com' }).success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    expect(User.safeParse({ ...validUser, website: 'not-a-url' }).success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(User.safeParse({ ...validUser, website: '' }).success).toBe(false);
  });
});

describe('User schema – websites field (array of URLs)', () => {
  it('accepts an array with valid URLs', () => {
    expect(
      User.safeParse({ ...validUser, websites: ['https://a.com', 'https://b.com'] }).success
    ).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(User.safeParse({ ...validUser, websites: [] }).success).toBe(true);
  });

  it('rejects array with invalid URL', () => {
    expect(User.safeParse({ ...validUser, websites: ['invalid'] }).success).toBe(false);
  });
});

describe('User schema – trail field (z.url)', () => {
  it('accepts a valid URL', () => {
    expect(User.safeParse({ ...validUser, trail: 'https://trail.test.com' }).success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    expect(User.safeParse({ ...validUser, trail: 'not-a-url' }).success).toBe(false);
  });
});

describe('User schema – trails field (z.string.min(1))', () => {
  it('accepts a non-empty string', () => {
    expect(User.safeParse({ ...validUser, trails: 'trail info' }).success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(User.safeParse({ ...validUser, trails: '' }).success).toBe(false);
  });
});

describe('parseUser (fools/file.ts)', () => {
  it('returns parsed data for valid input', () => {
    const result = parseUser(validUser);
    expect(result).toBeDefined();
    expect(result.email).toBe('user@example.com');
    expect(result.role).toBe('admin');
  });

  it('throws for invalid input', () => {
    expect(() => parseUser({ ...validUser, email: 'bad-email' })).toThrow();
  });

  it('throws for missing required field', () => {
    const { website, ...rest } = validUser;
    expect(() => parseUser(rest)).toThrow();
  });

  it('throws for age below 18', () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it('does not throw for valid full user', () => {
    expect(() => parseUser(validUser)).not.toThrow();
  });
});