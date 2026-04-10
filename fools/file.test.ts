import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 30,
  active: 'yes',
  role: 'user' as const,
  website: 'https://example.com',
  websites: ['https://site1.com', 'https://site2.com'],
  trail: 'https://trail.example.com',
  trails: 'main trail',
};

describe('User schema (fools/file.ts)', () => {
  describe('valid data', () => {
    it('parses a fully valid user', () => {
      const result = User.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('parses user with an empty websites array', () => {
      const result = User.safeParse({ ...validUser, websites: [] });
      expect(result.success).toBe(true);
    });
  });

  describe('website field (z.url with custom message)', () => {
    it('accepts a valid HTTPS URL', () => {
      const result = User.safeParse({ ...validUser, website: 'https://valid.com' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid URL for website', () => {
      const result = User.safeParse({ ...validUser, website: 'not-a-url' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('website'));
        expect(issue?.message).toBe('Invalid url');
      }
    });

    it('rejects a missing website field', () => {
      const { website: _, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('websites field (array of URLs)', () => {
    it('accepts an array of valid URLs', () => {
      const result = User.safeParse({
        ...validUser,
        websites: ['https://a.com', 'https://b.org'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects an array containing an invalid URL', () => {
      const result = User.safeParse({ ...validUser, websites: ['https://valid.com', 'bad'] });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          i => i.path[0] === 'websites'
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects a missing websites field', () => {
      const { websites: _, ...rest } = validUser;
      const result = User.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('trail field (z.url with custom message)', () => {
    it('accepts a valid URL for trail', () => {
      const result = User.safeParse({ ...validUser, trail: 'https://trail.io' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid URL for trail', () => {
      const result = User.safeParse({ ...validUser, trail: 'not-a-url' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('trail'));
        expect(issue?.message).toBe('Invalid url');
      }
    });
  });

  describe('trails field (string min(1))', () => {
    it('accepts a non-empty string', () => {
      const result = User.safeParse({ ...validUser, trails: 'value' });
      expect(result.success).toBe(true);
    });

    it('rejects an empty string with custom message', () => {
      const result = User.safeParse({ ...validUser, trails: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('trails'));
        expect(issue?.message).toBe('This field is required');
      }
    });
  });

  describe('id field', () => {
    it('rejects an invalid UUID with custom message', () => {
      const result = User.safeParse({ ...validUser, id: 'bad-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('id'));
        expect(issue?.message).toBe('Invalid id');
      }
    });
  });

  describe('email field', () => {
    it('rejects an invalid email with custom message', () => {
      const result = User.safeParse({ ...validUser, email: 'not-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('email'));
        expect(issue?.message).toBe('Invalid email');
      }
    });
  });

  describe('age field', () => {
    it('rejects age below 18 with custom message', () => {
      const result = User.safeParse({ ...validUser, age: 16 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('age'));
        expect(issue?.message).toBe('Must be 18+');
      }
    });

    it('accepts exactly age 18', () => {
      const result = User.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });

    it('coerces a numeric string to a number', () => {
      const result = User.safeParse({ ...validUser, age: '30' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });
  });

  describe('active field (stringbool)', () => {
    it('parses "yes" as true', () => {
      const result = User.safeParse({ ...validUser, active: 'yes' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "no" as false', () => {
      const result = User.safeParse({ ...validUser, active: 'no' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses "true" as true', () => {
      const result = User.safeParse({ ...validUser, active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses "false" as false', () => {
      const result = User.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });
  });

  describe('role field', () => {
    it('accepts "admin", "user", "manager"', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        const result = User.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('rejects an invalid role', () => {
      const result = User.safeParse({ ...validUser, role: 'superuser' });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser (fools/file.ts)', () => {
  it('returns parsed data for a valid user', () => {
    const user = parseUser(validUser);
    expect(user.email).toBe('user@example.com');
    expect(user.website).toBe('https://example.com');
    expect(user.trails).toBe('main trail');
  });

  it('throws an Error for invalid user data', () => {
    expect(() => parseUser({ ...validUser, email: 'invalid' })).toThrow(Error);
  });

  it('throws an Error with a serialized message when input is null', () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it('throws when website is a plain string (not a URL)', () => {
    expect(() => parseUser({ ...validUser, website: 'not-a-url' })).toThrow(Error);
  });

  it('throws when trails is empty string', () => {
    expect(() => parseUser({ ...validUser, trails: '' })).toThrow(Error);
  });
});