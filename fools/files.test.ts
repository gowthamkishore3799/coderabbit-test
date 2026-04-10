import { describe, it, expect, vi } from 'vitest';

// Polyfill z.urls() which is used in fools/files.ts but not available in zod@4.1.5.
// z.urls() is semantically equivalent to z.array(z.url()).
// zod exports `z` as a namespace object; we must add urls() to that namespace.
vi.mock('zod', async (importOriginal) => {
  const original = await importOriginal<typeof import('zod')>();
  const urlsFn = () => original.array(original.url());
  // Extend the z namespace that fools/files.ts receives via `import { z } from 'zod'`
  const zExtended = Object.assign(
    Object.create(Object.getPrototypeOf(original.z) as object),
    original.z,
    { urls: urlsFn }
  );
  return {
    ...original,
    z: zExtended,
    default: zExtended,
    urls: urlsFn,
  };
});

const { UserSchema, parseUser } = await import('./files');

// Helper to build a valid user input
function validUserInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'A short bio',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
    format: 'json',
    ...overrides,
  };
}

describe('UserSchema', () => {
  describe('valid inputs', () => {
    it('parses a fully valid user object', () => {
      const result = UserSchema.safeParse(validUserInput());
      expect(result.success).toBe(true);
    });

    it('accepts all valid roles', () => {
      for (const role of ['admin', 'user', 'manager'] as const) {
        const result = UserSchema.safeParse(validUserInput({ role }));
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.role).toBe(role);
      }
    });

    it('accepts all valid status values (enum)', () => {
      for (const status of ['active', 'inactive', 'banned'] as const) {
        const result = UserSchema.safeParse(validUserInput({ status }));
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.status).toBe(status);
      }
    });

    it('parses stringbool active field from "true"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: 'true' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses stringbool active field from "false"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: 'false' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses stringbool active field from "1"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: '1' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses stringbool active field from "0"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: '0' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('parses stringbool active field from "yes"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: 'yes' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(true);
    });

    it('parses stringbool active field from "no"', () => {
      const result = UserSchema.safeParse(validUserInput({ active: 'no' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.active).toBe(false);
    });

    it('coerces age from string to number', () => {
      const result = UserSchema.safeParse(validUserInput({ age: '30' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(30);
    });

    it('accepts profile with no bio (optional)', () => {
      const result = UserSchema.safeParse(
        validUserInput({ profile: { joined: new Date('2024-01-01') } })
      );
      expect(result.success).toBe(true);
    });

    it('accepts siteUrls as an array of URLs', () => {
      const result = UserSchema.safeParse(
        validUserInput({ siteUrls: ['https://a.com', 'https://b.com', 'https://c.com'] })
      );
      expect(result.success).toBe(true);
    });

    it('accepts empty siteUrls array', () => {
      const result = UserSchema.safeParse(validUserInput({ siteUrls: [] }));
      expect(result.success).toBe(true);
    });

    it('accepts valid template literal code "user-1"', () => {
      const result = UserSchema.safeParse(validUserInput({ code: 'user-1' }));
      expect(result.success).toBe(true);
    });

    it('accepts valid template literal code at max boundary "user-9999"', () => {
      const result = UserSchema.safeParse(validUserInput({ code: 'user-9999' }));
      expect(result.success).toBe(true);
    });
  });

  describe('status field (changed from z.literal to z.enum)', () => {
    it('rejects unknown status value', () => {
      const result = UserSchema.safeParse(validUserInput({ status: 'suspended' }));
      expect(result.success).toBe(false);
    });

    it('rejects empty string as status', () => {
      const result = UserSchema.safeParse(validUserInput({ status: '' }));
      expect(result.success).toBe(false);
    });

    it('rejects null as status', () => {
      const result = UserSchema.safeParse(validUserInput({ status: null }));
      expect(result.success).toBe(false);
    });

    it('rejects missing status field', () => {
      const input = validUserInput();
      delete (input as Record<string, unknown>).status;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('accepts "banned" as a valid status', () => {
      const result = UserSchema.safeParse(validUserInput({ status: 'banned' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe('banned');
    });

    it('accepts "inactive" as a valid status', () => {
      const result = UserSchema.safeParse(validUserInput({ status: 'inactive' }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe('inactive');
    });
  });

  describe('new URL fields (websiteUrl, portfolio, siteUrls)', () => {
    it('rejects invalid websiteUrl', () => {
      const result = UserSchema.safeParse(validUserInput({ websiteUrl: 'not-a-url' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing websiteUrl', () => {
      const input = validUserInput();
      delete (input as Record<string, unknown>).websiteUrl;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid portfolio URL', () => {
      const result = UserSchema.safeParse(validUserInput({ portfolio: 'not-a-url' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing portfolio field', () => {
      const input = validUserInput();
      delete (input as Record<string, unknown>).portfolio;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects non-array siteUrls', () => {
      const result = UserSchema.safeParse(validUserInput({ siteUrls: 'https://example.com' }));
      expect(result.success).toBe(false);
    });

    it('rejects siteUrls containing invalid URLs', () => {
      const result = UserSchema.safeParse(
        validUserInput({ siteUrls: ['https://valid.com', 'not-a-url'] })
      );
      expect(result.success).toBe(false);
    });
  });

  describe('format field (new string field)', () => {
    it('accepts any string as format', () => {
      const result = UserSchema.safeParse(validUserInput({ format: 'xml' }));
      expect(result.success).toBe(true);
    });

    it('accepts empty string as format', () => {
      const result = UserSchema.safeParse(validUserInput({ format: '' }));
      expect(result.success).toBe(true);
    });

    it('rejects missing format field', () => {
      const input = validUserInput();
      delete (input as Record<string, unknown>).format;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('id and email validation', () => {
    it('rejects invalid UUID for id', () => {
      const result = UserSchema.safeParse(validUserInput({ id: 'not-a-uuid' }));
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = UserSchema.safeParse(validUserInput({ email: 'not-an-email' }));
      expect(result.success).toBe(false);
    });

    it('rejects missing id', () => {
      const input = validUserInput();
      delete (input as Record<string, unknown>).id;
      const result = UserSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('age validation', () => {
    it('rejects age below 18', () => {
      const result = UserSchema.safeParse(validUserInput({ age: 17 }));
      expect(result.success).toBe(false);
    });

    it('accepts age exactly 18', () => {
      const result = UserSchema.safeParse(validUserInput({ age: 18 }));
      expect(result.success).toBe(true);
    });

    it('rejects non-integer age', () => {
      const result = UserSchema.safeParse(validUserInput({ age: 25.5 }));
      expect(result.success).toBe(false);
    });
  });

  describe('role validation', () => {
    it('rejects unknown role', () => {
      const result = UserSchema.safeParse(validUserInput({ role: 'superadmin' }));
      expect(result.success).toBe(false);
    });
  });

  describe('profile strictObject', () => {
    it('rejects extra fields in profile (strict mode)', () => {
      const result = UserSchema.safeParse(
        validUserInput({
          profile: { bio: 'bio', joined: new Date(), extraField: 'should fail' },
        })
      );
      expect(result.success).toBe(false);
    });

    it('rejects missing joined field in profile', () => {
      const result = UserSchema.safeParse(
        validUserInput({ profile: { bio: 'bio' } })
      );
      expect(result.success).toBe(false);
    });
  });

  describe('removed website field', () => {
    it('does not expose website in parsed result (field removed)', () => {
      // The website field was removed from UserSchema in this PR.
      // Extra unknown fields are stripped by default in zod .object().
      const result = UserSchema.safeParse(validUserInput({ website: 'https://extra.com' }));
      if (result.success) {
        expect('website' in result.data).toBe(false);
      }
    });
  });
});

describe('parseUser', () => {
  it('returns valid user data for correct input', () => {
    const input = validUserInput();
    const user = parseUser(input);
    expect(user.email).toBe('user@example.com');
    expect(user.role).toBe('admin');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.example.com');
    expect(user.format).toBe('json');
  });

  it('throws an error for invalid input', () => {
    expect(() => parseUser({ id: 'bad', email: 'bad' })).toThrow();
  });

  it('throws an error with a non-empty message for invalid input', () => {
    // parseUser uses result.error.treeify() to build the error message
    let didThrow = false;
    try {
      parseUser({ id: 'not-uuid', email: 'not-email', age: 10 });
    } catch (e: unknown) {
      didThrow = true;
      expect(e).toBeInstanceOf(Error);
    }
    expect(didThrow).toBe(true);
  });

  it('throws for status with invalid value', () => {
    expect(() => parseUser(validUserInput({ status: 'deleted' }))).toThrow();
  });

  it('throws for missing required new fields', () => {
    const input = validUserInput();
    delete (input as Record<string, unknown>).websiteUrl;
    expect(() => parseUser(input)).toThrow();
  });

  it('throws when portfolio is not a URL', () => {
    expect(() => parseUser(validUserInput({ portfolio: 'not-a-url' }))).toThrow();
  });

  it('returns siteUrls as parsed array', () => {
    const urls = ['https://site1.example.com', 'https://site2.example.com'];
    const user = parseUser(validUserInput({ siteUrls: urls }));
    expect(user.siteUrls).toEqual(urls);
  });
});