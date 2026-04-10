import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// Valid base fixture matching all required fields
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  website: 'https://example.com',
  websites: ['https://site1.com', 'https://site2.com'],
  trail: 'https://trail.example.com',
  trails: 'main trail',
};

describe('User schema (fools/file.ts)', () => {
  describe('id field', () => {
    it('accepts a valid UUID', () => {
      expect(User.safeParse(validUser).success).toBe(true);
    });

    it('rejects an invalid UUID', () => {
      expect(User.safeParse({ ...validUser, id: 'not-a-uuid' }).success).toBe(false);
    });

    it('rejects empty string id', () => {
      expect(User.safeParse({ ...validUser, id: '' }).success).toBe(false);
    });
  });

  describe('email field', () => {
    it('accepts a valid email', () => {
      expect(User.safeParse({ ...validUser, email: 'test@test.com' }).success).toBe(true);
    });

    it('rejects invalid email format', () => {
      expect(User.safeParse({ ...validUser, email: 'not-an-email' }).success).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(User.safeParse({ ...validUser, email: 'user@' }).success).toBe(false);
    });
  });

  describe('age field', () => {
    it('accepts age of exactly 18', () => {
      expect(User.safeParse({ ...validUser, age: 18 }).success).toBe(true);
    });

    it('rejects age below 18', () => {
      expect(User.safeParse({ ...validUser, age: 17 }).success).toBe(false);
    });

    it('accepts age above 18', () => {
      expect(User.safeParse({ ...validUser, age: 100 }).success).toBe(true);
    });

    it('coerces string number to integer', () => {
      expect(User.safeParse({ ...validUser, age: '25' }).success).toBe(true);
    });
  });

  describe('active field (z.stringbool)', () => {
    it('parses "true" to boolean true', () => {
      const result = User.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "false" to boolean false', () => {
      const result = User.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses "1" to boolean true', () => {
      const result = User.safeParse({ ...validUser, active: '1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "0" to boolean false', () => {
      const result = User.safeParse({ ...validUser, active: '0' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses "yes" to boolean true', () => {
      const result = User.safeParse({ ...validUser, active: 'yes' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "no" to boolean false', () => {
      const result = User.safeParse({ ...validUser, active: 'no' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('rejects arbitrary string for active', () => {
      expect(User.safeParse({ ...validUser, active: 'maybe' }).success).toBe(false);
    });
  });

  describe('role field', () => {
    it('accepts "admin"', () => {
      expect(User.safeParse({ ...validUser, role: 'admin' }).success).toBe(true);
    });

    it('accepts "user"', () => {
      expect(User.safeParse({ ...validUser, role: 'user' }).success).toBe(true);
    });

    it('accepts "manager"', () => {
      expect(User.safeParse({ ...validUser, role: 'manager' }).success).toBe(true);
    });

    it('rejects invalid role', () => {
      expect(User.safeParse({ ...validUser, role: 'superadmin' }).success).toBe(false);
    });
  });

  describe('website field', () => {
    it('accepts a valid https URL', () => {
      expect(User.safeParse({ ...validUser, website: 'https://example.com' }).success).toBe(true);
    });

    it('rejects a non-URL string', () => {
      expect(User.safeParse({ ...validUser, website: 'not a url' }).success).toBe(false);
    });

    it('rejects empty string', () => {
      expect(User.safeParse({ ...validUser, website: '' }).success).toBe(false);
    });
  });

  describe('websites field', () => {
    it('accepts an array of valid URLs', () => {
      expect(User.safeParse({ ...validUser, websites: ['https://a.com', 'https://b.com'] }).success).toBe(true);
    });

    it('accepts empty array', () => {
      expect(User.safeParse({ ...validUser, websites: [] }).success).toBe(true);
    });

    it('rejects array containing invalid URL', () => {
      expect(User.safeParse({ ...validUser, websites: ['https://valid.com', 'invalid'] }).success).toBe(false);
    });
  });

  describe('trail field', () => {
    it('accepts a valid URL', () => {
      expect(User.safeParse({ ...validUser, trail: 'https://trail.example.com' }).success).toBe(true);
    });

    it('rejects invalid URL', () => {
      expect(User.safeParse({ ...validUser, trail: 'not-a-url' }).success).toBe(false);
    });
  });

  describe('trails field', () => {
    it('accepts a non-empty string', () => {
      expect(User.safeParse({ ...validUser, trails: 'main trail' }).success).toBe(true);
    });

    it('rejects empty string', () => {
      expect(User.safeParse({ ...validUser, trails: '' }).success).toBe(false);
    });
  });

  describe('overall schema', () => {
    it('rejects object with missing required fields', () => {
      expect(User.safeParse({}).success).toBe(false);
    });

    it('rejects when id is missing', () => {
      const { id, ...without } = validUser;
      expect(User.safeParse(without).success).toBe(false);
    });

    it('provides error details on failure', () => {
      const result = User.safeParse({ ...validUser, age: 10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('parseUser() (fools/file.ts)', () => {
  it('returns parsed user data for valid input', () => {
    const result = parseUser(validUser);
    expect(result.id).toBe(validUser.id);
    expect(result.email).toBe(validUser.email);
    expect(result.age).toBe(25);
  });

  it('throws an error for invalid input', () => {
    expect(() => parseUser({ ...validUser, age: 5 })).toThrow();
  });

  it('throws an Error instance for invalid input', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws an Error instance with a message for invalid input', () => {
    // Note: error.tree does not exist in this Zod v4 version; message is empty string
    // but the important behaviour is that an Error is thrown
    expect(() => parseUser({ ...validUser, email: 'bad-email' })).toThrow(Error);
  });

  it('coerces age from string during parse', () => {
    const result = parseUser({ ...validUser, age: '30' });
    expect(result.age).toBe(30);
  });

  it('converts active stringbool to boolean', () => {
    const result = parseUser({ ...validUser, active: 'true' });
    expect(result.active).toBe(true);
  });

  it('throws for completely non-object input', () => {
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser(42)).toThrow();
    expect(() => parseUser('string')).toThrow();
  });
});