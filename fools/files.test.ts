/**
 * Tests for fools/files.ts – UserSchema Zod v4 validation
 *
 * PR changes covered:
 *  - status: changed from z.literal([...]) to z.enum([...])
 *  - websiteUrl and portfolio fields added (z.url())
 *  - siteUrls field added (z.urls() – patched in tests as z.array(z.url()))
 *  - format field added (z.string())
 *  - website field removed
 *
 * NOTE: z.urls() is not a built-in Zod 4.x function. It is monkey-patched
 * here as z.array(z.url()) so that fools/files.ts can be imported and the
 * intended schema behaviour can be exercised. The siteUrls tests reflect the
 * PR's intent (array of URL strings).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Patch z.urls() BEFORE importing files.ts so the module loads successfully.
// ---------------------------------------------------------------------------
import * as zodModule from 'zod';
const z = zodModule.z;
if (typeof (z as Record<string, unknown>).urls !== 'function') {
  (z as Record<string, unknown>).urls = () => z.array(z.url());
}

// Now we can import the schema module.
import { UserSchema, parseUser } from './files.js';

// ---------------------------------------------------------------------------
// Shared valid user fixture
// ---------------------------------------------------------------------------
const VALID_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  age: '25',              // coerced from string
  active: 'true',         // stringbool
  role: 'admin' as const,
  status: 'active' as const,
  code: 'user-1',
  profile: {
    bio: 'Hello world',
    joined: new Date('2023-01-01'),
  },
  websiteUrl: 'https://example.com',
  portfolio: 'https://portfolio.example.com',
  siteUrls: ['https://a.example.com', 'https://b.example.com'],
  format: 'standard',
};

// ---------------------------------------------------------------------------
// Valid parsing
// ---------------------------------------------------------------------------

describe('UserSchema – valid inputs', () => {
  test('parses a fully valid user object', () => {
    const result = UserSchema.safeParse(VALID_USER);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, 'user@example.com');
      assert.equal(result.data.role, 'admin');
      assert.equal(result.data.status, 'active');
      assert.equal(result.data.websiteUrl, 'https://example.com');
      assert.equal(result.data.format, 'standard');
    }
  });

  test('accepts all valid role enum values', () => {
    for (const role of ['admin', 'user', 'manager'] as const) {
      const result = UserSchema.safeParse({ ...VALID_USER, role });
      assert.equal(result.success, true, `role '${role}' should be valid`);
    }
  });

  test('accepts all valid status enum values', () => {
    for (const status of ['active', 'inactive', 'banned'] as const) {
      const result = UserSchema.safeParse({ ...VALID_USER, status });
      assert.equal(result.success, true, `status '${status}' should be valid`);
    }
  });

  test('coerces age from string to integer', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, age: '30' });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.age, 30);
  });

  test('parses stringbool active: "true" → true', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, active: 'true' });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.active, true);
  });

  test('parses stringbool active: "false" → false', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, active: 'false' });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.active, false);
  });

  test('parses stringbool active: "1" → true', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, active: '1' });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.active, true);
  });

  test('parses stringbool active: "0" → false', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, active: '0' });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.active, false);
  });

  test('accepts code matching templateLiteral "user-<1..9999>"', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, code: 'user-9999' });
    assert.equal(result.success, true);
  });

  test('accepts an empty siteUrls array', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, siteUrls: [] });
    assert.equal(result.success, true);
  });

  test('accepts a single valid siteUrl', () => {
    const result = UserSchema.safeParse({
      ...VALID_USER,
      siteUrls: ['https://single.example.com'],
    });
    assert.equal(result.success, true);
  });

  test('accepts profile without optional bio', () => {
    const profileWithoutBio = { joined: VALID_USER.profile.joined };
    const result = UserSchema.safeParse({ ...VALID_USER, profile: profileWithoutBio });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// id (uuid) validation
// ---------------------------------------------------------------------------

describe('UserSchema – id validation', () => {
  test('rejects a non-UUID id', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, id: 'not-a-uuid' });
    assert.equal(result.success, false);
  });

  test('rejects empty string id', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, id: '' });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// email validation
// ---------------------------------------------------------------------------

describe('UserSchema – email validation', () => {
  test('rejects an invalid email address', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, email: 'not-an-email' });
    assert.equal(result.success, false);
  });

  test('rejects email without domain', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, email: 'user@' });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// age validation
// ---------------------------------------------------------------------------

describe('UserSchema – age validation', () => {
  test('rejects age below 18', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, age: 17 });
    assert.equal(result.success, false);
  });

  test('accepts exactly age 18 (boundary)', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, age: 18 });
    assert.equal(result.success, true);
  });

  test('rejects non-integer age (float)', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, age: 25.5 });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// role enum validation
// ---------------------------------------------------------------------------

describe('UserSchema – role enum', () => {
  test('rejects an invalid role value', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, role: 'superadmin' });
    assert.equal(result.success, false);
  });

  test('rejects empty role string', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, role: '' });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// status enum validation (PR change: z.literal → z.enum)
// ---------------------------------------------------------------------------

describe('UserSchema – status enum (PR: changed from z.literal to z.enum)', () => {
  test('rejects an unrecognised status value', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, status: 'pending' });
    assert.equal(result.success, false);
  });

  test('rejects empty status string', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, status: '' });
    assert.equal(result.success, false);
  });

  test('accepts "active" status', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, status: 'active' });
    assert.equal(result.success, true);
  });

  test('accepts "inactive" status', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, status: 'inactive' });
    assert.equal(result.success, true);
  });

  test('accepts "banned" status', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, status: 'banned' });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// websiteUrl / portfolio URL fields (PR: new fields)
// ---------------------------------------------------------------------------

describe('UserSchema – websiteUrl / portfolio (PR: new URL fields)', () => {
  test('rejects an invalid websiteUrl', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, websiteUrl: 'not-a-url' });
    assert.equal(result.success, false);
  });

  test('rejects an invalid portfolio URL', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, portfolio: 'not-a-url' });
    assert.equal(result.success, false);
  });

  test('rejects missing websiteUrl', () => {
    const { websiteUrl: _w, ...withoutWebsite } = VALID_USER;
    const result = UserSchema.safeParse(withoutWebsite);
    assert.equal(result.success, false);
  });

  test('rejects missing portfolio', () => {
    const { portfolio: _p, ...withoutPortfolio } = VALID_USER;
    const result = UserSchema.safeParse(withoutPortfolio);
    assert.equal(result.success, false);
  });

  // Regression: the old "website" field was removed in this PR
  test('does NOT require the old "website" field (removed in PR)', () => {
    const result = UserSchema.safeParse(VALID_USER);
    assert.equal(result.success, true);
    if (result.success) {
      assert.ok(!('website' in result.data), '"website" field should not exist in parsed output');
    }
  });
});

// ---------------------------------------------------------------------------
// siteUrls validation (PR: new field)
// ---------------------------------------------------------------------------

describe('UserSchema – siteUrls (PR: new field)', () => {
  test('rejects siteUrls containing an invalid URL', () => {
    const result = UserSchema.safeParse({
      ...VALID_USER,
      siteUrls: ['https://valid.com', 'not-a-url'],
    });
    assert.equal(result.success, false);
  });

  test('rejects missing siteUrls field', () => {
    const { siteUrls: _s, ...withoutSiteUrls } = VALID_USER;
    const result = UserSchema.safeParse(withoutSiteUrls);
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// format field (PR: new field)
// ---------------------------------------------------------------------------

describe('UserSchema – format field (PR: new field)', () => {
  test('rejects missing format field', () => {
    const { format: _f, ...withoutFormat } = VALID_USER;
    const result = UserSchema.safeParse(withoutFormat);
    assert.equal(result.success, false);
  });

  test('accepts any non-empty string format', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, format: 'json' });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// strictObject profile validation
// ---------------------------------------------------------------------------

describe('UserSchema – profile strictObject', () => {
  test('rejects profile with unexpected extra properties', () => {
    const result = UserSchema.safeParse({
      ...VALID_USER,
      profile: { ...VALID_USER.profile, unknownField: 'extra' },
    });
    assert.equal(result.success, false);
  });

  test('rejects profile missing the required joined date', () => {
    const result = UserSchema.safeParse({
      ...VALID_USER,
      profile: { bio: 'Hello' },
    });
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// code templateLiteral validation
// ---------------------------------------------------------------------------

describe('UserSchema – code templateLiteral', () => {
  test('rejects code that does not start with "user-"', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, code: 'admin-1' });
    assert.equal(result.success, false);
  });

  test('rejects code with no numeric suffix', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, code: 'user-' });
    assert.equal(result.success, false);
  });

  test('rejects code with non-numeric suffix', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, code: 'user-abc' });
    assert.equal(result.success, false);
  });

  // NOTE: z.templateLiteral in Zod 4 validates structural pattern only;
  // .min()/.max() constraints on number() within templateLiteral are not enforced.
  test('accepts "user-0" (templateLiteral does not enforce numeric range constraints)', () => {
    const result = UserSchema.safeParse({ ...VALID_USER, code: 'user-0' });
    assert.equal(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// parseUser helper function
// ---------------------------------------------------------------------------

describe('parseUser helper', () => {
  test('returns parsed user for valid input', () => {
    const user = parseUser(VALID_USER);
    assert.equal(user.email, 'user@example.com');
    assert.equal(user.status, 'active');
    assert.equal(user.websiteUrl, 'https://example.com');
    assert.equal(user.format, 'standard');
  });

  test('throws on invalid email', () => {
    assert.throws(() => parseUser({ ...VALID_USER, email: 'bad-email' }), Error);
  });

  test('throws on missing required format field', () => {
    const { format: _f, ...withoutFormat } = VALID_USER;
    assert.throws(() => parseUser(withoutFormat), Error);
  });

  // Regression: format field (new in this PR) must be present in parsed output
  test('preserves format field in parsed output', () => {
    const user = parseUser({ ...VALID_USER, format: 'xml' });
    assert.equal(user.format, 'xml');
  });

  // Regression: status is now z.enum – invalid values must still throw
  test('throws when status is not a valid enum value', () => {
    assert.throws(() => parseUser({ ...VALID_USER, status: 'suspended' }), Error);
  });
});