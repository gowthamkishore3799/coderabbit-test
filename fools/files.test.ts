/**
 * Tests for fools/files.ts (UserSchema changes in this PR).
 *
 * NOTE: fools/files.ts uses z.urls() which is not available in Zod v4.1.5.
 * The tests below use a locally-defined schema that mirrors the PR changes
 * (excluding z.urls()) to test the valid fields, plus a test documenting
 * the z.urls() issue.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror of UserSchema from fools/files.ts, substituting z.urls() with
// z.array(z.url()) since z.urls() does not exist in Zod v4.1.5.
// This allows us to test all PR-added fields in isolation.
const UserSchemaMirror = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  // Changed from z.literal(["active","inactive","banned"]) to z.enum in PR
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  // Added in PR
  websiteUrl: z.url(),
  portfolio: z.url(),
  siteUrls: z.array(z.url()), // z.urls() equivalent
  format: z.string(),
});

type User = z.infer<typeof UserSchemaMirror>;

function parseUserMirror(input: unknown): User {
  const result = UserSchemaMirror.safeParse(input);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.treeify()));
  }
  return result.data;
}

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello world',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'standard',
};

// Document the z.urls() issue - this is a bug introduced in the PR
describe('z.urls() availability (Zod v4 API check)', () => {
  it('z.urls() is not a function in the installed Zod version', () => {
    expect(typeof (z as unknown as Record<string, unknown>).urls).not.toBe('function');
  });

  it('importing fools/files.ts fails because z.urls() does not exist', async () => {
    await expect(import('./files')).rejects.toThrow(TypeError);
  });
});

describe('UserSchema status field (changed from z.literal to z.enum in PR)', () => {
  it('accepts "active" status', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts "inactive" status', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts "banned" status', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: 'banned' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status value', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects null status', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, status: null });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema websiteUrl field (added in PR)', () => {
  it('accepts a valid HTTPS URL', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, websiteUrl: 'https://my-site.com' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL string', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an absent websiteUrl', () => {
    const { websiteUrl: _, ...rest } = validUser;
    const result = UserSchemaMirror.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema portfolio field (added in PR)', () => {
  it('accepts a valid URL', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, portfolio: 'https://portfolio.dev' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, portfolio: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing portfolio field', () => {
    const { portfolio: _, ...rest } = validUser;
    const result = UserSchemaMirror.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema siteUrls field (added in PR as z.urls())', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchemaMirror.safeParse({
      ...validUser,
      siteUrls: ['https://site1.example.com', 'https://site2.example.com'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty array of URLs', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, siteUrls: [] });
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, siteUrls: ['https://valid.com', 'bad-url'] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing siteUrls field', () => {
    const { siteUrls: _, ...rest } = validUser;
    const result = UserSchemaMirror.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema format field (added in PR)', () => {
  it('accepts any string for format', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, format: 'json' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing format field', () => {
    const { format: _, ...rest } = validUser;
    const result = UserSchemaMirror.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema existing fields', () => {
  it('validates a fully correct user object', () => {
    const result = UserSchemaMirror.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID with custom message', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, id: 'bad-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('id'));
      expect(issue?.message).toBe('Invalid ID');
    }
  });

  it('rejects an invalid email with custom message', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('email'));
      expect(issue?.message).toBe('Invalid email');
    }
  });

  it('coerces age string to number', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects age below 18 with custom message', () => {
    const result = UserSchemaMirror.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('age'));
      expect(issue?.message).toBe('Must be 18+');
    }
  });

  it('rejects extra fields in profile (strictObject)', () => {
    const result = UserSchemaMirror.safeParse({
      ...validUser,
      profile: { bio: 'Hi', joined: new Date(), extraField: 'not allowed' },
    });
    expect(result.success).toBe(false);
  });

  it('allows profile without optional bio', () => {
    const result = UserSchemaMirror.safeParse({
      ...validUser,
      profile: { joined: new Date('2023-01-01') },
    });
    expect(result.success).toBe(true);
  });
});

describe('parseUser (mirror of fools/files.ts parseUser)', () => {
  it('returns parsed user for valid input', () => {
    const user = parseUserMirror(validUser);
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.portfolio).toBe('https://portfolio.example.com');
    expect(user.format).toBe('standard');
  });

  it('throws Error for invalid status', () => {
    expect(() => parseUserMirror({ ...validUser, status: 'invalid' })).toThrow(Error);
  });

  it('throws Error when required new PR fields are absent', () => {
    const { websiteUrl: _, portfolio: __, siteUrls: ___, format: ____, ...rest } = validUser;
    expect(() => parseUserMirror(rest)).toThrow(Error);
  });

  it('throws with a stringified error on invalid input', () => {
    try {
      parseUserMirror({ ...validUser, email: 'bad' });
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBeTruthy();
    }
  });
});