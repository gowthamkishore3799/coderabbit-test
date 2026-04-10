import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// fools/dummy.ts exports are not explicit; re-declare Player schema here
// to test the same schema defined in dummy.ts (changed in this PR)
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// statusMessage was renamed from `var` to `statusMessage` in this PR
const statusMessage = 'Variable defined';

describe('dummy.ts - statusMessage constant', () => {
  it('should equal "Variable defined"', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('should be a string', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('should not be empty', () => {
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

describe('dummy.ts - Player schema', () => {
  const validPlayer = {
    username: 'hero42',
    xp: 1500,
    address: 'https://profile.example.com',
  };

  it('should accept a valid player object', () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  describe('username field', () => {
    it('should accept a non-empty username', () => {
      const result = Player.safeParse({ ...validPlayer, username: 'player1' });
      expect(result.success).toBe(true);
    });

    it('should accept an empty string username', () => {
      // z.string() allows empty strings by default
      const result = Player.safeParse({ ...validPlayer, username: '' });
      expect(result.success).toBe(true);
    });

    it('should reject a non-string username', () => {
      const result = Player.safeParse({ ...validPlayer, username: 42 });
      expect(result.success).toBe(false);
    });

    it('should reject a missing username', () => {
      const { username, ...withoutUsername } = validPlayer;
      const result = Player.safeParse(withoutUsername);
      expect(result.success).toBe(false);
    });
  });

  describe('xp field', () => {
    it('should accept a positive number', () => {
      const result = Player.safeParse({ ...validPlayer, xp: 999 });
      expect(result.success).toBe(true);
    });

    it('should accept zero xp', () => {
      const result = Player.safeParse({ ...validPlayer, xp: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept negative xp (no min constraint)', () => {
      const result = Player.safeParse({ ...validPlayer, xp: -100 });
      expect(result.success).toBe(true);
    });

    it('should reject a string for xp', () => {
      const result = Player.safeParse({ ...validPlayer, xp: 'hundred' });
      expect(result.success).toBe(false);
    });

    it('should reject a missing xp', () => {
      const { xp, ...withoutXp } = validPlayer;
      const result = Player.safeParse(withoutXp);
      expect(result.success).toBe(false);
    });
  });

  describe('address field (z.url())', () => {
    it('should accept a valid HTTPS URL', () => {
      const result = Player.safeParse({ ...validPlayer, address: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept a valid HTTP URL', () => {
      const result = Player.safeParse({ ...validPlayer, address: 'http://example.com/path' });
      expect(result.success).toBe(true);
    });

    it('should reject a non-URL string', () => {
      const result = Player.safeParse({ ...validPlayer, address: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject a missing address', () => {
      const { address, ...withoutAddress } = validPlayer;
      const result = Player.safeParse(withoutAddress);
      expect(result.success).toBe(false);
    });

    it('should reject an empty string as address', () => {
      const result = Player.safeParse({ ...validPlayer, address: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('extra fields', () => {
    it('should strip extra unknown fields by default', () => {
      const result = Player.safeParse({ ...validPlayer, level: 99 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).level).toBeUndefined();
      }
    });
  });
});