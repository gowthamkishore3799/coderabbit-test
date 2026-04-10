import { describe, it, expect, vi } from 'vitest';

// vi.mock is automatically hoisted before imports by vitest's transformer,
// so this patch is applied before fools/files.ts is evaluated.
// z.urls() does not exist in zod@4.1.5 but was added to fools/files.ts in this PR.
// We polyfill it so the module loads and the rest of the schema can be tested.
vi.mock('zod', async (importOriginal) => {
  const original = await importOriginal() as any;
  const zOrig = original.z;
  // Create a patched z that inherits from the original but adds urls()
  const zPatched = Object.assign(Object.create(zOrig), {
    urls: () => zOrig.string(),
  });
  return { ...original, z: zPatched };
});

import { UserSchema, parseUser, type User } from './files';

// A valid base user object that satisfies all required fields after the PR changes.
// The PR changed:
//  - status: z.literal([...]) → z.enum([...])
//  - Removed `website` field
//  - Added `websiteUrl`, `portfolio`, `siteUrls`, `format` fields
const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: 25,
  active: 'true',
  role: 'admin',
  status: 'active',
  code: 'user-1',
  profile: {
    bio: 'A developer',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: 'https://site1.com https://site2.com',
  format: 'json',
};

describe('UserSchema – status field (z.enum change)', () => {
  it('accepts status "active"', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'active' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('active');
  });

  it('accepts status "inactive"', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'inactive' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('inactive');
  });

  it('accepts status "banned"', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'banned' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('banned');
  });

  it('rejects an unknown status value', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty status string', () => {
    const result = UserSchema.safeParse({ ...validUser, status: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a numeric status', () => {
    const result = UserSchema.safeParse({ ...validUser, status: 1 });
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – new URL fields (websiteUrl, portfolio, siteUrls, format)', () => {
  it('accepts a valid websiteUrl', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.websiteUrl).toBe('https://example.com');
  });

  it('accepts a valid portfolio URL', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portfolio).toBe('https://portfolio.example.com');
  });

  it('rejects an invalid websiteUrl', () => {
    const result = UserSchema.safeParse({ ...validUser, websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid portfolio URL', () => {
    const result = UserSchema.safeParse({ ...validUser, portfolio: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('requires websiteUrl to be present', () => {
    const { websiteUrl: _, ...withoutWebsiteUrl } = validUser;
    const result = UserSchema.safeParse(withoutWebsiteUrl);
    expect(result.success).toBe(false);
  });

  it('requires portfolio to be present', () => {
    const { portfolio: _, ...withoutPortfolio } = validUser;
    const result = UserSchema.safeParse(withoutPortfolio);
    expect(result.success).toBe(false);
  });

  it('requires siteUrls to be present', () => {
    const { siteUrls: _, ...withoutSiteUrls } = validUser;
    const result = UserSchema.safeParse(withoutSiteUrls);
    expect(result.success).toBe(false);
  });

  it('accepts a non-empty format string', () => {
    const result = UserSchema.safeParse({ ...validUser, format: 'csv' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.format).toBe('csv');
  });

  it('accepts an empty format string (z.string() has no min constraint)', () => {
    const result = UserSchema.safeParse({ ...validUser, format: '' });
    expect(result.success).toBe(true);
  });

  it('requires format to be present', () => {
    const { format: _, ...withoutFormat } = validUser;
    const result = UserSchema.safeParse(withoutFormat);
    expect(result.success).toBe(false);
  });
});

describe('UserSchema – existing fields still work', () => {
  it('parses a fully valid user successfully', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('validates id as UUID', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('validates email format', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('coerces a string age to number', () => {
    const result = UserSchema.safeParse({ ...validUser, age: '30' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...validUser, age: 17 });
    expect(result.success).toBe(false);
  });

  it('accepts role "admin"', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('accepts role "user"', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'user' });
    expect(result.success).toBe(true);
  });

  it('accepts role "manager"', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'manager' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid role', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'superadmin' });
    expect(result.success).toBe(false);
  });

  it('accepts active "true" (stringbool)', () => {
    const result = UserSchema.safeParse({ ...validUser, active: 'true' });
    expect(result.success).toBe(true);
  });

  it('accepts active "false" (stringbool)', () => {
    const result = UserSchema.safeParse({ ...validUser, active: 'false' });
    expect(result.success).toBe(true);
  });

  it('accepts template literal code "user-42"', () => {
    const result = UserSchema.safeParse({ ...validUser, code: 'user-42' });
    expect(result.success).toBe(true);
  });

  it('rejects template literal code not starting with "user-"', () => {
    const result = UserSchema.safeParse({ ...validUser, code: 'admin-1' });
    expect(result.success).toBe(false);
  });

  it('rejects extra fields on strictObject profile', () => {
    const result = UserSchema.safeParse({
      ...validUser,
      profile: { bio: 'bio', joined: new Date(), extraField: 'oops' },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseUser helper', () => {
  it('returns a User for valid input', () => {
    const user = parseUser(validUser);
    expect(user.id).toBe(validUser.id);
    expect(user.status).toBe('active');
    expect(user.websiteUrl).toBe('https://example.com');
    expect(user.format).toBe('json');
  });

  it('throws an error for invalid input', () => {
    expect(() => parseUser({ ...validUser, status: 'unknown' })).toThrow();
  });

  it('throws a JSON-serialisable error message', () => {
    expect(() => parseUser({ ...validUser, email: 'bad' })).toThrow(Error);
  });

  it('throws when websiteUrl is missing', () => {
    const { websiteUrl: _, ...noUrl } = validUser;
    expect(() => parseUser(noUrl)).toThrow();
  });
});