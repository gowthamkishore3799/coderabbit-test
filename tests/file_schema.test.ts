/**
 * Tests for fools/file.ts
 *
 * The PR change in this file was minor: removal of the invalid bare identifier
 * `asdkjbasdbkjbkjbas` that caused a parse/reference error. No schema logic
 * was altered, so these tests verify the existing User schema and parseUser
 * helper work correctly after the cleanup.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { User, parseUser } from '../fools/file.ts';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function validUser(): Record<string, unknown> {
  return {
    id: VALID_UUID,
    email: 'alice@example.com',
    age: 21,
    active: 'true',
    role: 'user',
    website: 'https://alice.example.com',
    websites: ['https://a.example.com', 'https://b.example.com'],
    trail: 'https://trail.example.com',
    trails: 'some trail text',
  };
}

// ── id (z.string().uuid) ──────────────────────────────────────────────────────

describe('User schema – id', () => {
  test('accepts a valid UUID', () => {
    const r = User.safeParse(validUser());
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.id, VALID_UUID);
  });

  test('rejects a non-UUID string with the custom message', () => {
    const r = User.safeParse({ ...validUser(), id: 'not-a-uuid' });
    assert.equal(r.success, false);
    if (!r.success) {
      const issue = r.error.issues[0];
      assert.ok(issue.message.includes('Invalid id'), `Expected "Invalid id" but got "${issue.message}"`);
    }
  });
});

// ── email (z.string().email) ──────────────────────────────────────────────────

describe('User schema – email', () => {
  test('accepts a valid email address', () => {
    assert.equal(User.safeParse(validUser()).success, true);
  });

  test('rejects an invalid email with the custom message', () => {
    const r = User.safeParse({ ...validUser(), email: 'bad-email' });
    assert.equal(r.success, false);
    if (!r.success) {
      const issue = r.error.issues[0];
      assert.ok(issue.message.includes('Invalid email'), `Expected "Invalid email" but got "${issue.message}"`);
    }
  });
});

// ── age (z.coerce.number().int().min(18)) ─────────────────────────────────────

describe('User schema – age', () => {
  test('accepts age exactly 18', () => {
    assert.equal(User.safeParse({ ...validUser(), age: 18 }).success, true);
  });

  test('rejects age 17', () => {
    assert.equal(User.safeParse({ ...validUser(), age: 17 }).success, false);
  });

  test('coerces string "30" to number', () => {
    const r = User.safeParse({ ...validUser(), age: '30' });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.age, 30);
  });

  test('rejects float age (not an integer)', () => {
    assert.equal(User.safeParse({ ...validUser(), age: 18.5 }).success, false);
  });
});

// ── active (z.stringbool) ─────────────────────────────────────────────────────

describe('User schema – active (z.stringbool)', () => {
  for (const v of ['true', '1', 'yes']) {
    test(`parses "${v}" as true`, () => {
      const r = User.safeParse({ ...validUser(), active: v });
      assert.equal(r.success, true);
      if (r.success) assert.equal(r.data.active, true);
    });
  }

  for (const v of ['false', '0', 'no']) {
    test(`parses "${v}" as false`, () => {
      const r = User.safeParse({ ...validUser(), active: v });
      assert.equal(r.success, true);
      if (r.success) assert.equal(r.data.active, false);
    });
  }

  test('rejects "maybe"', () => {
    assert.equal(User.safeParse({ ...validUser(), active: 'maybe' }).success, false);
  });
});

// ── role (z.enum) ─────────────────────────────────────────────────────────────

describe('User schema – role', () => {
  for (const role of ['admin', 'user', 'manager'] as const) {
    test(`accepts role "${role}"`, () => {
      assert.equal(User.safeParse({ ...validUser(), role }).success, true);
    });
  }

  test('rejects unknown role "guest"', () => {
    assert.equal(User.safeParse({ ...validUser(), role: 'guest' }).success, false);
  });
});

// ── website / trail (z.url) ───────────────────────────────────────────────────

describe('User schema – website and trail (z.url)', () => {
  test('accepts valid HTTPS URL for website', () => {
    assert.equal(User.safeParse({ ...validUser(), website: 'https://example.com' }).success, true);
  });

  test('rejects non-URL for website', () => {
    assert.equal(User.safeParse({ ...validUser(), website: 'not-a-url' }).success, false);
  });

  test('accepts valid URL for trail', () => {
    assert.equal(User.safeParse({ ...validUser(), trail: 'https://trail.dev' }).success, true);
  });

  test('rejects non-URL for trail', () => {
    assert.equal(User.safeParse({ ...validUser(), trail: 'not-a-url' }).success, false);
  });
});

// ── websites (z.array(z.url)) ─────────────────────────────────────────────────

describe('User schema – websites (array of URLs)', () => {
  test('accepts an array of valid URLs', () => {
    assert.equal(
      User.safeParse({ ...validUser(), websites: ['https://a.com', 'https://b.org'] }).success,
      true,
    );
  });

  test('accepts an empty array', () => {
    assert.equal(User.safeParse({ ...validUser(), websites: [] }).success, true);
  });

  test('rejects array containing non-URL', () => {
    assert.equal(
      User.safeParse({ ...validUser(), websites: ['https://ok.com', 'not-a-url'] }).success,
      false,
    );
  });
});

// ── trails (z.string().min(1)) ────────────────────────────────────────────────

describe('User schema – trails (non-empty string)', () => {
  test('accepts any non-empty string', () => {
    assert.equal(User.safeParse({ ...validUser(), trails: 'some text' }).success, true);
  });

  test('rejects empty string', () => {
    assert.equal(User.safeParse({ ...validUser(), trails: '' }).success, false);
  });
});

// ── parseUser ─────────────────────────────────────────────────────────────────

describe('parseUser helper', () => {
  test('returns the validated user for a valid payload', () => {
    const user = parseUser(validUser());
    assert.equal(user.email, 'alice@example.com');
    assert.equal(user.role, 'user');
    assert.equal(user.active, true);
  });

  test('throws an Error on invalid input', () => {
    assert.throws(
      () => parseUser({ ...validUser(), email: 'not-an-email' }),
      (err: unknown) => err instanceof Error,
    );
  });

  test('throws on null input', () => {
    assert.throws(() => parseUser(null));
  });

  test('throws on completely empty object', () => {
    assert.throws(() => parseUser({}));
  });
});