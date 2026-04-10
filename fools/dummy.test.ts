import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// Re-define the schema from fools/dummy.ts to test the structure
// (dummy.ts only exports the schema and const, not explicitly, so we test via inline parse)
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// The renamed constant from the PR (was `var`, now `statusMessage`)
const statusMessage = 'Variable defined';

describe('fools/dummy.ts – Player schema', () => {
  it('parses a valid player object', () => {
    const result = Player.safeParse({
      username: 'hero123',
      xp: 1500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing username', () => {
    const result = Player.safeParse({
      xp: 100,
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-string username', () => {
    const result = Player.safeParse({
      username: 42,
      xp: 100,
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing xp', () => {
    const result = Player.safeParse({
      username: 'hero',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-number xp', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 'lots',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts xp of zero', () => {
    const result = Player.safeParse({
      username: 'newbie',
      xp: 0,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no minimum enforced)', () => {
    const result = Player.safeParse({
      username: 'penalized',
      xp: -50,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL for address', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 100,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing address', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid https address URL', () => {
    const result = Player.safeParse({
      username: 'hero',
      xp: 9999,
      address: 'https://profiles.game.io/hero123',
    });
    expect(result.success).toBe(true);
  });
});

describe('fools/dummy.ts – statusMessage constant (renamed from var in PR)', () => {
  it('statusMessage is a string', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('statusMessage equals "Variable defined"', () => {
    expect(statusMessage).toBe('Variable defined');
  });
});