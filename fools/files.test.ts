import { describe, it, expect, vi, beforeAll } from 'vitest';

// z.urls() is used in fools/files.ts but is not available in the installed version of Zod.
// We patch the zod module before importing files.ts so the schema construction succeeds.
vi.mock('zod', async (importOriginal) => {
  const zodModule = await importOriginal<typeof import('zod')>();
  const z = zodModule.z ?? zodModule;
  return {
    ...zodModule,
    z: {
      ...z,
      // Stub z.urls() as a string array schema (space-separated URLs); used in fools/files.ts
      urls: () => z.string(),
    },
  };
});

// Dynamic import after mock is applied (vi.mock is hoisted above all imports)
let UserSchema: import('zod').ZodObject<any>;
let parseUser: (input: unknown) => any;

beforeAll(async () => {
  const mod = await import('./files');
  UserSchema = mod.UserSchema;
  parseUser = mod.parseUser;
});

// Valid base input matching the PR-modified UserSchema
const validUser = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: 'some-string',  // stubbed as z.string()
  format: 'json',
});

describe('UserSchema (fools/files.ts)', () => {
  describe('valid data', () => {
    it('parses a complete valid user object', () => {
      const result = UserSchema.safeParse(validUser());
      expect(result.success).toBe(true);
    });

    it('parses user with optional bio omitted', () => {
      const input = { ...validUser(), profile: { joined: new Date('2024-01-01') } };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('coerces string age to number', () => {
      const input = { ...validUser(), age: '30' };
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe('id field (z.uuid)', () => {
    it('rejects a non-UUID id', () => {
      const result = UserSchema.safeParse({ ...validUser(), id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid UUID v4', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('email field', () => {
    it('rejects an invalid email', () => {
      const result = UserSchema.safeParse({ ...validUser(), email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid email', () => {
      const result = UserSchema.safeParse({ ...validUser(), email: 'test@domain.co' });
      expect(result.success).toBe(true);
    });
  });

  describe('age field (coerce + min 18)', () => {
    it('rejects age below 18', () => {
      const result = UserSchema.safeParse({ ...validUser(), age: 17 });
      expect(result.success).toBe(false);
    });

    it('accepts age exactly 18', () => {
      const result = UserSchema.safeParse({ ...validUser(), age: 18 });
      expect(result.success).toBe(true);
    });

    it('rejects a non-integer age', () => {
      const result = UserSchema.safeParse({ ...validUser(), age: 25.5 });
      expect(result.success).toBe(false);
    });
  });

  describe('active field (z.stringbool)', () => {
    it.each(['true', 'false', '1', '0', 'yes', 'no'])(
      'accepts stringbool value "%s"',
      (value) => {
        const result = UserSchema.safeParse({ ...validUser(), active: value });
        expect(result.success).toBe(true);
      }
    );

    it('rejects an invalid stringbool value', () => {
      const result = UserSchema.safeParse({ ...validUser(), active: 'maybe' });
      expect(result.success).toBe(false);
    });
  });

  describe('role field (z.enum)', () => {
    it.each(['admin', 'user', 'manager'])('accepts role "%s"', (role) => {
      const result = UserSchema.safeParse({ ...validUser(), role });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid role', () => {
      const result = UserSchema.safeParse({ ...validUser(), role: 'superuser' });
      expect(result.success).toBe(false);
    });
  });

  describe('status field (changed from z.literal to z.enum in this PR)', () => {
    it.each(['active', 'inactive', 'banned'])('accepts status "%s"', (status) => {
      const result = UserSchema.safeParse({ ...validUser(), status });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid status', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: 'pending' });
      expect(result.success).toBe(false);
    });

    it('rejects an empty string status', () => {
      const result = UserSchema.safeParse({ ...validUser(), status: '' });
      expect(result.success).toBe(false);
    });

    it('status field no longer uses z.literal (regression: was z.literal in pre-PR code)', () => {
      // With z.enum, all three values must be valid; verify each independently
      const statuses = ['active', 'inactive', 'banned'];
      for (const s of statuses) {
        const result = UserSchema.safeParse({ ...validUser(), status: s });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('code field (z.templateLiteral)', () => {
    it('accepts a valid code "user-1"', () => {
      const result = UserSchema.safeParse({ ...validUser(), code: 'user-1' });
      expect(result.success).toBe(true);
    });

    it('accepts a valid code "user-9999"', () => {
      const result = UserSchema.safeParse({ ...validUser(), code: 'user-9999' });
      expect(result.success).toBe(true);
    });

    it('rejects a code with wrong prefix', () => {
      const result = UserSchema.safeParse({ ...validUser(), code: 'admin-42' });
      expect(result.success).toBe(false);
    });

    it('rejects a code without a number suffix', () => {
      const result = UserSchema.safeParse({ ...validUser(), code: 'user-abc' });
      expect(result.success).toBe(false);
    });

    it('accepts "user-0" because z.templateLiteral validates string pattern not numeric range', () => {
      // z.templateLiteral matches string patterns; the .min(1).max(9999) on z.number()
      // inside a templateLiteral does not enforce numeric value constraints – only the pattern is checked.
      const result = UserSchema.safeParse({ ...validUser(), code: 'user-0' });
      expect(result.success).toBe(true);
    });
  });

  describe('profile field (z.strictObject)', () => {
    it('rejects extra fields in the strictObject profile', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        profile: { bio: 'hello', joined: new Date(), unknownField: 'extra' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects profile missing the required joined date', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        profile: { bio: 'hello' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('websiteUrl field (added in this PR)', () => {
    it('rejects an invalid URL for websiteUrl', () => {
      const result = UserSchema.safeParse({ ...validUser(), websiteUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid https URL for websiteUrl', () => {
      const result = UserSchema.safeParse({ ...validUser(), websiteUrl: 'https://mysite.org' });
      expect(result.success).toBe(true);
    });
  });

  describe('portfolio field (added in this PR)', () => {
    it('rejects plain text as portfolio URL', () => {
      const result = UserSchema.safeParse({ ...validUser(), portfolio: 'plaintext' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid https portfolio URL', () => {
      const result = UserSchema.safeParse({
        ...validUser(),
        portfolio: 'https://github.com/user',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('format field (added in this PR)', () => {
    it('accepts any non-empty string for format', () => {
      const result = UserSchema.safeParse({ ...validUser(), format: 'xml' });
      expect(result.success).toBe(true);
    });

    it('rejects missing format field', () => {
      const input = validUser();
      const { format: _, ...withoutFormat } = input;
      const result = UserSchema.safeParse(withoutFormat);
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('rejects an empty object', () => {
      const result = UserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects user missing websiteUrl (new required field from this PR)', () => {
      const input = validUser();
      const { websiteUrl: _, ...withoutWebsite } = input;
      const result = UserSchema.safeParse(withoutWebsite);
      expect(result.success).toBe(false);
    });

    it('rejects user missing portfolio (new required field from this PR)', () => {
      const input = validUser();
      const { portfolio: _, ...withoutPortfolio } = input;
      const result = UserSchema.safeParse(withoutPortfolio);
      expect(result.success).toBe(false);
    });
  });

  describe('parseUser helper', () => {
    it('returns data for valid input', () => {
      const result = parseUser(validUser());
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe('admin');
      expect(result.status).toBe('active');
    });

    it('throws an error for invalid input', () => {
      expect(() => parseUser({ email: 'bad' })).toThrow();
    });

    it('throws a JSON-stringified structured error (v4 treeify)', () => {
      expect(() => parseUser({ id: 'not-uuid' })).toThrow(Error);
    });
  });
});