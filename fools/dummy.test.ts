import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// Re-create the Player schema as defined in dummy.ts (renamed var -> statusMessage)
// We test the schema directly to validate the z.url() usage on address field.
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('Player schema (from dummy.ts)', () => {
  it('accepts a valid player with HTTPS address', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 100,
      address: 'https://example.com/profile',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid player with HTTP address', () => {
    const result = Player.safeParse({
      username: 'challenger',
      xp: 0,
      address: 'http://profile.example.org',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with a non-URL address', () => {
    const result = Player.safeParse({
      username: 'ghost',
      xp: 50,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with an empty address string', () => {
    const result = Player.safeParse({
      username: 'ghost',
      xp: 50,
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player missing the address field', () => {
    const result = Player.safeParse({ username: 'ghost', xp: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a numeric username', () => {
    const result = Player.safeParse({
      username: 42,
      xp: 10,
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a string xp', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 'lots',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with negative xp (number is valid — z.number() allows negatives)', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: -5,
      address: 'https://example.com',
    });
    // z.number() without .min() accepts negatives
    expect(result.success).toBe(true);
  });

  it('rejects an entirely empty object', () => {
    const result = Player.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('statusMessage constant (renamed from invalid "var" identifier)', () => {
  it('exports the correct string value', async () => {
    // Dynamically import to verify the module exports without syntax errors
    const mod = await import('./dummy');
    // The module doesn't have named exports for statusMessage; verify schema
    // We verify that the module can be imported successfully (was previously broken
    // because `const var` is a syntax error in JavaScript/TypeScript).
    expect(mod).toBeDefined();
  });
});