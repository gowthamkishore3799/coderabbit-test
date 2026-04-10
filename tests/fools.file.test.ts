/**
 * Tests for fools/file.ts User schema
 *
 * PR change: removed invalid non-code line "asdkjbasdbkjbkjbas" that would
 * cause a syntax/parse error, making the module importable and functional.
 */

import { describe, it, expect } from 'vitest';
import { User, parseUser } from '../fools/file';

const validUser = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'hello@example.com',
  age: 21,
  active: 'true',
  role: 'user',
  website: 'https://example.com',
  websites: ['https://site1.com', 'https://site2.com'],
  trail: 'https://trail.example.com',
  trails: 'some-trail-value',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid data', () => {
    it('parses a complete valid user', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('coerces age from string to integer', () => {
      const result = User.safeParse({ ...validUser, age: '22' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(22);
    });

    it('parses active stringbool - true variants', () => {
      for (const v of ['true', '1', 'yes']) {
        const result = User.safeParse({ ...validUser, active: v });
        expect(result.success).toBe(true);
      }
    });

    it('parses active stringbool - false variants', () => {
      for (const v of ['false', '0', 'no']) {
        const result = User.safeParse({ ...validUser, active: v });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all valid roles', () => {
      for (const role of ['admin', 'user', 'manager']) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it('accepts websites array with multiple URLs', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://a.com', 'https://b.com', 'https://c.com'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('id field', () => {
    it('rejects non-UUID id string', () => {
      const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects missing id', () => {
      const { id, ...noId } = validUser;
      const result = User.safeParse(noId);
      expect(result.success).toBe(false);
    });
  });

  describe('email field', () => {
    it('rejects invalid email format', () => {
      const result = User.safeParse({ ...validUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects email with invalid domain', () => {
      const result = User.safeParse({ ...validUser, email: 'user@' });
      expect(result.success).toBe(false);
    });
  });

  describe('age field', () => {
    it('rejects age below 18', () => {
      const result = User.safeParse({ ...validUser, age: 16 });
      expect(result.success).toBe(false);
    });

    it('accepts boundary age of 18', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer float age', () => {
      const result = User.safeParse({ ...validUser, age: 25.7 });
      expect(result.success).toBe(false);
    });
  });

  describe('role field', () => {
    it('rejects unknown role value', () => {
      const result = User.safeParse({ ...validUser, role: 'viewer' });
      expect(result.success).toBe(false);
    });
  });

  describe('website and trail fields (z.url)', () => {
    it('rejects invalid website URL', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid trail URL', () => {
      const result = User.safeParse({ ...validUser, trail: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing website', () => {
      const { website, ...noWebsite } = validUser;
      const result = User.safeParse(noWebsite);
      expect(result.success).toBe(false);
    });
  });

  describe('websites array field', () => {
    it('rejects websites with an invalid URL entry', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://valid.com', 'not-a-url'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('trails field (non-empty string)', () => {
    it('accepts any non-empty string for trails', () => {
      const result = User.safeParse({ ...validUser, trails: 'mountain-trail' });
      expect(result.success).toBe(true);
    });

    it('rejects empty trails string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser helper', () => {
    it('returns parsed user data for valid input', () => {
      const user = parseUser(validUser);
      expect(user.email).toBe('hello@example.com');
      expect(user.role).toBe('user');
    });

    it('throws error for invalid input', () => {
      expect(() => parseUser({ ...validUser, id: 'bad-id' })).toThrow();
    });

    it('throws error for empty object', () => {
      expect(() => parseUser({})).toThrow();
    });

    it('throws error for null input', () => {
      expect(() => parseUser(null)).toThrow();
    });
  });
});