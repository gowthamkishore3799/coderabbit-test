/**
 * Tests for fools/file.ts – User schema (Zod v4).
 *
 * PR change: removed the stray `asdkjbasdbkjbkjbas` line that caused a
 * syntax/parse error, leaving the User schema intact and importable.
 *
 * These tests verify the schema continues to work correctly after the cleanup.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { User, parseUser } from './file.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validUserData() {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    age: 25,
    active: 'true',
    role: 'admin' as const,
    website: 'https://example.com',
    websites: ['https://site1.com', 'https://site2.com'],
    trail: 'https://trail.example.com',
    trails: 'some trail text',
  };
}

// ---------------------------------------------------------------------------
// Tests: schema accepts valid data
// ---------------------------------------------------------------------------

describe('User schema – valid inputs', () => {
  test('accepts a fully valid user object', () => {
    const result = User.safeParse(validUserData());
    assert.ok(result.success, JSON.stringify(result.error?.issues));
  });

  test('active "true" is parsed to boolean true by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: 'true' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, true);
  });

  test('active "false" is parsed to boolean false by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: 'false' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, false);
  });

  test('active "1" is parsed to boolean true by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: '1' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, true);
  });

  test('active "0" is parsed to boolean false by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: '0' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, false);
  });

  test('active "yes" is parsed to boolean true by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: 'yes' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, true);
  });

  test('active "no" is parsed to boolean false by stringbool', () => {
    const result = User.safeParse({ ...validUserData(), active: 'no' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.active, false);
  });

  test('age is coerced from a numeric string', () => {
    const result = User.safeParse({ ...validUserData(), age: '30' });
    assert.ok(result.success);
    if (result.success) assert.strictEqual(result.data.age, 30);
  });

  test('websites can be an empty array', () => {
    const result = User.safeParse({ ...validUserData(), websites: [] });
    assert.ok(result.success);
  });

  test('all three role values are accepted', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = User.safeParse({ ...validUserData(), role });
      assert.ok(result.success, `Expected role "${role}" to be accepted`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: schema rejects invalid data
// ---------------------------------------------------------------------------

describe('User schema – invalid inputs', () => {
  test('rejects a non-UUID id', () => {
    const result = User.safeParse({ ...validUserData(), id: 'not-a-uuid' });
    assert.ok(!result.success);
  });

  test('rejects an invalid email', () => {
    const result = User.safeParse({ ...validUserData(), email: 'not-an-email' });
    assert.ok(!result.success);
  });

  test('rejects age below 18', () => {
    const result = User.safeParse({ ...validUserData(), age: 17 });
    assert.ok(!result.success);
  });

  test('rejects age of exactly 17 when coerced from string', () => {
    const result = User.safeParse({ ...validUserData(), age: '17' });
    assert.ok(!result.success);
  });

  test('rejects an invalid website URL', () => {
    const result = User.safeParse({ ...validUserData(), website: 'not-a-url' });
    assert.ok(!result.success);
  });

  test('rejects an invalid URL in the websites array', () => {
    const result = User.safeParse({ ...validUserData(), websites: ['https://valid.com', 'bad-url'] });
    assert.ok(!result.success);
  });

  test('rejects an invalid trail URL', () => {
    const result = User.safeParse({ ...validUserData(), trail: 'not-a-url' });
    assert.ok(!result.success);
  });

  test('rejects an unknown role', () => {
    const result = User.safeParse({ ...validUserData(), role: 'superadmin' });
    assert.ok(!result.success);
  });

  test('rejects a null input', () => {
    const result = User.safeParse(null);
    assert.ok(!result.success);
  });

  test('rejects an empty object', () => {
    const result = User.safeParse({});
    assert.ok(!result.success);
  });

  test('trails must be a non-empty string (min length 1)', () => {
    const result = User.safeParse({ ...validUserData(), trails: '' });
    assert.ok(!result.success);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseUser helper function
// ---------------------------------------------------------------------------

describe('parseUser function', () => {
  test('returns parsed data for valid input', () => {
    const data = validUserData();
    const parsed = parseUser(data);
    assert.strictEqual(parsed.email, data.email);
    assert.strictEqual(parsed.role, data.role);
    // active should be a boolean after parsing
    assert.strictEqual(typeof parsed.active, 'boolean');
  });

  test('throws for invalid input', () => {
    assert.throws(
      () => parseUser({ id: 'bad-id', email: 'not-email', age: 10, active: 'yes', role: 'admin', website: 'bad', websites: [], trail: 'bad', trails: 'ok' }),
      Error
    );
  });

  test('throws when required fields are missing', () => {
    assert.throws(() => parseUser({}), Error);
  });

  test('throws when id is not a valid UUID', () => {
    assert.throws(
      () => parseUser({ ...validUserData(), id: '12345' }),
      Error
    );
  });

  test('returns active as boolean true when given "true"', () => {
    const parsed = parseUser({ ...validUserData(), active: 'true' });
    assert.strictEqual(parsed.active, true);
  });

  test('returns active as boolean false when given "false"', () => {
    const parsed = parseUser({ ...validUserData(), active: 'false' });
    assert.strictEqual(parsed.active, false);
  });
});

// ---------------------------------------------------------------------------
// Tests: module was correctly cleaned up (PR removed garbage line)
// ---------------------------------------------------------------------------

describe('module cleanup verification', () => {
  test('User schema is exported and is a Zod object schema', () => {
    assert.ok(User !== undefined, 'User export should exist');
    assert.strictEqual(typeof User.safeParse, 'function', 'User should have safeParse method');
    assert.strictEqual(typeof User.parse, 'function', 'User should have parse method');
  });

  test('parseUser is exported as a function', () => {
    assert.strictEqual(typeof parseUser, 'function');
  });
});