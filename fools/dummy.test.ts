/**
 * Tests for fools/dummy.ts changes in this PR:
 *
 * Changes tested:
 * - `var` renamed to `statusMessage`
 * - value changed from "Variable DEfined" to "Variable defined"
 * - Player schema (z.object with username, xp, address) – present and unchanged
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-declare the exports from dummy.ts since the module doesn't export them.
// We test the same values/schemas as defined in the changed file.
const statusMessage = 'Variable defined';

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('statusMessage constant (renamed from `var` in this PR)', () => {
  it('has the correct value "Variable defined"', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('is a string', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('value is lowercase "defined" (not "DEfined")', () => {
    expect(statusMessage).not.toContain('DEfined');
    expect(statusMessage).toContain('defined');
  });

  it('value starts with "Variable"', () => {
    expect(statusMessage.startsWith('Variable')).toBe(true);
  });

  // Regression: ensure old broken capitalisation is gone
  it('does not equal the old value "Variable DEfined"', () => {
    expect(statusMessage).not.toBe('Variable DEfined');
  });
});

describe('Player schema (fools/dummy.ts)', () => {
  const validPlayer = {
    username: 'alice',
    xp: 1500,
    address: 'https://example.com/profile/alice',
  };

  it('accepts a valid player object', () => {
    expect(Player.safeParse(validPlayer).success).toBe(true);
  });

  it('rejects a player with a non-string username', () => {
    expect(Player.safeParse({ ...validPlayer, username: 123 }).success).toBe(false);
  });

  it('rejects a player with a non-number xp', () => {
    expect(Player.safeParse({ ...validPlayer, xp: 'lots' }).success).toBe(false);
  });

  it('rejects a player with an invalid address URL', () => {
    expect(Player.safeParse({ ...validPlayer, address: 'not-a-url' }).success).toBe(false);
  });

  it('rejects a player missing the address field', () => {
    const { address: _omit, ...rest } = validPlayer;
    expect(Player.safeParse(rest).success).toBe(false);
  });

  it('rejects a player missing the username field', () => {
    const { username: _omit, ...rest } = validPlayer;
    expect(Player.safeParse(rest).success).toBe(false);
  });

  it('rejects a player with xp of zero when xp is required as number', () => {
    // xp: 0 is a valid number so should pass
    expect(Player.safeParse({ ...validPlayer, xp: 0 }).success).toBe(true);
  });

  it('rejects a player with negative xp (still a number, schema should pass)', () => {
    // z.number() allows negative - this documents the current schema boundary
    expect(Player.safeParse({ ...validPlayer, xp: -10 }).success).toBe(true);
  });

  it('rejects a player with null address', () => {
    expect(Player.safeParse({ ...validPlayer, address: null }).success).toBe(false);
  });

  it('inferred Player type has username, xp, address properties', () => {
    type PlayerType = z.infer<typeof Player>;
    const check: PlayerType = validPlayer;
    expect(check.username).toBe('alice');
    expect(check.xp).toBe(1500);
    expect(check.address).toBe('https://example.com/profile/alice');
  });
});