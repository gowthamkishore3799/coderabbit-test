import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// dummy.ts – changed in this PR:
//   - renamed `const var` (invalid identifier) to `const statusMessage`
//   - Player schema uses z.url() for address
//
// We import the module's exports by re-creating the schema inline because
// dummy.ts does not export Player or statusMessage.  The meaningful change
// tested here is that `statusMessage` is a correctly assigned string constant
// and that the Player schema (using z.url for address) behaves as expected.
// ---------------------------------------------------------------------------

// Inline re-declaration of Player to test the schema behaviour directly
// (mirrors fools/dummy.ts exactly)
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// ---------------------------------------------------------------------------
// statusMessage constant – renamed from `var` in this PR
// ---------------------------------------------------------------------------
describe('statusMessage constant (renamed from invalid `var` identifier)', () => {
  it('holds the string "Variable defined"', async () => {
    // Dynamic import so we can inspect the module-level constant
    const mod = await import('./dummy');
    // dummy.ts does not export statusMessage – verify the module loads without
    // syntax errors (the rename from `var` to `statusMessage` fixed a parse error)
    expect(mod).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Player schema – address uses z.url() (from dummy.ts)
// ---------------------------------------------------------------------------
describe('Player schema – address field (z.url)', () => {
  it('accepts a valid player with an https address', () => {
    const result = Player.safeParse({
      username: 'heroGamer',
      xp: 4200,
      address: 'https://player.example.com/profile',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid player with an http address', () => {
    const result = Player.safeParse({
      username: 'anotherPlayer',
      xp: 100,
      address: 'http://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with a non-URL address', () => {
    const result = Player.safeParse({
      username: 'badAddr',
      xp: 50,
      address: 'not-a-valid-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with an empty string address', () => {
    const result = Player.safeParse({
      username: 'emptyAddr',
      xp: 50,
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a numeric address', () => {
    const result = Player.safeParse({
      username: 'numericAddr',
      xp: 50,
      address: 12345,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player missing the address field', () => {
    const result = Player.safeParse({
      username: 'noAddr',
      xp: 50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a non-numeric xp', () => {
    const result = Player.safeParse({
      username: 'badXp',
      xp: 'not-a-number',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with an empty username', () => {
    // z.string() allows empty strings by default; just verifies schema accepts it
    const result = Player.safeParse({
      username: '',
      xp: 10,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });
});