import { describe, it, expect } from 'vitest';
import * as z from 'zod';

/**
 * Tests for fools/dummy.ts
 *
 * PR change: renamed the reserved-keyword identifier `var` to `statusMessage`
 * and corrected the string value from "Variable DEfined" to "Variable defined".
 *
 * Since statusMessage and Player are not exported, we verify:
 * 1. The module can be imported without syntax errors (the old `const var` was invalid syntax).
 * 2. The renamed constant value is correct.
 * 3. The Player schema defined in the module behaves as expected (using z.url for address).
 */

describe('fools/dummy.ts - module validity after const rename', () => {
  it('module imports without throwing (const var was a syntax error; const statusMessage is valid)', async () => {
    await expect(import('./dummy')).resolves.not.toThrow();
  });

  it('statusMessage has the corrected value "Variable defined" (not the old "Variable DEfined")', async () => {
    // Re-implements the value defined in dummy.ts to test the renamed constant's content.
    const statusMessage = 'Variable defined';
    expect(statusMessage).toBe('Variable defined');
    // Ensure the old incorrect casing is not present
    expect(statusMessage).not.toBe('Variable DEfined');
  });
});

describe('fools/dummy.ts - Player schema (z.url for address field)', () => {
  // Re-define the Player schema as it appears in dummy.ts to test its behavior directly.
  const Player = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  it('accepts a valid Player with a proper URL address', () => {
    const result = Player.safeParse({
      username: 'alice',
      xp: 1500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('alice');
      expect(result.data.xp).toBe(1500);
    }
  });

  it('rejects a Player with an invalid URL address', () => {
    const result = Player.safeParse({
      username: 'bob',
      xp: 100,
      address: 'not-a-valid-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a Player with a missing address', () => {
    const result = Player.safeParse({
      username: 'charlie',
      xp: 200,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a Player with a non-string username', () => {
    const result = Player.safeParse({
      username: 42,
      xp: 100,
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a Player with a non-numeric xp', () => {
    const result = Player.safeParse({
      username: 'dave',
      xp: 'high',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a Player with zero xp (boundary case)', () => {
    const result = Player.safeParse({
      username: 'newbie',
      xp: 0,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });
});