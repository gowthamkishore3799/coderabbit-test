import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { statusMessage, Player } from './dummy';

describe('statusMessage constant (renamed from `var` to valid identifier)', () => {
  it('is a string', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('has the expected value "Variable defined"', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('is not empty', () => {
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

describe('Player schema (fools/dummy.ts)', () => {
  const validPlayer = {
    username: 'playerOne',
    xp: 1500,
    address: 'https://player.example.com/profile',
  };

  it('accepts a valid player object', () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('accepts any non-empty string as username', () => {
    const result = Player.safeParse({ ...validPlayer, username: 'abc' });
    expect(result.success).toBe(true);
  });

  it('rejects missing username', () => {
    const { username, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects non-string username', () => {
    const result = Player.safeParse({ ...validPlayer, username: 42 });
    expect(result.success).toBe(false);
  });

  it('accepts a positive xp value', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 9999 });
    expect(result.success).toBe(true);
  });

  it('accepts xp of 0', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric xp', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 'high' });
    expect(result.success).toBe(false);
  });

  it('rejects missing xp', () => {
    const { xp, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts a valid URL as address', () => {
    const result = Player.safeParse({ ...validPlayer, address: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL as address', () => {
    const result = Player.safeParse({ ...validPlayer, address: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string as address', () => {
    const result = Player.safeParse({ ...validPlayer, address: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing address', () => {
    const { address, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('infers correct TypeScript type shape', () => {
    const result = Player.safeParse(validPlayer);
    if (result.success) {
      expect(typeof result.data.username).toBe('string');
      expect(typeof result.data.xp).toBe('number');
      expect(typeof result.data.address).toBe('string');
    }
  });
});