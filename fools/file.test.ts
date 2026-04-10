import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'yes',
  role: 'user' as const,
  website: 'https://example.com',
  websites: ['https://a.com', 'https://b.com'],
  trail: 'https://trail.example.com',
  trails: 'main-trail',
};

describe('User schema (fools/file.ts)', () => {
  it('should accept a fully valid user object', () => {
    const result = User.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  describe('id field', () => {
    it('should reject an invalid UUID', () => {
      const result = User.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject a missing id', () => {
      const { id, ...withoutId } = validUser;
      const result = User.safeParse(withoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('email field', () => {
    it('should reject an invalid email', () => {
      const result = User.safeParse({ ...validUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject a missing email', () => {
      const { email, ...withoutEmail } = validUser;
      const result = User.safeParse(withoutEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('age field', () => {
    it('should reject age below 18', () => {
      const result = User.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('should accept age of exactly 18', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('should coerce a numeric string to a number', () => {
      const result = User.safeParse({ ...validUser, age: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(25);
      }
    });
  });

  describe('active field (stringbool)', () => {
    it('should parse "true" as truthy', () => {
      const result = User.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
    });

    it('should parse "false" as falsy', () => {
      const result = User.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
    });

    it('should parse "1" as truthy', () => {
      const result = User.safeParse({ ...validUser, active: '1' });
      expect(result.success).toBe(true);
    });

    it('should parse "0" as falsy', () => {
      const result = User.safeParse({ ...validUser, active: '0' });
      expect(result.success).toBe(true);
    });

    it('should parse "yes" as truthy', () => {
      const result = User.safeParse({ ...validUser, active: 'yes' });
      expect(result.success).toBe(true);
    });

    it('should parse "no" as falsy', () => {
      const result = User.safeParse({ ...validUser, active: 'no' });
      expect(result.success).toBe(true);
    });

    it('should reject an arbitrary string for active', () => {
      const result = User.safeParse({ ...validUser, active: 'maybe' });
      expect(result.success).toBe(false);
    });
  });

  describe('role field', () => {
    it('should accept "admin"', () => {
      const result = User.safeParse({ ...validUser, role: 'admin' });
      expect(result.success).toBe(true);
    });

    it('should accept "user"', () => {
      const result = User.safeParse({ ...validUser, role: 'user' });
      expect(result.success).toBe(true);
    });

    it('should accept "manager"', () => {
      const result = User.safeParse({ ...validUser, role: 'manager' });
      expect(result.success).toBe(true);
    });

    it('should reject an unlisted role', () => {
      const result = User.safeParse({ ...validUser, role: 'superadmin' });
      expect(result.success).toBe(false);
    });
  });

  describe('website field', () => {
    it('should accept a valid HTTPS URL', () => {
      const result = User.safeParse({ ...validUser, website: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject a non-URL string', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('websites field (array of URLs)', () => {
    it('should accept an array of valid URLs', () => {
      const result = User.safeParse({ ...validUser, websites: ['https://a.com', 'https://b.org'] });
      expect(result.success).toBe(true);
    });

    it('should accept an empty array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });

    it('should reject an array with an invalid URL', () => {
      const result = User.safeParse({ ...validUser, websites: ['https://valid.com', 'bad-url'] });
      expect(result.success).toBe(false);
    });
  });

  describe('trails field', () => {
    it('should require a non-empty string', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
    });

    it('should accept a non-empty string', () => {
      const result = User.safeParse({ ...validUser, trails: 'some-trail' });
      expect(result.success).toBe(true);
    });
  });
});

describe('parseUser function (fools/file.ts)', () => {
  it('should return parsed data for a valid user', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
    expect(user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should throw for an invalid user', () => {
    expect(() => parseUser({ ...validUser, email: 'bad-email' })).toThrow();
  });

  it('should throw for null input', () => {
    expect(() => parseUser(null)).toThrow();
  });

  it('should throw for an empty object', () => {
    expect(() => parseUser({})).toThrow();
  });

  it('should throw when age is below 18', () => {
    expect(() => parseUser({ ...validUser, age: 10 })).toThrow();
  });

  it('should throw when website is not a URL', () => {
    expect(() => parseUser({ ...validUser, website: 'not-a-url' })).toThrow();
  });
});