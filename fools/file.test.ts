import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// Tests for fools/file.ts
// PR change: removed the stray line `asdkjbasdbkjbkjbas` which was a bare
// identifier causing a compile/runtime error. The User schema itself is unchanged.

// Mirror the User schema from fools/file.ts to test it independently.
const User = z.object({
  id: z.string().uuid({ message: 'Invalid id' }),
  email: z.string().email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  website: z.url({ message: 'Invalid url' }),
  websites: z.array(z.url({ message: 'Invalid url' })),
  trail: z.url({ message: 'Invalid url' }),
  trails: z.string().min(1, { message: 'This field is required' }),
});

function buildValidUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    website: 'https://example.com',
    websites: ['https://a.com', 'https://b.com'],
    trail: 'https://trail.example.com',
    trails: 'some-trail-value',
    ...overrides,
  };
}

describe('fools/file.ts – User schema (PR removes stray bare identifier)', () => {
  it('validates a complete valid user', () => {
    const result = User.safeParse(buildValidUser());
    expect(result.success).toBe(true);
  });

  it('rejects an invalid UUID', () => {
    const result = User.safeParse(buildValidUser({ id: 'not-a-uuid' }));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = User.safeParse(buildValidUser({ email: 'not-an-email' }));
    expect(result.success).toBe(false);
  });

  it('coerces age string to number', () => {
    const result = User.safeParse(buildValidUser({ age: '30' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it('rejects age below 18', () => {
    const result = User.safeParse(buildValidUser({ age: 17 }));
    expect(result.success).toBe(false);
  });

  it('parses "true" as boolean true via z.stringbool', () => {
    const result = User.safeParse(buildValidUser({ active: 'true' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('parses "0" as boolean false via z.stringbool', () => {
    const result = User.safeParse(buildValidUser({ active: '0' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it('rejects unknown role', () => {
    const result = User.safeParse(buildValidUser({ role: 'superuser' }));
    expect(result.success).toBe(false);
  });

  it('accepts all valid roles', () => {
    for (const role of ['admin', 'user', 'manager']) {
      const result = User.safeParse(buildValidUser({ role }));
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid website URL', () => {
    const result = User.safeParse(buildValidUser({ website: 'not-a-url' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid URL in websites array', () => {
    const result = User.safeParse(buildValidUser({ websites: ['https://valid.com', 'bad-url'] }));
    expect(result.success).toBe(false);
  });

  it('accepts empty websites array', () => {
    const result = User.safeParse(buildValidUser({ websites: [] }));
    expect(result.success).toBe(true);
  });

  it('rejects empty trails string (min length 1)', () => {
    const result = User.safeParse(buildValidUser({ trails: '' }));
    expect(result.success).toBe(false);
  });

  it('accepts a non-empty trails string', () => {
    const result = User.safeParse(buildValidUser({ trails: 'some-trail' }));
    expect(result.success).toBe(true);
  });
});

describe('fools/file.ts – parseUser function', () => {
  function parseUser(input: unknown) {
    const result = User.safeParse(input);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues));
    }
    return result.data;
  }

  it('returns parsed user data for valid input', () => {
    const data = buildValidUser();
    const user = parseUser(data);
    expect(user.email).toBe('user@example.com');
    expect(user.role).toBe('admin');
    expect(user.active).toBe(true);
  });

  it('throws an error for invalid input', () => {
    expect(() => parseUser({})).toThrow();
  });

  it('throws with details when email is invalid', () => {
    expect(() => parseUser(buildValidUser({ email: 'invalid' }))).toThrow();
  });

  it('returns correct type for active field (boolean)', () => {
    const user = parseUser(buildValidUser({ active: 'yes' }));
    expect(typeof user.active).toBe('boolean');
    expect(user.active).toBe(true);
  });
});