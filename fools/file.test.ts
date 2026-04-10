import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  website: 'https://example.com',
  websites: ['https://example.com', 'https://other.org'],
  trail: 'https://trail.example.com',
  trails: 'some-trail-value',
};

// ─────────────────────────────────────────────
// User schema – id (z.string().uuid)
// ─────────────────────────────────────────────

describe('User schema – id field', () => {
  it('accepts a valid UUID v4', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing id', () => {
    const { id: _omit, ...noId } = validUser;
    const result = User.safeParse(noId);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – email (z.string().email)
// ─────────────────────────────────────────────

describe('User schema – email field', () => {
  it('accepts a valid email address', () => {
    const result = User.safeParse({ ...validUser, email: 'hello@world.io' });
    expect(result.success).toBe(true);
  });

  it('rejects an email without @', () => {
    const result = User.safeParse({ ...validUser, email: 'noatsign.com' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty email', () => {
    const result = User.safeParse({ ...validUser, email: '' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – age (z.coerce.number().int().min(18))
// ─────────────────────────────────────────────

describe('User schema – age field', () => {
  it('accepts age exactly 18', () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it('rejects age 17', () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('coerces string "21" to number', () => {
    const result = User.safeParse({ ...validUser, age: '21' });
    expect(result.success).toBe(true);
    if (result.success) expect(typeof result.data.age).toBe('number');
  });

  it('rejects a float age (must be int)', () => {
    const result = User.safeParse({ ...validUser, age: 20.5 });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – active (z.stringbool)
// ─────────────────────────────────────────────

describe('User schema – active field (z.stringbool)', () => {
  it.each([['true', true], ['1', true], ['yes', true]])(
    'parses "%s" as boolean true',
    (input, expected) => {
      const result = User.safeParse({ ...validUser, active: input });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(expected);
    }
  );

  it.each([['false', false], ['0', false], ['no', false]])(
    'parses "%s" as boolean false',
    (input, expected) => {
      const result = User.safeParse({ ...validUser, active: input });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(expected);
    }
  );
});

// ─────────────────────────────────────────────
// User schema – role (z.enum)
// ─────────────────────────────────────────────

describe('User schema – role field', () => {
  it.each(['admin', 'user', 'manager'])('accepts role "%s"', (role) => {
    const result = User.safeParse({ ...validUser, role });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown role', () => {
    const result = User.safeParse({ ...validUser, role: 'guest' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – website (z.url)
// ─────────────────────────────────────────────

describe('User schema – website field (z.url)', () => {
  it('accepts https URL', () => {
    const result = User.safeParse({ ...validUser, website: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts http URL', () => {
    const result = User.safeParse({ ...validUser, website: 'http://local.test' });
    expect(result.success).toBe(true);
  });

  it('rejects a plain string', () => {
    const result = User.safeParse({ ...validUser, website: 'notaurl' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – websites (z.array(z.url))
// ─────────────────────────────────────────────

describe('User schema – websites field', () => {
  it('accepts an array of valid URLs', () => {
    const result = User.safeParse({ ...validUser, websites: ['https://a.com', 'https://b.org'] });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const result = User.safeParse({ ...validUser, websites: [] });
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = User.safeParse({ ...validUser, websites: ['https://valid.com', 'not-a-url'] });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// User schema – trails (z.string().min(1))
// ─────────────────────────────────────────────

describe('User schema – trails field', () => {
  it('accepts a non-empty string', () => {
    const result = User.safeParse({ ...validUser, trails: 'some-value' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = User.safeParse({ ...validUser, trails: '' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// parseUser helper
// ─────────────────────────────────────────────

describe('parseUser', () => {
  it('returns parsed data for valid input', () => {
    const result = parseUser(validUser);
    expect(result.email).toBe('user@example.com');
    expect(result.role).toBe('admin');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ ...validUser, email: 'bad-email' })).toThrow(Error);
  });

  it('throws when id is not a UUID', () => {
    expect(() => parseUser({ ...validUser, id: '1234' })).toThrow();
  });

  it('throws when age is too low', () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it('throws when trails is empty string (boundary case)', () => {
    expect(() => parseUser({ ...validUser, trails: '' })).toThrow();
  });
});