import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// ---------------------------------------------------------------------------
// fools/file.ts – changed in this PR by removing the stray invalid syntax
// line "asdkjbasdbkjbkjbas", making the module importable.
// These tests verify the exported User schema and parseUser helper work
// correctly after the fix.
// ---------------------------------------------------------------------------

// A minimal valid User object accepted by the schema
const validUser: unknown = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  age: 21,
  active: 'true',           // stringbool
  role: 'user',
  website: 'https://example.com',
  websites: ['https://a.example.com', 'https://b.example.com'],
  trail: 'https://trail.example.com',
  trails: 'some-trail-string',
};

// ---------------------------------------------------------------------------
// Module importability – removal of the stray line is the core change
// ---------------------------------------------------------------------------
describe('fools/file.ts module', () => {
  it('exports User schema', () => {
    expect(User).toBeDefined();
  });

  it('exports parseUser function', () => {
    expect(typeof parseUser).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// User schema – id (uuid)
// ---------------------------------------------------------------------------
describe('User schema – id field', () => {
  it('accepts a valid UUID v4', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – email
// ---------------------------------------------------------------------------
describe('User schema – email field', () => {
  it('accepts a valid email address', () => {
    const result = User.safeParse({ ...validUser, email: 'hello@world.org' });
    expect(result.success).toBe(true);
  });

  it('rejects a string without @ as email', () => {
    const result = User.safeParse({ ...validUser, email: 'notanemail' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – age (coerce.number, min 18)
// ---------------------------------------------------------------------------
describe('User schema – age field', () => {
  it('accepts age 18 (boundary)', () => {
    const result = User.safeParse({ ...validUser, age: 18 });
    expect(result.success).toBe(true);
  });

  it('rejects age 17 (below minimum)', () => {
    const result = User.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('coerces a string age to a number', () => {
    const result = User.safeParse({ ...validUser, age: '25' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// User schema – active (stringbool)
// ---------------------------------------------------------------------------
describe('User schema – active field (z.stringbool)', () => {
  it('accepts "true"', () => {
    const result = User.safeParse({ ...validUser, active: 'true' });
    expect(result.success).toBe(true);
  });

  it('accepts "false"', () => {
    const result = User.safeParse({ ...validUser, active: 'false' });
    expect(result.success).toBe(true);
  });

  it('accepts "1"', () => {
    const result = User.safeParse({ ...validUser, active: '1' });
    expect(result.success).toBe(true);
  });

  it('accepts "0"', () => {
    const result = User.safeParse({ ...validUser, active: '0' });
    expect(result.success).toBe(true);
  });

  it('rejects an arbitrary string for active', () => {
    const result = User.safeParse({ ...validUser, active: 'maybe' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – role enum
// ---------------------------------------------------------------------------
describe('User schema – role field', () => {
  it('accepts "admin"', () => {
    const result = User.safeParse({ ...validUser, role: 'admin' });
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

// ---------------------------------------------------------------------------
// User schema – website / trail (z.url)
// ---------------------------------------------------------------------------
describe('User schema – website and trail URL fields', () => {
  it('accepts valid https URLs for website and trail', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL for website', () => {
    const result = User.safeParse({ ...validUser, website: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid URL for trail', () => {
    const result = User.safeParse({ ...validUser, trail: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – websites (array of z.url)
// ---------------------------------------------------------------------------
describe('User schema – websites array field', () => {
  it('accepts an array of valid URLs', () => {
    const result = User.safeParse({
      ...validUser,
      websites: ['https://one.example.com', 'https://two.example.com'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = User.safeParse({
      ...validUser,
      websites: ['https://ok.example.com', 'bad-url'],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// User schema – trails (z.string, min 1)
// ---------------------------------------------------------------------------
describe('User schema – trails field', () => {
  it('accepts a non-empty string for trails', () => {
    const result = User.safeParse({ ...validUser, trails: 'my-trail' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty string for trails (min 1)', () => {
    const result = User.safeParse({ ...validUser, trails: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper
// ---------------------------------------------------------------------------
describe('parseUser', () => {
  it('returns valid User data for a correct input', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ ...validUser, email: 'bad-email' })).toThrow(Error);
  });

  it('throws an Error when no fields are provided', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('error message is a JSON string', () => {
    try {
      parseUser({ ...validUser, age: 10 });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(() => JSON.parse((e as Error).message)).not.toThrow();
    }
  });

  it('throws for a missing required field', () => {
    const { id: _removed, ...rest } = validUser as Record<string, unknown>;
    expect(() => parseUser(rest)).toThrow(Error);
  });
});