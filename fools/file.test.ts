import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

// Valid base input for the User schema in fools/file.ts
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  website: 'https://example.com',
  websites: ['https://a.com', 'https://b.com'],
  trail: 'https://trail.example.com',
  trails: 'some-trail-value',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid data', () => {
    it('parses a complete valid user', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('parses a user with empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });
  });

  describe('id field (z.string().uuid)', () => {
    it('rejects an invalid UUID', () => {
      const result = User.safeParse({ ...validUser, id: 'not-a-valid-uuid' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid UUID v4', () => {
      const result = User.safeParse({
        ...validUser,
        id: 'b27c4a3e-5f1a-4d8b-9c2e-0f6b7d8a9e1c',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email field', () => {
    it('rejects a malformed email', () => {
      const result = User.safeParse({ ...validUser, email: 'invalid-email' });
      expect(result.success).toBe(false);
    });

    it('rejects email without domain', () => {
      const result = User.safeParse({ ...validUser, email: 'user@' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid email with subdomain', () => {
      const result = User.safeParse({ ...validUser, email: 'test@mail.example.com' });
      expect(result.success).toBe(true);
    });
  });

  describe('age field (coerce + min 18)', () => {
    it('rejects age 17', () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('accepts age exactly 18', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('coerces string "25" to number', () => {
      const result = User.safeParse({ ...validUser, age: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(25);
      }
    });
  });

  describe('active field (z.stringbool)', () => {
    it.each(['true', 'false', '1', '0', 'yes', 'no'])(
      'accepts "%s" as a valid stringbool',
      (value) => {
        const result = User.safeParse({ ...validUser, active: value });
        expect(result.success).toBe(true);
      }
    );

    it('rejects "maybe" as stringbool', () => {
      const result = User.safeParse({ ...validUser, active: 'maybe' });
      expect(result.success).toBe(false);
    });
  });

  describe('role field', () => {
    it.each(['admin', 'user', 'manager'])('accepts role "%s"', (role) => {
      const result = User.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    });

    it('rejects unknown role "moderator"', () => {
      const result = User.safeParse({ ...validUser, role: 'moderator' });
      expect(result.success).toBe(false);
    });
  });

  describe('website field (z.url)', () => {
    it('accepts a valid https URL', () => {
      const result = User.safeParse({ ...validUser, website: 'https://mysite.com' });
      expect(result.success).toBe(true);
    });

    it('rejects a plain string as website', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('websites field (array of z.url)', () => {
    it('accepts an array of valid URLs', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://one.com', 'https://two.org'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects an array containing an invalid URL', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://valid.com', 'not-a-url'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('trail field (z.url)', () => {
    it('accepts a valid URL for trail', () => {
      const result = User.safeParse({
        ...validUser,
        trail: 'https://trail.example.org/path',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid trail URL', () => {
      const result = User.safeParse({ ...validUser, trail: 'bad-trail' });
      expect(result.success).toBe(false);
    });
  });

  describe('trails field (z.string().min(1))', () => {
    it('accepts any non-empty string', () => {
      const result = User.safeParse({ ...validUser, trails: 'some trail description' });
      expect(result.success).toBe(true);
    });

    it('rejects an empty trails string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('rejects empty object', () => {
      const result = User.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects user missing email', () => {
      const { email: _, ...withoutEmail } = validUser;
      const result = User.safeParse(withoutEmail);
      expect(result.success).toBe(false);
    });

    it('rejects user missing website', () => {
      const { website: _, ...withoutWebsite } = validUser;
      const result = User.safeParse(withoutWebsite);
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser helper', () => {
    it('returns parsed data for valid input', () => {
      const result = parseUser(validUser);
      expect(result.id).toBe(validUser.id);
      expect(result.email).toBe(validUser.email);
      expect(result.role).toBe('admin');
    });

    it('throws for invalid input', () => {
      expect(() => parseUser({})).toThrow();
    });

    it('throws for partially valid input', () => {
      expect(() => parseUser({ id: validUser.id, email: 'bad' })).toThrow();
    });
  });
});