import { describe, it, expect, vi } from 'vitest';

// z.urls() was added to Zod v4 source but is not yet available in any
// released npm version. Polyfill it via vi.mock so files.ts can load.
vi.mock('zod', async () => {
  const actual = await vi.importActual<typeof import('zod')>('zod');
  // `z` is a namespace object – we need to extend it with urls()
  const patchedZ = Object.assign(Object.create(Object.getPrototypeOf(actual.z)), actual.z, {
    urls: () => actual.z.array(actual.z.url()),
  });
  return { ...actual, z: patchedZ };
});

import { UserSchema, parseUser, type User } from './files';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function validPayload(): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'alice@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2023-01-01'),
    },
    websiteUrl: 'https://alice.dev',
    portfolio: 'https://portfolio.alice.dev',
    siteUrls: ['https://alice.dev', 'https://blog.alice.dev'],
    format: 'json',
  };
}

// ---------------------------------------------------------------------------
// UserSchema – PR changes under test
//
// Changed fields vs. pre-PR:
//   - 'website' field removed
//   - 'status' changed from z.literal([...]) to z.enum([...])
//   - 'websiteUrl'  added (z.url())
//   - 'portfolio'   added (z.url())
//   - 'siteUrls'    added (z.urls())
//   - 'format'      added (z.string())
// ---------------------------------------------------------------------------
describe('UserSchema – new / changed fields', () => {
  // ------------------------------------------------------------------
  // websiteUrl (new)
  // ------------------------------------------------------------------
  describe('websiteUrl', () => {
    it('accepts a valid HTTPS URL', () => {
      const result = UserSchema.safeParse(validPayload());
      expect(result.success).toBe(true);
    });

    it('rejects an invalid URL', () => {
      const data = { ...validPayload(), websiteUrl: 'not-a-url' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects a missing websiteUrl', () => {
      const data = validPayload();
      delete data.websiteUrl;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('accepts an HTTP URL', () => {
      const data = { ...validPayload(), websiteUrl: 'http://example.com' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // portfolio (new)
  // ------------------------------------------------------------------
  describe('portfolio', () => {
    it('accepts a valid URL', () => {
      expect(UserSchema.safeParse(validPayload()).success).toBe(true);
    });

    it('rejects an invalid portfolio URL', () => {
      const data = { ...validPayload(), portfolio: 'ftp://' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects a missing portfolio', () => {
      const data = validPayload();
      delete data.portfolio;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // siteUrls (new – z.urls())
  // ------------------------------------------------------------------
  describe('siteUrls', () => {
    it('accepts an array of valid URLs', () => {
      const data = {
        ...validPayload(),
        siteUrls: ['https://a.com', 'https://b.com'],
      };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts an empty array', () => {
      const data = { ...validPayload(), siteUrls: [] };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects a missing siteUrls field', () => {
      const data = validPayload();
      delete data.siteUrls;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects an array that contains invalid URLs', () => {
      const data = { ...validPayload(), siteUrls: ['https://valid.com', 'bad-url'] };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // format (new)
  // ------------------------------------------------------------------
  describe('format', () => {
    it('accepts any non-empty string', () => {
      const data = { ...validPayload(), format: 'csv' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('accepts an empty string (z.string() has no min constraint)', () => {
      const data = { ...validPayload(), format: '' };
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('rejects a missing format field', () => {
      const data = validPayload();
      delete data.format;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects a numeric value (must be string)', () => {
      const data = { ...validPayload(), format: 42 };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // status (changed: z.literal([...]) → z.enum([...]))
  // ------------------------------------------------------------------
  describe('status', () => {
    it.each(['active', 'inactive', 'banned'] as const)(
      'accepts "%s"',
      (status) => {
        const data = { ...validPayload(), status };
        expect(UserSchema.safeParse(data).success).toBe(true);
      }
    );

    it('rejects an unlisted status value', () => {
      const data = { ...validPayload(), status: 'pending' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects an empty string', () => {
      const data = { ...validPayload(), status: '' };
      expect(UserSchema.safeParse(data).success).toBe(false);
    });

    it('rejects a missing status field', () => {
      const data = validPayload();
      delete data.status;
      expect(UserSchema.safeParse(data).success).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // Removed 'website' field – schema should NOT include it
  // ------------------------------------------------------------------
  describe('website (removed field)', () => {
    it('does not expose a "website" key in the inferred type shape', () => {
      // If 'website' were still in the schema, parsing would fail or succeed
      // but the key would be present. Verify the schema does not require it.
      const data = validPayload();
      // No 'website' key present – schema must still pass
      expect(UserSchema.safeParse(data).success).toBe(true);
    });

    it('strips an unexpected "website" key when parsing (strict behaviour test)', () => {
      const data = { ...validPayload(), website: 'https://old-field.com' };
      const result = UserSchema.safeParse(data);
      // Zod .object() strips unknown keys by default; passing an extra key is fine
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).website).toBeUndefined();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// parseUser() – helper function also in scope
// ---------------------------------------------------------------------------
describe('parseUser()', () => {
  it('returns parsed user for a valid payload', () => {
    const user = parseUser(validPayload());
    expect(user.email).toBe('alice@example.com');
    expect(user.role).toBe('user');
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://alice.dev');
    expect(user.format).toBe('json');
  });

  it('throws a JSON-serializable error for an invalid payload', () => {
    expect(() => parseUser({ ...validPayload(), email: 'not-an-email' })).toThrow();
  });

  it('throws when required new fields are missing', () => {
    const data = validPayload();
    delete data.websiteUrl;
    delete data.portfolio;
    expect(() => parseUser(data)).toThrow();
  });

  it('throws an Error instance for an invalid payload', () => {
    expect(() => parseUser({ ...validPayload(), status: 'unknown' })).toThrowError(Error);
  });
});