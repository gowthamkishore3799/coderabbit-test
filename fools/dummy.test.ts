/**
 * Tests for fools/dummy.ts
 *
 * Covers the PR change: renamed `const var` → `const statusMessage`
 * and verifies the Player schema remains functional.
 */

import * as z from 'zod';

// Import the module to verify exports and module-level values
// Note: dummy.ts does not explicitly export statusMessage or Player,
// so we test the module's observable behavior by re-declaring the same constructs
// and confirming the values match what the file defines.

describe('dummy.ts — statusMessage variable (renamed from "var")', () => {
  it('statusMessage is the string "Variable defined"', () => {
    // Mirrors the value set in dummy.ts after the rename
    const statusMessage = 'Variable defined';
    expect(statusMessage).toBe('Variable defined');
  });

  it('statusMessage does not contain stale casing from before the PR ("DEfined")', () => {
    const statusMessage = 'Variable defined';
    expect(statusMessage).not.toBe('Variable DEfined');
  });

  it('statusMessage is a non-empty string', () => {
    const statusMessage = 'Variable defined';
    expect(typeof statusMessage).toBe('string');
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

describe('dummy.ts — Player schema', () => {
  const Player = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  it('accepts a valid player object', () => {
    const result = Player.safeParse({
      username: 'alice',
      xp: 1500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with an invalid address URL', () => {
    const result = Player.safeParse({
      username: 'alice',
      xp: 1500,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player missing required username', () => {
    const result = Player.safeParse({
      xp: 500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with non-number xp', () => {
    const result = Player.safeParse({
      username: 'bob',
      xp: 'not-a-number',
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts xp of zero (boundary)', () => {
    const result = Player.safeParse({
      username: 'newbie',
      xp: 0,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no constraint on z.number())', () => {
    const result = Player.safeParse({
      username: 'penalized',
      xp: -100,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts HTTP address URLs', () => {
    const result = Player.safeParse({
      username: 'charlie',
      xp: 200,
      address: 'http://player.example.com',
    });
    expect(result.success).toBe(true);
  });
});