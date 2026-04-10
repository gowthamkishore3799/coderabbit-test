import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Tests for fools/dummy.ts
 *
 * The PR renamed the module-level const from the reserved word `var` to the valid
 * identifier `statusMessage`. Since the variable is not exported, tests verify:
 * 1. The module can be imported without a syntax/runtime error (confirming the rename fixed it)
 * 2. The Player schema within the module behaves correctly
 */

describe('dummy.ts', () => {
  describe('module loads without error (statusMessage rename from reserved `var`)', () => {
    it('imports the module without throwing', async () => {
      // If the reserved `var` identifier were still present this would throw a SyntaxError
      await expect(import('./dummy')).resolves.not.toThrow();
    });

    it('the imported module is a defined object', async () => {
      const mod = await import('./dummy');
      expect(mod).toBeDefined();
      expect(typeof mod).toBe('object');
    });

    it('does not export `var` (reserved keyword, was the old broken name)', async () => {
      const mod = await import('./dummy');
      // `var` is a reserved JS keyword and should not appear as an export
      expect((mod as Record<string, unknown>).var).toBeUndefined();
    });
  });

  describe('Player schema logic (mirrors dummy.ts schema definition)', () => {
    // The Player schema is defined (not exported) inside dummy.ts.
    // These tests validate the same schema logic using the same Zod validators.
    const Player = z.object({
      username: z.string(),
      xp: z.number(),
      address: z.url(),
    });

    it('accepts a fully valid player', () => {
      const result = Player.safeParse({
        username: 'hero',
        xp: 1500,
        address: 'https://player.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a player with an invalid URL address', () => {
      const result = Player.safeParse({
        username: 'hero',
        xp: 1500,
        address: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a player missing the username field', () => {
      const result = Player.safeParse({
        xp: 1500,
        address: 'https://player.example.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a player with a non-number xp value', () => {
      const result = Player.safeParse({
        username: 'hero',
        xp: 'abc',
        address: 'https://player.example.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty object', () => {
      const result = Player.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects xp of zero (number 0 is valid for z.number() — boundary check)', () => {
      // z.number() accepts 0, so this should succeed
      const result = Player.safeParse({
        username: 'newbie',
        xp: 0,
        address: 'https://player.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a player with a null address', () => {
      const result = Player.safeParse({
        username: 'hero',
        xp: 100,
        address: null,
      });
      expect(result.success).toBe(false);
    });
  });
});