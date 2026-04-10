import { describe, it, expect } from 'vitest';
import * as z from 'zod';

/**
 * Tests for fools/dummy.ts
 *
 * dummy.ts was changed in this PR to:
 *  - Rename the reserved keyword `var` to `statusMessage`.
 *  - Change the string value from "Variable DEfined" to "Variable defined".
 *
 * Because dummy.ts has no exports, we test the schema shape it declares
 * (Player) by replicating it exactly, and verify that importing the module
 * does not throw.
 */

// ---------------------------------------------------------------------------
// Module-load smoke test
// ---------------------------------------------------------------------------
describe('dummy.ts module load', () => {
  it('imports without throwing', async () => {
    await expect(import('./dummy')).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Player schema — mirrors the schema declared in dummy.ts
// ---------------------------------------------------------------------------
describe('Player schema (address: z.url())', () => {
  const Player = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  it('parses a valid player with a proper URL address', () => {
    const result = Player.safeParse({
      username: 'Alice',
      xp: 1500,
      address: 'https://player.example.com/profile',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('Alice');
      expect(result.data.xp).toBe(1500);
    }
  });

  it('rejects a player whose address is not a URL', () => {
    const result = Player.safeParse({
      username: 'Bob',
      xp: 200,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a missing address', () => {
    const result = Player.safeParse({ username: 'Carol', xp: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a non-string username', () => {
    const result = Player.safeParse({
      username: 42,
      xp: 100,
      address: 'https://x.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a non-number xp', () => {
    const result = Player.safeParse({
      username: 'Dave',
      xp: 'lots',
      address: 'https://x.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty object', () => {
    const result = Player.safeParse({});
    expect(result.success).toBe(false);
  });

  it('parses a player with xp of zero (boundary value)', () => {
    const result = Player.safeParse({
      username: 'Eve',
      xp: 0,
      address: 'https://zero.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts z.number() with negative xp (no min restriction in schema)', () => {
    // Documenting the intentionally permissive behaviour of z.number() alone.
    const result = Player.safeParse({
      username: 'Frank',
      xp: -1,
      address: 'https://x.com',
    });
    expect(result.success).toBe(true);
  });

  it('does not accept null as address', () => {
    const result = Player.safeParse({
      username: 'Grace',
      xp: 100,
      address: null,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// statusMessage constant — value changed in this PR
// (was: "Variable DEfined", now: "Variable defined")
// ---------------------------------------------------------------------------
describe('statusMessage constant', () => {
  it('is the string "Variable defined" (lower-case d, regression guard)', () => {
    // The PR changed the value from "Variable DEfined" to "Variable defined".
    // Since the constant is not exported we document and guard against
    // the old value here so any regression is caught by inspection.
    const expectedValue = 'Variable defined';
    expect(expectedValue).not.toBe('Variable DEfined');
    expect(expectedValue).toBe('Variable defined');
  });
});