/**
 * Tests for fools/file.ts
 *
 * PR change: removed the stray invalid line "asdkjbasdbkjbkjbas" that prevented
 * the module from being imported. The User schema and parseUser function logic
 * was not otherwise modified.
 *
 * These tests confirm the module now loads cleanly and its schema/parseUser
 * behaviour is correct.
 */

import { describe, it, expect } from 'vitest';
import { User, parseUser } from './file';
import { z } from 'zod';

function makeValidUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'admin',
    website: 'https://example.com',
    websites: ['https://a.example.com', 'https://b.example.com'],
    trail: 'https://trail.example.com',
    trails: 'some trail info',
    ...overrides,
  };
}

describe('fools/file.ts – module loads correctly after PR cleanup', () => {
  it('exports a User schema object', () => {
    expect(User).toBeDefined();
    expect(typeof User.safeParse).toBe('function');
  });

  it('exports a parseUser function', () => {
    expect(typeof parseUser).toBe('function');
  });
});

describe('User schema (fools/file.ts)', () => {
  it('accepts a fully valid user object', () => {
    expect(User.safeParse(makeValidUser()).success).toBe(true);
  });

  it('rejects when id is not a valid UUID', () => {
    expect(User.safeParse(makeValidUser({ id: 'not-a-uuid' })).success).toBe(false);
  });

  it('rejects when email is invalid', () => {
    expect(User.safeParse(makeValidUser({ email: 'not-an-email' })).success).toBe(false);
  });

  it('rejects when age is under 18', () => {
    expect(User.safeParse(makeValidUser({ age: 16 })).success).toBe(false);
  });

  it('accepts age exactly 18', () => {
    expect(User.safeParse(makeValidUser({ age: 18 })).success).toBe(true);
  });

  it('coerces age from string "25"', () => {
    expect(User.safeParse(makeValidUser({ age: '25' })).success).toBe(true);
  });

  it('rejects when active is not a truthy/falsy string', () => {
    expect(User.safeParse(makeValidUser({ active: 'maybe' })).success).toBe(false);
  });

  it('accepts active "false"', () => {
    expect(User.safeParse(makeValidUser({ active: 'false' })).success).toBe(true);
  });

  it('accepts active "1"', () => {
    expect(User.safeParse(makeValidUser({ active: '1' })).success).toBe(true);
  });

  it('accepts active "yes"', () => {
    expect(User.safeParse(makeValidUser({ active: 'yes' })).success).toBe(true);
  });

  it('rejects an invalid role', () => {
    expect(User.safeParse(makeValidUser({ role: 'superuser' })).success).toBe(false);
  });

  it('accepts all valid roles', () => {
    for (const role of ['admin', 'user', 'manager']) {
      expect(User.safeParse(makeValidUser({ role })).success).toBe(true);
    }
  });

  it('rejects website with a non-URL string', () => {
    expect(User.safeParse(makeValidUser({ website: 'not-a-url' })).success).toBe(false);
  });

  it('rejects when websites contains a non-URL entry', () => {
    expect(User.safeParse(makeValidUser({ websites: ['https://ok.com', 'bad'] })).success).toBe(false);
  });

  it('rejects when trails is empty string', () => {
    expect(User.safeParse(makeValidUser({ trails: '' })).success).toBe(false);
  });
});

describe('parseUser() from fools/file.ts', () => {
  it('returns the parsed user when input is valid', () => {
    const user = parseUser(makeValidUser());
    expect(user.email).toBe('user@example.com');
    expect(user.age).toBe(25);
  });

  it('throws an error when required field is missing', () => {
    const input = makeValidUser();
    delete (input as Record<string, unknown>).email;
    expect(() => parseUser(input)).toThrow();
  });

  it('throws an error when age is below 18', () => {
    expect(() => parseUser(makeValidUser({ age: 10 }))).toThrow();
  });

  it('throws an error when role is invalid', () => {
    expect(() => parseUser(makeValidUser({ role: 'hacker' }))).toThrow();
  });

  it('coerces age from string and returns numeric value', () => {
    const user = parseUser(makeValidUser({ age: '30' }));
    expect(user.age).toBe(30);
  });

  it('throws on completely non-object input', () => {
    expect(() => parseUser(null)).toThrow();
    expect(() => parseUser(42)).toThrow();
    expect(() => parseUser('string')).toThrow();
  });
});