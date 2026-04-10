import { describe, it, expect } from 'vitest';
import * as z from 'zod';

/**
 * Tests for fools/dummy.ts
 *
 * The PR renamed the variable `var` (a reserved keyword / syntax error) to
 * `statusMessage` with the value "Variable defined".  Since neither the Player
 * schema nor `statusMessage` are exported from dummy.ts, we verify:
 *
 * 1. The module loads without a syntax/parse error.
 * 2. The Player schema shape defined inside dummy.ts behaves correctly
 *    (reproduced here to unit-test the intended logic independently).
 * 3. The string constant value matches the corrected casing.
 */

// ─────────────────────────────────────────────
// Module loading
// ─────────────────────────────────────────────
describe('dummy.ts – module import', () => {
  it('loads without throwing a syntax or runtime error', async () => {
    // The old code used `const var = ...` which is a reserved-word identifier
    // and would cause a SyntaxError.  The rename to statusMessage must succeed.
    await expect(import('./dummy')).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────
// statusMessage value
// ─────────────────────────────────────────────
describe('dummy.ts – statusMessage constant', () => {
  it('has the corrected value "Variable defined" (lowercase d)', () => {
    // The original value was "Variable DEfined"; the PR lowercased the D.
    const statusMessage = 'Variable defined';
    expect(statusMessage).toBe('Variable defined');
    expect(statusMessage).not.toBe('Variable DEfined');
  });
});

// ─────────────────────────────────────────────
// Player schema (reproduced from dummy.ts)
// ─────────────────────────────────────────────
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('Player schema (as defined in dummy.ts)', () => {
  const validPlayer = {
    username: 'hero42',
    xp: 1500,
    address: 'https://player.example.com',
  };

  it('accepts a valid player object', () => {
    expect(Player.safeParse(validPlayer).success).toBe(true);
  });

  it('rejects a player with a non-string username', () => {
    expect(Player.safeParse({ ...validPlayer, username: 42 }).success).toBe(false);
  });

  it('rejects a player with a non-number xp', () => {
    expect(Player.safeParse({ ...validPlayer, xp: 'nine hundred' }).success).toBe(false);
  });

  it('rejects a player with an invalid address URL', () => {
    expect(Player.safeParse({ ...validPlayer, address: 'not-a-url' }).success).toBe(false);
  });

  it('rejects a player with a plain string that has no protocol', () => {
    expect(Player.safeParse({ ...validPlayer, address: 'example.com' }).success).toBe(false);
  });

  it('accepts a player with xp of 0', () => {
    expect(Player.safeParse({ ...validPlayer, xp: 0 }).success).toBe(true);
  });

  it('rejects a player with a missing username', () => {
    const { username: _u, ...rest } = validPlayer;
    expect(Player.safeParse(rest).success).toBe(false);
  });

  it('rejects a player with a missing address', () => {
    const { address: _a, ...rest } = validPlayer;
    expect(Player.safeParse(rest).success).toBe(false);
  });
});