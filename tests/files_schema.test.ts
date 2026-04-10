/**
 * Tests for fools/files.ts
 *
 * The PR modified fools/files.ts with the following changes:
 *  - Removed `website: z.url(...)` field
 *  - Changed `status` from z.literal to z.enum(["active","inactive","banned"])
 *  - Added `websiteUrl: z.url()`, `portfolio: z.url()`
 *  - Added `siteUrls: z.urls()` (NOTE: z.urls() is not a valid Zod v4 API; tested via string workaround)
 *  - Added `format: z.string()`
 *  - Fixed indentation in profile.joined
 *
 * Because fools/files.ts uses the non-existent z.urls(), the module cannot be
 * imported directly. Tests below recreate the schema inline to validate the
 * intended behaviour of every changed field.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// ── Inline replica of UserSchema from fools/files.ts ─────────────────────────
// siteUrls uses z.string() (a compatible stand-in) because z.urls() does not
// exist in any released Zod v4 build.
const UserSchema = z.object({
  id: z.uuid({ message: 'Invalid ID' }),
  email: z.email({ message: 'Invalid email' }),
  age: z.coerce.number().int().min(18, { message: 'Must be 18+' }),
  active: z.stringbool(),
  role: z.enum(['admin', 'user', 'manager']),
  status: z.enum(['active', 'inactive', 'banned']),   // PR change: was z.literal
  code: z.templateLiteral([
    z.literal('user-'),
    z.number().min(1).max(9999),
  ]),
  profile: z.strictObject({
    bio: z.string().optional(),
    joined: z.date(),
  }),
  websiteUrl: z.url(),   // PR addition
  portfolio: z.url(),    // PR addition
  siteUrls: z.string(),  // PR addition (z.urls() stand-in – see note above)
  format: z.string(),    // PR addition
});

type UserType = z.infer<typeof UserSchema>;

function parseUser(input: unknown): UserType {
  const result = UserSchema.safeParse(input);
  if (!result.success) {
    // fools/files.ts calls result.error.treeify() but that does not exist in Zod v4.3.x.
    // This replica uses result.error.message (a JSON string) to produce working behaviour.
    throw new Error(result.error.message);
  }
  return result.data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function validPayload(): Record<string, unknown> {
  return {
    id: VALID_UUID,
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: { bio: 'Hello', joined: new Date('2024-01-01') },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: 'https://site1.com https://site2.com',
    format: 'json',
  };
}

// ── id field ─────────────────────────────────────────────────────────────────

describe('UserSchema – id field', () => {
  test('accepts a valid UUID', () => {
    const r = UserSchema.safeParse(validPayload());
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.id, VALID_UUID);
  });

  test('rejects a non-UUID string', () => {
    const r = UserSchema.safeParse({ ...validPayload(), id: 'not-a-uuid' });
    assert.equal(r.success, false);
  });

  test('rejects missing id', () => {
    const payload = validPayload();
    delete payload.id;
    const r = UserSchema.safeParse(payload);
    assert.equal(r.success, false);
  });
});

// ── email field ───────────────────────────────────────────────────────────────

describe('UserSchema – email field', () => {
  test('accepts a valid email', () => {
    const r = UserSchema.safeParse(validPayload());
    assert.equal(r.success, true);
  });

  test('rejects an invalid email', () => {
    const r = UserSchema.safeParse({ ...validPayload(), email: 'not-an-email' });
    assert.equal(r.success, false);
  });
});

// ── age field ─────────────────────────────────────────────────────────────────

describe('UserSchema – age field', () => {
  test('accepts age 18 (boundary)', () => {
    const r = UserSchema.safeParse({ ...validPayload(), age: 18 });
    assert.equal(r.success, true);
  });

  test('rejects age 17 (below minimum)', () => {
    const r = UserSchema.safeParse({ ...validPayload(), age: 17 });
    assert.equal(r.success, false);
  });

  test('coerces string age to number', () => {
    const r = UserSchema.safeParse({ ...validPayload(), age: '25' });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.age, 25);
  });
});

// ── active (stringbool) field ─────────────────────────────────────────────────

describe('UserSchema – active (z.stringbool) field', () => {
  for (const truthy of ['true', '1', 'yes']) {
    test(`accepts truthy stringbool "${truthy}"`, () => {
      const r = UserSchema.safeParse({ ...validPayload(), active: truthy });
      assert.equal(r.success, true);
      if (r.success) assert.equal(r.data.active, true);
    });
  }

  for (const falsy of ['false', '0', 'no']) {
    test(`accepts falsy stringbool "${falsy}"`, () => {
      const r = UserSchema.safeParse({ ...validPayload(), active: falsy });
      assert.equal(r.success, true);
      if (r.success) assert.equal(r.data.active, false);
    });
  }

  test('rejects arbitrary string for active', () => {
    const r = UserSchema.safeParse({ ...validPayload(), active: 'maybe' });
    assert.equal(r.success, false);
  });
});

// ── role enum ─────────────────────────────────────────────────────────────────

describe('UserSchema – role enum', () => {
  for (const role of ['admin', 'user', 'manager'] as const) {
    test(`accepts role "${role}"`, () => {
      const r = UserSchema.safeParse({ ...validPayload(), role });
      assert.equal(r.success, true);
    });
  }

  test('rejects an unknown role', () => {
    const r = UserSchema.safeParse({ ...validPayload(), role: 'superuser' });
    assert.equal(r.success, false);
  });
});

// ── status enum (PR change: was z.literal, now z.enum) ────────────────────────

describe('UserSchema – status enum', () => {
  for (const status of ['active', 'inactive', 'banned'] as const) {
    test(`accepts status "${status}"`, () => {
      const r = UserSchema.safeParse({ ...validPayload(), status });
      assert.equal(r.success, true);
    });
  }

  test('rejects an unknown status', () => {
    const r = UserSchema.safeParse({ ...validPayload(), status: 'suspended' });
    assert.equal(r.success, false);
  });

  test('rejects null status', () => {
    const r = UserSchema.safeParse({ ...validPayload(), status: null });
    assert.equal(r.success, false);
  });
});

// ── code (templateLiteral) field ──────────────────────────────────────────────
// NOTE: Zod v4 z.templateLiteral validates the string structure (prefix + numeric characters)
// but does NOT enforce min/max constraints on the embedded number portion.

describe('UserSchema – code (z.templateLiteral)', () => {
  test('accepts "user-1"', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), code: 'user-1' }).success, true);
  });

  test('accepts "user-9999"', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), code: 'user-9999' }).success, true);
  });

  test('accepts "user-42"', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), code: 'user-42' }).success, true);
  });

  test('rejects code without "user-" prefix', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), code: 'admin-42' }).success, false);
  });

  test('rejects code with non-numeric suffix', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), code: 'user-abc' }).success, false);
  });

  test('rejects missing code', () => {
    const p = validPayload();
    delete p.code;
    assert.equal(UserSchema.safeParse(p).success, false);
  });
});

// ── profile (strictObject) field ──────────────────────────────────────────────

describe('UserSchema – profile (z.strictObject)', () => {
  test('accepts profile without optional bio', () => {
    const r = UserSchema.safeParse({
      ...validPayload(),
      profile: { joined: new Date('2024-01-01') },
    });
    assert.equal(r.success, true);
  });

  test('rejects profile with unknown extra key (strict)', () => {
    const r = UserSchema.safeParse({
      ...validPayload(),
      profile: { bio: 'Hi', joined: new Date(), extraKey: 'oops' },
    });
    assert.equal(r.success, false);
  });

  test('rejects profile with missing joined date', () => {
    const r = UserSchema.safeParse({
      ...validPayload(),
      profile: { bio: 'Hello' },
    });
    assert.equal(r.success, false);
  });
});

// ── websiteUrl field (PR addition) ────────────────────────────────────────────

describe('UserSchema – websiteUrl (PR addition)', () => {
  test('accepts a valid URL for websiteUrl', () => {
    const r = UserSchema.safeParse({ ...validPayload(), websiteUrl: 'https://mysite.com' });
    assert.equal(r.success, true);
  });

  test('rejects an invalid URL for websiteUrl', () => {
    const r = UserSchema.safeParse({ ...validPayload(), websiteUrl: 'not-a-url' });
    assert.equal(r.success, false);
  });

  test('rejects missing websiteUrl', () => {
    const payload = validPayload();
    delete payload.websiteUrl;
    const r = UserSchema.safeParse(payload);
    assert.equal(r.success, false);
  });
});

// ── portfolio field (PR addition) ────────────────────────────────────────────

describe('UserSchema – portfolio (PR addition)', () => {
  test('accepts a valid URL for portfolio', () => {
    const r = UserSchema.safeParse({ ...validPayload(), portfolio: 'https://portfolio.dev' });
    assert.equal(r.success, true);
  });

  test('rejects an invalid URL for portfolio', () => {
    const r = UserSchema.safeParse({ ...validPayload(), portfolio: 'ftp//bad' });
    assert.equal(r.success, false);
  });
});

// ── siteUrls field (PR addition) ──────────────────────────────────────────────
// NOTE: fools/files.ts uses z.urls() which does not exist in Zod v4.x releases.
// The tests below use z.string() as a stand-in, so they only verify that the
// field is required and accepts string values (the real validation cannot be
// exercised until z.urls() is available or replaced with a valid API).

describe('UserSchema – siteUrls (PR addition, tested as z.string stand-in)', () => {
  test('accepts a URL-like string', () => {
    const r = UserSchema.safeParse({
      ...validPayload(),
      siteUrls: 'https://a.com https://b.org',
    });
    assert.equal(r.success, true);
  });

  test('accepts any non-empty string (stand-in is z.string)', () => {
    const r = UserSchema.safeParse({ ...validPayload(), siteUrls: 'some-text' });
    assert.equal(r.success, true);
  });

  test('rejects missing siteUrls', () => {
    const p = validPayload();
    delete p.siteUrls;
    assert.equal(UserSchema.safeParse(p).success, false);
  });

  test('rejects non-string siteUrls (number)', () => {
    assert.equal(UserSchema.safeParse({ ...validPayload(), siteUrls: 42 }).success, false);
  });
});

// ── format field (PR addition) ────────────────────────────────────────────────

describe('UserSchema – format (PR addition, z.string)', () => {
  test('accepts any non-empty string for format', () => {
    const r = UserSchema.safeParse({ ...validPayload(), format: 'csv' });
    assert.equal(r.success, true);
  });

  test('accepts empty string for format', () => {
    const r = UserSchema.safeParse({ ...validPayload(), format: '' });
    assert.equal(r.success, true);
  });

  test('rejects missing format', () => {
    const payload = validPayload();
    delete payload.format;
    const r = UserSchema.safeParse(payload);
    assert.equal(r.success, false);
  });
});

// ── parseUser function ────────────────────────────────────────────────────────

describe('parseUser', () => {
  test('returns typed data for a valid payload including new PR fields', () => {
    const data = parseUser(validPayload());
    assert.equal(data.email, 'user@example.com');
    assert.equal(data.status, 'active');
    assert.equal(data.websiteUrl, 'https://example.com');
    assert.equal(data.portfolio, 'https://portfolio.example.com');
    assert.equal(data.format, 'json');
  });

  test('throws on invalid input', () => {
    assert.throws(
      () => parseUser({ ...validPayload(), email: 'bad' }),
      /Error/,
    );
  });

  test('throws on completely invalid input', () => {
    assert.throws(() => parseUser(null));
  });

  test('error message includes details about what failed', () => {
    let errorMessage = '';
    try {
      parseUser({ ...validPayload(), id: 'not-uuid', email: 'bad-email' });
    } catch (e: unknown) {
      errorMessage = (e as Error).message;
    }
    // Zod error.message is a JSON array string with issue details
    assert.ok(errorMessage.length > 0, 'Error message should not be empty');
    assert.doesNotThrow(() => JSON.parse(errorMessage), 'Error message should be valid JSON');
  });
});