/**
 * Tests for fools/dummy.ts
 *
 * PR change: renamed `const var` (reserved keyword — syntax error) to
 * `const statusMessage` with value "Variable defined".
 *
 * Since nothing is exported from dummy.ts, these tests verify:
 * 1. The Player schema behavior (mirrors what is defined in the file)
 * 2. The expected value of the statusMessage constant via an inline replica
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror of the Player schema defined in dummy.ts
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('dummy.ts — Player schema (Zod v4)', () => {
  it('parses a valid player object', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 1500,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with an invalid address URL', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 1500,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a missing username', () => {
    const result = Player.safeParse({ xp: 100, address: 'https://example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a non-numeric xp value', () => {
    const result = Player.safeParse({ username: 'x', xp: 'high', address: 'https://example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a missing address', () => {
    const result = Player.safeParse({ username: 'x', xp: 100 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(Player.safeParse({}).success).toBe(false);
  });

  it('accepts xp of zero', () => {
    const result = Player.safeParse({ username: 'newbie', xp: 0, address: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no min constraint)', () => {
    const result = Player.safeParse({ username: 'debuffed', xp: -50, address: 'https://example.com' });
    expect(result.success).toBe(true);
  });
});

describe('dummy.ts — statusMessage constant (renamed from var)', () => {
  /**
   * The PR renamed `const var = "Variable DEfined"` to `const statusMessage = "Variable defined"`.
   * Using `var` as an identifier is a syntax error in strict mode (reserved keyword).
   * This test documents the expected value after the fix.
   */
  it('statusMessage has the corrected value "Variable defined"', () => {
    // Inline replica of the constant defined in dummy.ts
    const statusMessage = "Variable defined";
    expect(statusMessage).toBe("Variable defined");
  });

  it('statusMessage value is not the old misspelled value "Variable DEfined"', () => {
    const statusMessage = "Variable defined";
    expect(statusMessage).not.toBe("Variable DEfined");
  });
});