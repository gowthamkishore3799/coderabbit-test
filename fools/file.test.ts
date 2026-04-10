import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// Minimal valid payload satisfying every field of the User schema
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'bob@example.com',
  age: 22,
  active: 'true',
  role: 'user' as const,
  website: 'https://bob.example.com',
  websites: ['https://site1.example.com', 'https://site2.example.com'],
  trail: 'https://trail.example.com',
  trails: 'mountain-trail',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid data', () => {
    it('accepts a fully valid user object', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('coerces string age to integer', () => {
      const result = User.safeParse({ ...validUser, age: '25' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(25);
    });

    it('accepts all valid role enum values', () => {
      const roles = ['admin', 'user', 'manager'] as const;
      for (const role of roles) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts stringbool "true" as true for active', () => {
      const result = User.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('accepts stringbool "false" as false for active', () => {
      const result = User.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts stringbool "1" as true for active', () => {
      const result = User.safeParse({ ...validUser, active: '1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('accepts stringbool "0" as false for active', () => {
      const result = User.safeParse({ ...validUser, active: '0' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts age exactly at minimum boundary (18)', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('accepts empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it('accepts websites with multiple URLs', () => {
      const result = User.safeParse({
        ...validUser,
        websites: [
          'https://first.example.com',
          'https://second.example.com',
          'https://third.example.com',
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('rejects non-UUID id', () => {
      const result = User.safeParse({ ...validUser, id: '1234' });
      expect(result.success).toBe(false);
    });

    it('rejects malformed email', () => {
      const result = User.safeParse({ ...validUser, email: 'not-valid' });
      expect(result.success).toBe(false);
    });

    it('rejects age below 18', () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('rejects age of 0', () => {
      const result = User.safeParse({ ...validUser, age: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role value', () => {
      const result = User.safeParse({ ...validUser, role: 'guest' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid website URL', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL in websites array', () => {
      const result = User.safeParse({ ...validUser, websites: ['https://valid.com', 'bad'] });
      expect(result.success).toBe(false);
    });

    it('rejects invalid trail URL', () => {
      const result = User.safeParse({ ...validUser, trail: 'bad-trail' });
      expect(result.success).toBe(false);
    });

    it('rejects empty trails string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing id field', () => {
      const { id: _id, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it('rejects null input', () => {
      const result = User.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer age', () => {
      const result = User.safeParse({ ...validUser, age: 25.5 });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser (fools/file.ts)', () => {
  it('returns parsed data for valid input', () => {
    const result = parseUser(validUser);
    expect(result).toMatchObject({
      id: validUser.id,
      email: validUser.email,
      role: validUser.role,
    });
  });

  it('throws Error for invalid input', () => {
    expect(() => parseUser({ ...validUser, email: 'invalid' })).toThrow(Error);
  });

  it('throws for empty object', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws for undefined', () => {
    expect(() => parseUser(undefined)).toThrow(Error);
  });

  it('error message is a non-empty string', () => {
    try {
      parseUser({ ...validUser, age: 10 });
      expect.fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message.length).toBeGreaterThan(0);
    }
  });
});