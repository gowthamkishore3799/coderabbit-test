import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  age: '25',
  active: 'true',
  role: 'admin',
  website: 'https://example.com',
  websites: ['https://example.com', 'https://other.com'],
  trail: 'https://trail.example.com',
  trails: 'some trail text',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid inputs', () => {
    it('parses a valid user', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('coerces age from string to number', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) expect(typeof result.data.age).toBe('number');
    });

    it('parses active as stringbool "true"', () => {
      const result = User.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses active as stringbool "false"', () => {
      const result = User.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses active as stringbool "1"', () => {
      const result = User.safeParse({ ...validUser, active: '1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses active as stringbool "0"', () => {
      const result = User.safeParse({ ...validUser, active: '0' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts all valid roles', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it('accepts multiple websites', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://a.com', 'https://b.com', 'https://c.com'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts minimum age of 18', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid UUID', () => {
      const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = User.safeParse({ ...validUser, email: 'not-an-email' });
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

    it('rejects invalid URL in websites array', () => {
      const result = User.safeParse({ ...validUser, websites: ['not-a-url'] });
      expect(result.success).toBe(false);
    });

    it('rejects empty trails string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { id, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser helper', () => {
    it('returns parsed data for valid input', () => {
      const user = parseUser(validUser);
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('admin');
    });

    it('throws for invalid input', () => {
      expect(() => parseUser({ ...validUser, email: 'bad' })).toThrow();
    });

    it('throws with error details in message', () => {
      expect(() => parseUser({ ...validUser, id: 'bad-id' })).toThrow(Error);
    });

    it('returns numeric age after coercion', () => {
      const user = parseUser(validUser);
      expect(user.age).toBe(25);
    });
  });
});