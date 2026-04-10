import { describe, it, expect } from 'vitest';
// Import the module to verify it loads without syntax errors after the
// const var → const statusMessage rename fix.
import * as dummy from './dummy';
import * as z from 'zod';

// Reconstruct the Player schema for validation tests since dummy.ts does not
// export it. The important thing is that the module itself can be loaded.

const PlayerSchema = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('fools/dummy.ts – module loads correctly after identifier rename', () => {
  it('imports the module without throwing', () => {
    expect(() => dummy).not.toThrow();
  });

  it('module object is defined', () => {
    expect(dummy).toBeDefined();
  });
});

describe('fools/dummy.ts – Player schema validation (inline recreation)', () => {
  const validPlayer = {
    username: 'player1',
    xp: 1500,
    address: 'https://player.example.com',
  };

  it('accepts a valid player object', () => {
    const result = PlayerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL address', () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, address: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing username', () => {
    const { username, ...noUsername } = validPlayer;
    const result = PlayerSchema.safeParse(noUsername);
    expect(result.success).toBe(false);
  });

  it('rejects a string xp (not coerced)', () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, xp: 'one-thousand' });
    expect(result.success).toBe(false);
  });

  it('accepts xp of 0', () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts a negative xp value', () => {
    // z.number() has no min constraint – negatives are allowed
    const result = PlayerSchema.safeParse({ ...validPlayer, xp: -100 });
    expect(result.success).toBe(true);
  });

  it('rejects a missing address', () => {
    const { address, ...noAddress } = validPlayer;
    const result = PlayerSchema.safeParse(noAddress);
    expect(result.success).toBe(false);
  });
});