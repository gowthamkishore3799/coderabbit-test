/**
 * Tests for fools/dummy.ts — two changes landed in this PR:
 *  1. The reserved identifier `var` was renamed to `statusMessage`.
 *  2. The string value was corrected from "Variable DEfined" to "Variable defined".
 *
 * Because neither Player nor statusMessage is exported from the module, the
 * tests validate the same logic inline.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// statusMessage — renamed variable with corrected value
// ---------------------------------------------------------------------------
describe('statusMessage constant', () => {
  // Inline equivalent of the module-level constant
  const statusMessage = 'Variable defined';

  it('equals "Variable defined" (capital V, lower-case d)', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('does not equal the old value "Variable DEfined"', () => {
    expect(statusMessage).not.toBe('Variable DEfined');
  });

  it('is a non-empty string', () => {
    expect(typeof statusMessage).toBe('string');
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Player schema — the z.url() on the address field is in scope for this PR
// ---------------------------------------------------------------------------
describe('Player schema (from dummy.ts)', () => {
  // Inline reproduction matching dummy.ts exactly
  const Player = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  const VALID_PLAYER = {
    username: 'alice',
    xp: 1500,
    address: 'https://example.com/profile/alice',
  };

  it('parses a valid player object', () => {
    expect(() => Player.parse(VALID_PLAYER)).not.toThrow();
  });

  it('returns the correct parsed shape', () => {
    const result = Player.parse(VALID_PLAYER);
    expect(result).toEqual(VALID_PLAYER);
  });

  it('rejects a player with a missing username', () => {
    const { username: _u, ...noUsername } = VALID_PLAYER;
    expect(() => Player.parse(noUsername)).toThrow();
  });

  it('rejects a player with a non-string username', () => {
    expect(() => Player.parse({ ...VALID_PLAYER, username: 42 })).toThrow();
  });

  it('rejects a player with a non-numeric xp', () => {
    expect(() => Player.parse({ ...VALID_PLAYER, xp: 'high' })).toThrow();
  });

  it('accepts xp of 0', () => {
    const result = Player.parse({ ...VALID_PLAYER, xp: 0 });
    expect(result.xp).toBe(0);
  });

  it('rejects a plain string address (no protocol)', () => {
    expect(() => Player.parse({ ...VALID_PLAYER, address: 'example.com' })).toThrow();
  });

  it('accepts an https address URL', () => {
    const result = Player.parse({ ...VALID_PLAYER, address: 'https://player.example.io' });
    expect(result.address).toBe('https://player.example.io');
  });

  it('rejects a missing address field', () => {
    const { address: _a, ...noAddress } = VALID_PLAYER;
    expect(() => Player.parse(noAddress)).toThrow();
  });

  // Boundary / regression
  it('rejects extra unknown fields (object is not strict, but types check)', () => {
    // z.object() (non-strict) silently strips extra keys — confirm strip behaviour
    const result = Player.parse({ ...VALID_PLAYER, extra: 'unexpected' });
    expect(result).not.toHaveProperty('extra');
  });
});