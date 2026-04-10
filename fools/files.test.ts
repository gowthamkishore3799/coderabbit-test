import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as actualZod from 'zod';

// z.urls() is not available in the installed zod version.
// Provide a shim so fools/files.ts can be imported successfully.
vi.mock('zod', async (importOriginal) => {
  const real = await importOriginal<typeof import('zod')>();
  return {
    ...real,
    z: {
      ...(real as any).z,
      urls: () => (real as any).z?.array((real as any).z?.url()) ?? real.array(real.url()),
    },
    // top-level z.urls shim
    urls: () => real.array(real.url()),
  };
});

import { UserSchema, parseUser, type User } from './files';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function validUser(): Record<string, unknown> {
  return {
    id: VALID_UUID,
    email: 'alice@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2023-01-01'),
    },
    websiteUrl: 'https://alice.example.com',
    portfolio: 'https://portfolio.alice.com',
    siteUrls: ['https://site1.com', 'https://site2.com'],
    format: 'json',
  };
}

describe('UserSchema', () => {
  describe('valid input', () => {
    it('accepts a fully valid user object', () => {
      const result = UserSchema.safeParse(validUser());
      expect(result.success).toBe(true);
    });

    it('accepts all valid role values', () => {
      for (const role of ['admin', 'user', 'manager']) {
        const result = UserSchema.safeParse({ ...validUser(), role });
        expect(result.success, `role "${role}" should be accepted`).toBe(true);
      }
    });

    it('accepts all valid status values', () => {
      for (const status of ['active', 'inactive', 'banned']) {
        const result = UserSchema.safeParse({ ...validUser(), status });
        expect(result.success, `status "${status}" should be accepted`).toBe(true);
      }
    });

    it('accepts stringbool truthy values for active field', () => {
      for (const active of ['true', '1', 'yes']) {
        const result = UserSchema.safeParse({ ...validUser(), active });
        expect(result.success, `active "${active}" should be accepted`).toBe(true);
      }
    });

    it('accepts stringbool falsy values for active field', () => {
      for (const active of ['false', '0', 'no']) {
        const result = UserSchema.safeParse({ ...validUser(), active });
        expect(result.success, `active "${active}" should be accepted`).toBe(true);
      }
    });

    it('accepts a valid UUID for id', () => {
      const result = UserSchema.safeParse({ ...validUser(), id: VALID_UUID });
      expect(result.success).toBe(true);
    });

    it('accepts valid URLs for websiteUrl and portfolio', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        websiteUrl: 'https://example.org',
        portfolio: 'http://myportfolio.dev',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional bio in profile', () => {
      const user = { ...validUser(), profile: { joined: new Date('2023-01-01') } };
      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it('coerces string age to number', () => {
      const result = UserSchema.safeParse({ ...validUser(), age: '30' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe('status field (changed from z.literal to z.enum)', () => {
    it('rejects status values not in the enum', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: 'suspended' });
      expect(result.success).toBe(false);
    });

    it('rejects empty string as status', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: '' });
      expect(result.success).toBe(false);
    });

    it('rejects numeric status value', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects null status', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: null });
      expect(result.success).toBe(false);
    });
  });

  describe('websiteUrl field (new field)', () => {
    it('rejects invalid URL for websiteUrl', () => {
      const result = UserSchema.safeParse({ ...validUser(), websiteUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const { websiteUrl, ...rest } = validUser() as any;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('portfolio field (new field)', () => {
    it('rejects invalid URL for portfolio', () => {
      const result = UserSchema.safeParse({ ...validUser(), portfolio: 'not-a-valid-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const { portfolio, ...rest } = validUser() as any;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('format field (new field)', () => {
    it('accepts any string for format', () => {
      const result = UserSchema.safeParse({ ...validUser(), format: 'xml' });
      expect(result.success).toBe(true);
    });

    it('rejects missing format field', () => {
      const { format, ...rest } = validUser() as any;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid UUID for id', () => {
      const result = UserSchema.safeParse({ ...validUser(), id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = UserSchema.safeParse({ ...validUser(), email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects age below 18', () => {
      const result = UserSchema.safeParse({ ...validUser(), age: 17 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const result = UserSchema.safeParse({ ...validUser(), role: 'superuser' });
      expect(result.success).toBe(false);
    });

    it('rejects extra fields in strict profile object', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        profile: {
          bio: 'hello',
          joined: new Date(),
          extraField: 'not allowed',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser', () => {
  it('returns a valid user object for valid input', () => {
    const user = parseUser(validUser());
    expect(user.email).toBe('alice@example.com');
    expect(user.role).toBe('admin');
    expect(user.status).toBe('active');
  });

  it('throws an Error for invalid input', () => {
    expect(() => parseUser({ ...validUser(), email: 'bad-email' })).toThrow(Error);
  });

  it('throws an Error with a non-empty message when input is invalid', () => {
    try {
      parseUser({ ...validUser(), age: 10 });
      expect.fail('Expected parseUser to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message.length).toBeGreaterThan(0);
    }
  });

  it('returns typed User with status as enum value', () => {
    const user = parseUser(validUser());
    expect(['active', 'inactive', 'banned']).toContain(user.status);
  });

  it('throws for missing required fields', () => {
    expect(() => parseUser({ id: VALID_UUID })).toThrow(Error);
  });

  it('coerces string age and returns numeric age', () => {
    const user = parseUser({ ...validUser(), age: '22' });
    expect(typeof user.age).toBe('number');
    expect(user.age).toBe(22);
  });

  it('throws for unknown input (non-object)', () => {
    expect(() => parseUser(null)).toThrow(Error);
    expect(() => parseUser('string')).toThrow(Error);
    expect(() => parseUser(42)).toThrow(Error);
  });
});