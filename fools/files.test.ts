import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Tests for fools/files.ts changes in this PR.
 *
 * NOTE: fools/files.ts cannot be imported directly because it uses z.urls()
 * which does not exist in the installed Zod version. The tests below reproduce
 * the schema changes from the PR inline so behavior can be verified, and
 * include a dedicated regression test for the z.urls() issue.
 */

// Reproduces the changed/added fields from the PR (status enum, websiteUrl, portfolio, format)
// siteUrls uses z.array(z.url()) as the correct replacement for z.urls()
const UserSchemaTestable = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  // Changed in PR: was z.literal([...]), now z.enum([...])
  status: z.enum(['active', 'inactive', 'banned']),
  code: z.templateLiteral([z.literal('user-'), z.number().min(1).max(9999)]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  // Added in PR:
  websiteUrl: z.url(),
  portfolio: z.url(),
  // siteUrls: z.urls() does not exist in Zod v4; correct form is z.array(z.url())
  siteUrls: z.array(z.url()),
  format: z.string(),
});

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-42',
  profile: {
    bio: 'Hello',
    joined: new Date('2024-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://site1.com', 'https://site2.com'],
  format: 'json',
};

describe('fools/files.ts – z.urls() regression', () => {
  it('z.urls should not be a function in the installed Zod version', () => {
    // This documents the bug introduced by the PR:
    // fools/files.ts uses z.urls() which does not exist in Zod v4
    expect(typeof (z as Record<string, unknown>).urls).not.toBe('function');
  });

  it('z.url() should be available as the correct Zod v4 URL validator', () => {
    expect(typeof z.url).toBe('function');
  });
});

describe('fools/files.ts – status field change (z.literal → z.enum)', () => {
  it('should accept "active"', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, status: 'active' }).success).toBe(true);
  });

  it('should accept "inactive"', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, status: 'inactive' }).success).toBe(true);
  });

  it('should accept "banned"', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, status: 'banned' }).success).toBe(true);
  });

  it('should reject an unlisted status value', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, status: 'pending' }).success).toBe(false);
  });

  it('should reject an empty string status', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, status: '' }).success).toBe(false);
  });
});

describe('fools/files.ts – websiteUrl field (added in PR)', () => {
  it('should accept a valid HTTPS URL', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, websiteUrl: 'https://example.com' }).success).toBe(true);
  });

  it('should accept a valid HTTP URL', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, websiteUrl: 'http://example.com' }).success).toBe(true);
  });

  it('should reject a non-URL string', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, websiteUrl: 'not-a-url' }).success).toBe(false);
  });

  it('should reject a missing websiteUrl', () => {
    const { websiteUrl, ...rest } = validUser;
    expect(UserSchemaTestable.safeParse(rest).success).toBe(false);
  });
});

describe('fools/files.ts – portfolio field (added in PR)', () => {
  it('should accept a valid URL', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, portfolio: 'https://portfolio.dev' }).success).toBe(true);
  });

  it('should reject a plain string', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, portfolio: 'my-portfolio' }).success).toBe(false);
  });

  it('should reject a missing portfolio', () => {
    const { portfolio, ...rest } = validUser;
    expect(UserSchemaTestable.safeParse(rest).success).toBe(false);
  });
});

describe('fools/files.ts – siteUrls field (added in PR)', () => {
  it('should accept an array of valid URLs', () => {
    expect(UserSchemaTestable.safeParse({
      ...validUser,
      siteUrls: ['https://a.com', 'https://b.com'],
    }).success).toBe(true);
  });

  it('should accept an empty array', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, siteUrls: [] }).success).toBe(true);
  });

  it('should reject an array containing an invalid URL', () => {
    expect(UserSchemaTestable.safeParse({
      ...validUser,
      siteUrls: ['https://valid.com', 'not-a-url'],
    }).success).toBe(false);
  });

  it('should reject a non-array value', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, siteUrls: 'https://single.com' }).success).toBe(false);
  });
});

describe('fools/files.ts – format field (added in PR)', () => {
  it('should accept any string for format', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, format: 'json' }).success).toBe(true);
  });

  it('should accept an empty string', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, format: '' }).success).toBe(true);
  });

  it('should reject a missing format field', () => {
    const { format, ...rest } = validUser;
    expect(UserSchemaTestable.safeParse(rest).success).toBe(false);
  });
});

describe('fools/files.ts – full schema regression', () => {
  it('should accept a fully valid user object', () => {
    expect(UserSchemaTestable.safeParse(validUser).success).toBe(true);
  });

  it('should reject an invalid UUID', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, id: 'bad-id' }).success).toBe(false);
  });

  it('should reject an invalid email', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, email: 'not-email' }).success).toBe(false);
  });

  it('should reject age below 18', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, age: 16 }).success).toBe(false);
  });

  it('should accept age exactly 18', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, age: 18 }).success).toBe(true);
  });

  it('should reject an invalid role', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, role: 'superuser' }).success).toBe(false);
  });

  it('should reject an invalid active value', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, active: 'maybe' }).success).toBe(false);
  });

  it('should parse "1" and "0" for stringbool active', () => {
    expect(UserSchemaTestable.safeParse({ ...validUser, active: '1' }).success).toBe(true);
    expect(UserSchemaTestable.safeParse({ ...validUser, active: '0' }).success).toBe(true);
  });
});