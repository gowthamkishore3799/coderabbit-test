import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// fools/file.ts was changed in the PR to remove an invalid syntax line.
// Tests verify the schema still works correctly after the cleanup.

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  website: 'https://mysite.com',
  websites: ['https://a.com', 'https://b.com'],
  trail: 'https://trail.example.com',
  trails: 'Some text',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid inputs', () => {
    it('parses a complete valid user', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('accepts all role values: admin, user, manager', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts stringbool truthy values for active', () => {
      for (const active of ['true', '1', 'yes']) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it('accepts stringbool falsy values for active', () => {
      for (const active of ['false', '0', 'no']) {
        const result = User.safeParse({ ...validUser, active });
        expect(result.success).toBe(true);
      }
    });

    it('accepts age exactly 18 (boundary)', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('coerces age from numeric string', () => {
      const result = User.safeParse({ ...validUser, age: '25' });
      expect(result.success).toBe(true);
    });

    it('accepts empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it('accepts multiple websites', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://one.com', 'https://two.com', 'https://three.com'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid UUID for id', () => {
      const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = User.safeParse({ ...validUser, email: 'bad-email' });
      expect(result.success).toBe(false);
    });

    it('rejects age below 18', () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const result = User.safeParse({ ...validUser, role: 'superuser' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid website URL', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL inside websites array', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://valid.com', 'not-a-url'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid trail URL', () => {
      const result = User.safeParse({ ...validUser, trail: 'no-url-here' });
      expect(result.success).toBe(false);
    });

    it('rejects empty trails string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing required field id', () => {
      const { id: _, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser helper (fools/file.ts)', () => {
    it('returns parsed user for valid input', () => {
      const user = parseUser(validUser);
      expect(user.email).toBe('user@example.com');
    });

    it('throws for invalid input', () => {
      expect(() => parseUser({ ...validUser, email: 'bad' })).toThrow();
    });

    it('throws an Error instance', () => {
      try {
        parseUser({ ...validUser, id: 'not-valid' });
        expect.fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});