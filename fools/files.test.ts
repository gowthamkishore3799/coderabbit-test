/**
 * Tests for fools/files.ts UserSchema (PR changes)
 *
 * This PR changed:
 *   - status: z.literal([...]) → z.enum(["active", "inactive", "banned"])
 *   - Removed: website field
 *   - Added: websiteUrl (z.url()), portfolio (z.url()), siteUrls (z.urls()), format (z.string())
 *
 * NOTE: z.urls() is not yet available in Zod v4.3.6. The source file fools/files.ts
 * uses z.urls() which causes a runtime error when the module loads. Once z.urls() is
 * available in Zod or replaced with z.array(z.url()), these tests will run and validate
 * the schema behavior described below.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserSchema, parseUser } from './files.ts';

// Baseline valid user object matching all UserSchema fields
function makeValidUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    age: 25,
    active: 'true',
    role: 'user',
    status: 'active',
    code: 'user-42',
    profile: {
      bio: 'A test user',
      joined: new Date('2024-01-01'),
    },
    websiteUrl: 'https://example.com',
    portfolio: 'https://portfolio.example.com',
    siteUrls: ['https://site1.com', 'https://site2.com'],
    format: 'json',
    ...overrides,
  };
}

describe('UserSchema (files.ts PR changes)', () => {
  describe('status field (changed from z.literal to z.enum)', () => {
    it('accepts "active" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'active' }));
      assert.ok(result.success, `Expected success but got: ${!result.success ? JSON.stringify(result.error.issues) : ''}`);
      if (result.success) assert.equal(result.data.status, 'active');
    });

    it('accepts "inactive" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'inactive' }));
      assert.ok(result.success);
      if (result.success) assert.equal(result.data.status, 'inactive');
    });

    it('accepts "banned" as a valid status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'banned' }));
      assert.ok(result.success);
      if (result.success) assert.equal(result.data.status, 'banned');
    });

    it('rejects an invalid status value', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 'pending' }));
      assert.ok(!result.success);
    });

    it('rejects an empty string for status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: '' }));
      assert.ok(!result.success);
    });

    it('rejects a numeric status', () => {
      const result = UserSchema.safeParse(makeValidUser({ status: 1 }));
      assert.ok(!result.success);
    });
  });

  describe('websiteUrl field (added in PR)', () => {
    it('accepts a valid HTTPS URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'https://example.com' }));
      assert.ok(result.success);
    });

    it('accepts a valid HTTP URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'http://example.com' }));
      assert.ok(result.success);
    });

    it('rejects a non-URL string', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: 'not-a-url' }));
      assert.ok(!result.success);
    });

    it('rejects an empty string for websiteUrl', () => {
      const result = UserSchema.safeParse(makeValidUser({ websiteUrl: '' }));
      assert.ok(!result.success);
    });

    it('rejects when websiteUrl is missing', () => {
      const user = makeValidUser();
      delete user.websiteUrl;
      const result = UserSchema.safeParse(user);
      assert.ok(!result.success);
    });
  });

  describe('portfolio field (added in PR)', () => {
    it('accepts a valid portfolio URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: 'https://myportfolio.io' }));
      assert.ok(result.success);
    });

    it('rejects an invalid portfolio URL', () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: 'ftp://invalid' }));
      assert.ok(!result.success);
    });

    it('rejects a plain string without protocol', () => {
      const result = UserSchema.safeParse(makeValidUser({ portfolio: 'myportfolio.io' }));
      assert.ok(!result.success);
    });

    it('rejects when portfolio is missing', () => {
      const user = makeValidUser();
      delete user.portfolio;
      const result = UserSchema.safeParse(user);
      assert.ok(!result.success);
    });
  });

  describe('siteUrls field (added in PR)', () => {
    it('accepts an array of valid URLs', () => {
      const result = UserSchema.safeParse(makeValidUser({
        siteUrls: ['https://site1.com', 'https://site2.com', 'https://site3.org'],
      }));
      assert.ok(result.success);
    });

    it('accepts an empty array of URLs', () => {
      const result = UserSchema.safeParse(makeValidUser({ siteUrls: [] }));
      assert.ok(result.success);
    });

    it('accepts a single-element array of valid URLs', () => {
      const result = UserSchema.safeParse(makeValidUser({ siteUrls: ['https://single.com'] }));
      assert.ok(result.success);
    });

    it('rejects an array containing an invalid URL', () => {
      const result = UserSchema.safeParse(makeValidUser({
        siteUrls: ['https://valid.com', 'not-a-url'],
      }));
      assert.ok(!result.success);
    });

    it('rejects when siteUrls is missing', () => {
      const user = makeValidUser();
      delete user.siteUrls;
      const result = UserSchema.safeParse(user);
      assert.ok(!result.success);
    });
  });

  describe('format field (added in PR)', () => {
    it('accepts any non-empty string', () => {
      const result = UserSchema.safeParse(makeValidUser({ format: 'json' }));
      assert.ok(result.success);
    });

    it('accepts an empty string', () => {
      const result = UserSchema.safeParse(makeValidUser({ format: '' }));
      assert.ok(result.success);
    });

    it('rejects when format is missing', () => {
      const user = makeValidUser();
      delete user.format;
      const result = UserSchema.safeParse(user);
      assert.ok(!result.success);
    });

    it('rejects a non-string format value', () => {
      const result = UserSchema.safeParse(makeValidUser({ format: 42 }));
      assert.ok(!result.success);
    });
  });

  describe('parseUser()', () => {
    it('returns a valid user object for correct input', () => {
      const input = makeValidUser();
      const user = parseUser(input);
      assert.equal(user.status, 'active');
      assert.equal(user.websiteUrl, 'https://example.com');
      assert.equal(user.portfolio, 'https://portfolio.example.com');
      assert.deepEqual(user.siteUrls, ['https://site1.com', 'https://site2.com']);
      assert.equal(user.format, 'json');
    });

    it('throws an Error for invalid input', () => {
      assert.throws(() => parseUser({ id: 'not-a-uuid' }), Error);
    });

    it('throws an error with JSON-stringified treeified error message', () => {
      let errorMessage = '';
      try {
        parseUser({ id: 'bad-id', email: 'not-email', age: 15 });
      } catch (e) {
        if (e instanceof Error) errorMessage = e.message;
      }
      assert.ok(errorMessage.length > 0);
      assert.doesNotThrow(() => JSON.parse(errorMessage), 'Error message should be valid JSON');
    });

    it('throws for invalid status value', () => {
      assert.throws(() => parseUser(makeValidUser({ status: 'deleted' })), Error);
    });

    it('throws when websiteUrl is not a valid URL', () => {
      assert.throws(() => parseUser(makeValidUser({ websiteUrl: 'not-a-url' })), Error);
    });

    it('throws when siteUrls contains an invalid URL', () => {
      assert.throws(() => parseUser(makeValidUser({ siteUrls: ['not-a-url'] })), Error);
    });
  });

  describe('role field', () => {
    it('accepts "admin" role', () => {
      const result = UserSchema.safeParse(makeValidUser({ role: 'admin' }));
      assert.ok(result.success);
    });

    it('accepts "manager" role', () => {
      const result = UserSchema.safeParse(makeValidUser({ role: 'manager' }));
      assert.ok(result.success);
    });

    it('rejects an invalid role', () => {
      const result = UserSchema.safeParse(makeValidUser({ role: 'superadmin' }));
      assert.ok(!result.success);
    });
  });

  describe('overall schema validation', () => {
    it('validates a complete valid user object', () => {
      const result = UserSchema.safeParse(makeValidUser());
      assert.ok(result.success);
    });

    it('rejects when required fields are missing', () => {
      const result = UserSchema.safeParse({});
      assert.ok(!result.success);
    });

    it('rejects extra fields in strict profile object', () => {
      const result = UserSchema.safeParse(makeValidUser({
        profile: {
          bio: 'Bio',
          joined: new Date(),
          extraField: 'not allowed',
        },
      }));
      assert.ok(!result.success);
    });
  });
});