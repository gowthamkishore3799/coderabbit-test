// Tests for fools/files.ts - UserSchema (Zod v4)
// Covers the PR changes: status field changed from z.literal to z.enum,
// removed `website` field, added websiteUrl/portfolio/siteUrls/format fields.

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { UserSchema, parseUser, type User } from './files';

// Minimal valid user payload satisfying the updated schema
function validUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'Hello world',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.com', 'https://site2.com'],
    format: 'json',
    ...overrides,
  };
}

describe('UserSchema – status field (changed from z.literal to z.enum)', () => {
  it('accepts status "active"', () => {
    const result = UserSchema.safeParse(validUser({ status: 'active' }));
    expect(result.success).toBe(true);
  });

  it('accepts status "inactive"', () => {
    const result = UserSchema.safeParse(validUser({ status: 'inactive' }));
    expect(result.success).toBe(true);
  });

  it('accepts status "banned"', () => {
    const result = UserSchema.safeParse(validUser({ status: 'banned' }));
    expect(result.success).toBe(true);
  });

  it('rejects an unknown status value', () => {
    const result = UserSchema.safeParse(validUser({ status: 'pending' }));
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status value', () => {
    const result = UserSchema.safeParse(validUser({ status: 1 }));
    expect(result.success).toBe(false);
  });

  it('rejects an empty status string', () => {
    const result = UserSchema.safeParse(validUser({ status: '' }));
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – new websiteUrl field', () => {
  it('accepts a valid HTTPS URL', () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: 'https://example.com' }));
    expect(result.success).toBe(true);
  });

  it('accepts a valid HTTP URL', () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: 'http://example.com' }));
    expect(result.success).toBe(true);
  });

  it('rejects a plain string that is not a URL', () => {
    const result = UserSchema.safeParse(validUser({ websiteUrl: 'not-a-url' }));
    expect(result.success).toBe(false);
  });

  it('rejects when websiteUrl is missing', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).websiteUrl;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – new portfolio field', () => {
  it('accepts a valid portfolio URL', () => {
    const result = UserSchema.safeParse(validUser({ portfolio: 'https://myportfolio.dev' }));
    expect(result.success).toBe(true);
  });

  it('rejects an invalid portfolio URL', () => {
    const result = UserSchema.safeParse(validUser({ portfolio: 'ftp://bad' }));
    // ftp:// is not a valid web URL
    expect(result.success).toBe(false);
  });

  it('rejects when portfolio is missing', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).portfolio;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – new siteUrls field (z.urls())', () => {
  it('accepts an array of valid URLs', () => {
    const result = UserSchema.safeParse(validUser({ siteUrls: ['https://a.com', 'https://b.com'] }));
    expect(result.success).toBe(true);
  });

  it('accepts an empty array of URLs', () => {
    const result = UserSchema.safeParse(validUser({ siteUrls: [] }));
    expect(result.success).toBe(true);
  });

  it('rejects an array containing an invalid URL', () => {
    const result = UserSchema.safeParse(validUser({ siteUrls: ['https://valid.com', 'not-a-url'] }));
    expect(result.success).toBe(false);
  });

  it('rejects when siteUrls is missing', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).siteUrls;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it('rejects a string instead of array', () => {
    const result = UserSchema.safeParse(validUser({ siteUrls: 'https://example.com' }));
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – new format field', () => {
  it('accepts any non-empty string as format', () => {
    const result = UserSchema.safeParse(validUser({ format: 'json' }));
    expect(result.success).toBe(true);
  });

  it('accepts an empty string for format (z.string() has no minimum)', () => {
    const result = UserSchema.safeParse(validUser({ format: '' }));
    expect(result.success).toBe(true);
  });

  it('rejects when format is missing', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).format;
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });

  it('rejects when format is not a string', () => {
    const result = UserSchema.safeParse(validUser({ format: 42 }));
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – removed website field', () => {
  it('ignores extra website field (strict object does not apply at root)', () => {
    // UserSchema is a z.object (not strictObject), so extra fields are stripped
    const result = UserSchema.safeParse(validUser({ website: 'https://example.com' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).website).toBeUndefined();
    }
  });
});

describe('UserSchema – existing fields still validated correctly', () => {
  it('rejects invalid UUID for id', () => {
    const result = UserSchema.safeParse(validUser({ id: 'not-a-uuid' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = UserSchema.safeParse(validUser({ email: 'invalid-email' }));
    expect(result.success).toBe(false);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse(validUser({ age: 17 }));
    expect(result.success).toBe(false);
  });

  it('coerces string age to number', () => {
    const result = UserSchema.safeParse(validUser({ age: '25' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });

  it('accepts valid role enum values', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = UserSchema.safeParse(validUser({ role }));
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown role', () => {
    const result = UserSchema.safeParse(validUser({ role: 'superadmin' }));
    expect(result.success).toBe(false);
  });
});

describe('parseUser helper', () => {
  it('returns parsed data for a valid user', () => {
    const input = validUser();
    const user = parseUser(input);
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe('active');
    expect(user.format).toBe('json');
  });

  it('throws an error for an invalid user', () => {
    expect(() => parseUser({ id: 'bad' })).toThrow();
  });

  it('throws an error when status is invalid', () => {
    expect(() => parseUser(validUser({ status: 'unknown' }))).toThrow();
  });

  it('throws an error when websiteUrl is missing', () => {
    const user = validUser();
    delete (user as Record<string, unknown>).websiteUrl;
    expect(() => parseUser(user)).toThrow();
  });
});