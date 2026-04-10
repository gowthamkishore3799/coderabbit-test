import { describe, it, expect, vi } from 'vitest';

// z.urls() is used in fools/files.ts but is not part of the standard zod v4.1.5 API.
// We mock the zod module to add z.urls before files.ts is imported.
// vi.mock is automatically hoisted before any imports by vitest.
vi.mock('zod', async (importOriginal) => {
  const original = await importOriginal<any>();
  // Add z.urls to the z namespace object (used in fools/files.ts: siteUrls: z.urls())
  if (original.z && !original.z.urls) {
    original.z.urls = () => original.z.array(original.z.url());
  }
  return original;
});

const { UserSchema, parseUser } = await import('./files');

// Minimal valid user object matching the current UserSchema (post-PR)
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'user' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Test bio',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('UserSchema', () => {
  describe('valid data', () => {
    it('accepts a fully valid user', () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('accepts all valid role values', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        const result = UserSchema.safeParse({ ...validUser, role });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all valid status values', () => {
      for (const status of ['active', 'inactive', 'banned'] as const) {
        const result = UserSchema.safeParse({ ...validUser, status });
        expect(result.success).toBe(true);
      }
    });

    it('accepts stringbool "false" for active', () => {
      const result = UserSchema.safeParse({ ...validUser, active: 'false' });
      expect(result.success).toBe(true);
    });

    it('accepts stringbool "1" and "0" for active', () => {
      expect(UserSchema.safeParse({ ...validUser, active: '1' }).success).toBe(true);
      expect(UserSchema.safeParse({ ...validUser, active: '0' }).success).toBe(true);
    });

    it('accepts stringbool "yes" and "no" for active', () => {
      expect(UserSchema.safeParse({ ...validUser, active: 'yes' }).success).toBe(true);
      expect(UserSchema.safeParse({ ...validUser, active: 'no' }).success).toBe(true);
    });

    it('accepts empty siteUrls array', () => {
      const result = UserSchema.safeParse({ ...validUser, siteUrls: [] });
      expect(result.success).toBe(true);
    });

    it('accepts user with optional bio omitted', () => {
      const userWithoutBio = {
        ...validUser,
        profile: { joined: new Date('2023-01-01') },
      };
      const result = UserSchema.safeParse(userWithoutBio);
      expect(result.success).toBe(true);
    });

    it('coerces string age to number', () => {
      const result = UserSchema.safeParse({ ...validUser, age: '30' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe('status field (changed from z.literal to z.enum in PR)', () => {
    it('rejects invalid status value', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
      expect(result.success).toBe(false);
    });

    it('rejects empty string for status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: '' });
      expect(result.success).toBe(false);
    });

    it('rejects numeric value for status', () => {
      const result = UserSchema.safeParse({ ...validUser, status: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('websiteUrl field (added in PR)', () => {
    it('accepts a valid HTTPS URL', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('accepts a valid HTTP URL', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'http://example.com' });
      expect(result.success).toBe(true);
    });

    it('rejects a plain string for websiteUrl', () => {
      const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const { websiteUrl: _, ...userWithout } = validUser as any;
      const result = UserSchema.safeParse(userWithout);
      expect(result.success).toBe(false);
    });
  });

  describe('portfolio field (added in PR)', () => {
    it('accepts a valid portfolio URL', () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: 'https://portfolio.dev' });
      expect(result.success).toBe(true);
    });

    it('rejects a plain string with no scheme for portfolio', () => {
      const result = UserSchema.safeParse({ ...validUser, portfolio: 'just-plain-text' });
      expect(result.success).toBe(false);
    });

    it('rejects missing portfolio', () => {
      const { portfolio: _, ...userWithout } = validUser as any;
      const result = UserSchema.safeParse(userWithout);
      expect(result.success).toBe(false);
    });
  });

  describe('siteUrls field (added in PR, uses z.urls())', () => {
    it('accepts multiple valid URLs', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ['https://a.com', 'https://b.com', 'https://c.com'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects a list containing an invalid URL', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        siteUrls: ['https://valid.com', 'not-a-url'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing siteUrls', () => {
      const { siteUrls: _, ...userWithout } = validUser as any;
      const result = UserSchema.safeParse(userWithout);
      expect(result.success).toBe(false);
    });
  });

  describe('format field (added in PR)', () => {
    it('accepts any string for format', () => {
      const result = UserSchema.safeParse({ ...validUser, format: 'xml' });
      expect(result.success).toBe(true);
    });

    it('accepts empty string for format (no min constraint)', () => {
      const result = UserSchema.safeParse({ ...validUser, format: '' });
      expect(result.success).toBe(true);
    });

    it('rejects missing format', () => {
      const { format: _, ...userWithout } = validUser as any;
      const result = UserSchema.safeParse(userWithout);
      expect(result.success).toBe(false);
    });
  });

  describe('id field', () => {
    it('rejects invalid UUID', () => {
      const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
      const result = UserSchema.safeParse({ ...validUser, id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('email field', () => {
    it('rejects invalid email', () => {
      const result = UserSchema.safeParse({ ...validUser, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('age field', () => {
    it('rejects age below 18', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 17 });
      expect(result.success).toBe(false);
    });

    it('accepts age exactly 18', () => {
      const result = UserSchema.safeParse({ ...validUser, age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe('role field', () => {
    it('rejects unknown role', () => {
      const result = UserSchema.safeParse({ ...validUser, role: 'superuser' });
      expect(result.success).toBe(false);
    });
  });

  describe('code field (template literal)', () => {
    it('accepts valid template literal code', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'user-1' });
      expect(result.success).toBe(true);
    });

    it('rejects code without user- prefix', () => {
      const result = UserSchema.safeParse({ ...validUser, code: 'admin-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('profile field (strictObject)', () => {
    it('rejects extra properties in strict profile object', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { ...validUser.profile, extra: 'field' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing joined date', () => {
      const result = UserSchema.safeParse({
        ...validUser,
        profile: { bio: 'bio' },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseUser', () => {
  it('returns parsed user for valid input', () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.email).toBe(validUser.email);
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe(validUser.websiteUrl);
    expect(user.portfolio).toBe(validUser.portfolio);
    expect(user.format).toBe(validUser.format);
  });

  it('throws for completely invalid input', () => {
    expect(() => parseUser({ id: 'bad', email: 'bad' })).toThrow();
  });

  it('throws an Error for invalid input', () => {
    // parseUser calls treeify() on the error; the exact format depends on zod version
    // but it must throw an Error instance
    let thrown: unknown;
    try {
      parseUser({ id: 'bad-uuid', email: 'not-an-email', age: 10 });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBeTruthy();
  });

  it('preserves the siteUrls array in output', () => {
    const urls = ['https://a.example.com', 'https://b.example.com'];
    const user = parseUser({ ...validUser, siteUrls: urls });
    expect(user.siteUrls).toEqual(urls);
  });

  it('preserves websiteUrl and portfolio in output', () => {
    const user = parseUser(validUser);
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.example.com');
  });

  // Regression: status field accepts only enum values (changed from z.literal in PR)
  it('regression: rejects status values outside the enum', () => {
    expect(() => parseUser({ ...validUser, status: 'suspended' })).toThrow();
  });

  // Regression: website field was REMOVED from schema in PR
  it('regression: removed "website" field is stripped when extra data is passed', () => {
    // zod strips unknown fields by default; the removed website field won't appear in output
    const result = UserSchema.safeParse({ ...validUser, website: 'https://old-field.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).website).toBeUndefined();
    }
  });
});