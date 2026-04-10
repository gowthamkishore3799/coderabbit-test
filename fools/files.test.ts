import { describe, it, expect } from 'vitest';
import { UserSchema, parseUser } from './files';

// Minimal valid payload satisfying every field of UserSchema
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Test bio',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://alice.example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: 'https://site1.example.com https://site2.example.com',
  format: 'json',
};

describe('UserSchema (fools/files.ts)', () => {
  describe('valid data', () => {
    it('accepts a fully valid user object', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('coerces string age to integer', () => {
      const input = { ...validUser, age: '30' };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });

    it('accepts all valid role values', () => {
      const roles = ['admin', 'user', 'manager'] as const;
      for (const role of roles) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all valid status values', () => {
      const statuses = ['active', 'inactive', 'banned'] as const;
      for (const status of statuses) {
        const result = UserSchema.safeParse({ ...validUser, status });
        expect(result.success).toBe(true);
      }
    });

    it('accepts stringbool "false" for active field', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts stringbool "1" for active field', () => {
      const result = UserSchema.safeParse({ ...validUser, active: '1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('accepts stringbool "0" for active field', () => {
      const result = UserSchema.safeParse({ ...validUser, active: '0' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts stringbool "yes" for active field', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'yes' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('accepts stringbool "no" for active field', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'no' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('accepts profile without optional bio field', () => {
      const input = {
        ...validUser,
        profile: { joined: new Date('2023-01-01') },
      };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts code matching template literal pattern (user-1)', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'user-1' });
      expect(result.success).toBe(true);
    });

    it('accepts code matching template literal pattern at max boundary (user-9999)', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'user-9999' });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('rejects invalid UUID for id', () => {
      const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects age below 18', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('rejects age exactly at boundary (17)', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role value', () => {
      const result = UserSchema.safeParse({ ...validUser, role: 'superadmin' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status value', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid websiteUrl', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid portfolio url', () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: 'ftp://unsupported' });
      expect(result.success).toBe(false);
    });

    it('rejects profile with extra unknown fields (strictObject)', () => {
      const input = {
        ...validUser,
        profile: { bio: 'bio', joined: new Date(), extraField: 'should fail' },
      };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { id: _id, ...withoutId } = validUser;
      const result = UserSchema.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
      const { email: _email, ...withoutEmail } = validUser;
      const result = UserSchema.safeParse(withoutEmail);
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser (fools/files.ts)', () => {
  it('returns parsed user data for valid input', () => {
    const result = parseUser(validUser);
    expect(result).toMatchObject({
      id: validUser.id,
      email: validUser.email,
      role: validUser.role,
      status: validUser.status,
    });
  });

  it('throws an Error for invalid input', () => {
    const invalidInput = { ...validUser, email: 'bad-email' };
    expect(() => parseUser(invalidInput)).toThrow(Error);
  });

  it('throws for completely empty object', () => {
    expect(() => parseUser({})).toThrow(Error);
  });

  it('throws for null input', () => {
    expect(() => parseUser(null)).toThrow(Error);
  });

  it('error message is a JSON string (uses .treeify())', () => {
    try {
      parseUser({ ...validUser, id: 'invalid-uuid' });
      expect.fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      // The error message should be parseable JSON since parseUser uses JSON.stringify
      expect(() => JSON.parse((err as Error).message)).not.toThrow();
    }
  });
});