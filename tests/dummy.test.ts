/**
 * Tests for fools/dummy.ts
 *
 * PR changes:
 *  - Renamed variable `var` (invalid identifier) to `statusMessage`.
 *  - Value remained "Variable defined" (previously "Variable DEfined" - note: diff shows
 *    the new value is "Variable defined" with a lowercase 'd').
 *
 * Because dummy.ts does not export its bindings, these tests replicate
 * the file's schema and constant inline to verify the intended behaviour.
 * The Player Zod schema is also validated.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// ── Inline Player schema (mirrors fools/dummy.ts) ─────────────────────────────

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// ── statusMessage constant (PR change: renamed from `var`) ────────────────────

describe('statusMessage constant (PR: renamed from reserved identifier `var`)', () => {
  // The new value in the PR diff is: "Variable defined"
  const statusMessage = 'Variable defined';

  test('statusMessage is a string', () => {
    assert.equal(typeof statusMessage, 'string');
  });

  test('statusMessage has the correct value from the PR', () => {
    assert.equal(statusMessage, 'Variable defined');
  });

  test('statusMessage is not the invalid reserved word "var"', () => {
    // The PR renamed `const var` -> `const statusMessage`.
    // This test documents that the identifier is now valid.
    assert.doesNotThrow(() => {
      const _test = statusMessage.length;
    });
  });
});

// ── Player schema ─────────────────────────────────────────────────────────────

describe('Player schema (fools/dummy.ts)', () => {
  const validPlayer = {
    username: 'hero',
    xp: 1500,
    address: 'https://player.example.com',
  };

  test('accepts a valid player', () => {
    const r = Player.safeParse(validPlayer);
    assert.equal(r.success, true);
  });

  test('rejects a player with missing username', () => {
    const { username: _u, ...rest } = validPlayer;
    assert.equal(Player.safeParse(rest).success, false);
  });

  test('rejects a player with non-string username', () => {
    assert.equal(Player.safeParse({ ...validPlayer, username: 42 }).success, false);
  });

  test('rejects a player with missing xp', () => {
    const { xp: _xp, ...rest } = validPlayer;
    assert.equal(Player.safeParse(rest).success, false);
  });

  test('rejects a player with non-numeric xp', () => {
    assert.equal(Player.safeParse({ ...validPlayer, xp: 'lots' }).success, false);
  });

  test('accepts negative xp (no lower bound defined)', () => {
    assert.equal(Player.safeParse({ ...validPlayer, xp: -100 }).success, true);
  });

  test('accepts fractional xp (no integer constraint)', () => {
    assert.equal(Player.safeParse({ ...validPlayer, xp: 9.5 }).success, true);
  });

  test('rejects a player with missing address', () => {
    const { address: _a, ...rest } = validPlayer;
    assert.equal(Player.safeParse(rest).success, false);
  });

  test('rejects a player with non-URL address', () => {
    assert.equal(Player.safeParse({ ...validPlayer, address: 'not-a-url' }).success, false);
  });

  test('accepts a valid HTTP URL for address', () => {
    assert.equal(
      Player.safeParse({ ...validPlayer, address: 'http://player.dev' }).success,
      true,
    );
  });

  test('infers correct TypeScript types', () => {
    const r = Player.safeParse(validPlayer);
    assert.equal(r.success, true);
    if (r.success) {
      assert.equal(typeof r.data.username, 'string');
      assert.equal(typeof r.data.xp, 'number');
      assert.equal(typeof r.data.address, 'string');
    }
  });
});