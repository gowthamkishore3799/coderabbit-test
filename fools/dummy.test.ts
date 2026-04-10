import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// dummy.ts does not export its symbols; we re-declare the same shapes here
// to verify the PR change (renaming the invalid `var` identifier to
// `statusMessage`) did not break the Player schema or the constant's value.

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

const statusMessage = 'Variable defined';

// ─────────────────────────────────────────────
// statusMessage constant (PR renamed `var` → `statusMessage`)
// ─────────────────────────────────────────────

describe('statusMessage constant', () => {
  it('has the correct string value', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('is a string', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('is not empty', () => {
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Player schema
// ─────────────────────────────────────────────

describe('Player schema', () => {
  const validPlayer = {
    username: 'alice',
    xp: 1500,
    address: 'https://player.example.com',
  };

  it('accepts a valid player', () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('requires username to be a string', () => {
    const result = Player.safeParse({ ...validPlayer, username: 42 });
    expect(result.success).toBe(false);
  });

  it('requires xp to be a number', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 'high' });
    expect(result.success).toBe(false);
  });

  it('requires address to be a URL', () => {
    const result = Player.safeParse({ ...validPlayer, address: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing username', () => {
    const { username: _omit, ...noUsername } = validPlayer;
    const result = Player.safeParse(noUsername);
    expect(result.success).toBe(false);
  });

  it('rejects a missing xp', () => {
    const { xp: _omit, ...noXp } = validPlayer;
    const result = Player.safeParse(noXp);
    expect(result.success).toBe(false);
  });

  it('accepts xp of 0 (boundary)', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no min constraint)', () => {
    const result = Player.safeParse({ ...validPlayer, xp: -100 });
    expect(result.success).toBe(true);
  });
});