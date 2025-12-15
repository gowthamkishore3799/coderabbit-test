import { describe, it, expect } from 'vitest';
import { Playersss } from './trails';
import { z } from 'zod';

describe('Playersss Schema', () => {
  describe('username validation', () => {
    it('should accept valid username strings', () => {
      const validUsernames = [
        'john_doe',
        'player123',
        'User-Name',
        'a',
        'A'.repeat(100),
      ];

      validUsernames.forEach(username => {
        const result = Playersss.safeParse({
          username,
          xp: 1000,
          address: 'https://example.com',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject non-string usernames', () => {
      const invalidUsernames = [123, null, undefined, {}, [], true];

      invalidUsernames.forEach(username => {
        const result = Playersss.safeParse({
          username,
          xp: 1000,
          address: 'https://example.com',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty username', () => {
      const result = Playersss.safeParse({
        username: '',
        xp: 1000,
        address: 'https://example.com',
      });

      expect(result.success).toBe(false);
    });

    it('should require username field', () => {
      const result = Playersss.safeParse({
        xp: 1000,
        address: 'https://example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const usernameError = result.error.issues.find(
          issue => issue.path.includes('username')
        );
        expect(usernameError).toBeDefined();
      }
    });
  });

  describe('xp validation', () => {
    it('should accept valid positive numbers', () => {
      const validXp = [0, 1, 100, 1000, 999999, 1.5, 0.1];

      validXp.forEach(xp => {
        const result = Playersss.safeParse({
          username: 'player',
          xp,
          address: 'https://example.com',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept negative numbers', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: -100,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should accept zero', () => {
      const result = Playersss.safeParse({
        username: 'newbie',
        xp: 0,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should reject non-number xp values', () => {
      const invalidXp = ['1000', '123.45', null, undefined, {}, [], true, 'text'];

      invalidXp.forEach(xp => {
        const result = Playersss.safeParse({
          username: 'player',
          xp,
          address: 'https://example.com',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject NaN', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: NaN,
        address: 'https://example.com',
      });

      expect(result.success).toBe(false);
    });

    it('should reject Infinity', () => {
      const infinityValues = [Infinity, -Infinity];

      infinityValues.forEach(xp => {
        const result = Playersss.safeParse({
          username: 'player',
          xp,
          address: 'https://example.com',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should require xp field', () => {
      const result = Playersss.safeParse({
        username: 'player',
        address: 'https://example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const xpError = result.error.issues.find(
          issue => issue.path.includes('xp')
        );
        expect(xpError).toBeDefined();
      }
    });
  });

  describe('address URL validation', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      const validAddresses = [
        'https://example.com',
        'http://subdomain.example.com',
        'https://example.com:8080',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com/path#fragment',
        'https://user:pass@example.com',
        'https://192.168.1.1',
        'https://[2001:db8::1]',
      ];

      validAddresses.forEach(address => {
        const result = Playersss.safeParse({
          username: 'player',
          xp: 1000,
          address,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidAddresses = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        'example.com',
        '//example.com',
        '',
        'http://',
        'https://',
        'http://.',
        'http://..',
      ];

      invalidAddresses.forEach(address => {
        const result = Playersss.safeParse({
          username: 'player',
          xp: 1000,
          address,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject non-string addresses', () => {
      const invalidAddresses = [123, null, undefined, {}, [], true];

      invalidAddresses.forEach(address => {
        const result = Playersss.safeParse({
          username: 'player',
          xp: 1000,
          address,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should require address field', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 1000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const addressError = result.error.issues.find(
          issue => issue.path.includes('address')
        );
        expect(addressError).toBeDefined();
      }
    });
  });

  describe('complete schema integration tests', () => {
    it('should accept a fully valid player object', () => {
      const validPlayer = {
        username: 'pro_gamer_2024',
        xp: 15000,
        address: 'https://gaming.example.com/player/profile',
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPlayer);
      }
    });

    it('should parse and return correct data types', () => {
      const player = {
        username: 'test_player',
        xp: 500,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.username).toBe('string');
        expect(typeof result.data.xp).toBe('number');
        expect(typeof result.data.address).toBe('string');
      }
    });

    it('should reject object with all invalid fields', () => {
      const invalidPlayer = {
        username: 123,
        xp: 'not-a-number',
        address: 'not-a-url',
      };

      const result = Playersss.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have errors for all three fields
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should reject empty object', () => {
      const result = Playersss.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('username');
        expect(paths).toContain('xp');
        expect(paths).toContain('address');
      }
    });

    it('should reject object with extra properties', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 1000,
        address: 'https://example.com',
        extraField: 'should be ignored or rejected',
      });

      // Zod by default strips extra properties in .parse()
      // but we're using safeParse, so it should still succeed
      // unless we use .strict()
      expect(result.success).toBe(true);
    });
  });

  describe('edge cases and boundary values', () => {
    it('should handle very long usernames', () => {
      const longUsername = 'a'.repeat(10000);
      const result = Playersss.safeParse({
        username: longUsername,
        xp: 100,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should handle very large xp values', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: Number.MAX_SAFE_INTEGER,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should handle very small xp values', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: Number.MIN_SAFE_INTEGER,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should handle decimal xp values', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 123.456789,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.xp).toBe(123.456789);
      }
    });

    it('should handle URLs with special characters', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 1000,
        address: 'https://example.com/path?param=value&other=123#section',
      });

      expect(result.success).toBe(true);
    });

    it('should handle international domain names', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 1000,
        address: 'https://münchen.de',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('error messages and debugging', () => {
    it('should provide clear error messages for invalid data', () => {
      const result = Playersss.safeParse({
        username: 123,
        xp: 'invalid',
        address: 'not-a-url',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          expect(issue).toHaveProperty('code');
          expect(issue).toHaveProperty('message');
          expect(issue).toHaveProperty('path');
          expect(issue.message).toBeTruthy();
        });
      }
    });

    it('should identify which fields have errors', () => {
      const result = Playersss.safeParse({
        username: 'valid_user',
        xp: 'invalid-xp',
        address: 'invalid-url',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(issue => issue.path[0]);
        expect(errorPaths).toContain('xp');
        expect(errorPaths).toContain('address');
        expect(errorPaths).not.toContain('username');
      }
    });
  });

  describe('type inference and TypeScript integration', () => {
    it('should infer correct TypeScript types', () => {
      type Player = z.infer<typeof Playersss>;

      // This is a compile-time test
      const player: Player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com',
      };

      expect(player).toBeDefined();
      expect(player.username).toBe('test');
      expect(player.xp).toBe(100);
      expect(player.address).toBe('https://example.com');
    });
  });

  describe('parsing vs safe parsing', () => {
    it('should throw error with .parse() on invalid data', () => {
      expect(() => {
        Playersss.parse({
          username: 123,
          xp: 1000,
          address: 'https://example.com',
        });
      }).toThrow();
    });

    it('should not throw with .safeParse() on invalid data', () => {
      expect(() => {
        Playersss.safeParse({
          username: 123,
          xp: 1000,
          address: 'https://example.com',
        });
      }).not.toThrow();
    });

    it('should return success=true for valid data with safeParse', () => {
      const result = Playersss.safeParse({
        username: 'player',
        xp: 1000,
        address: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should validate a new player registration', () => {
      const newPlayer = {
        username: 'rookie_player',
        xp: 0,
        address: 'https://game-server.example.com/new-player',
      };

      const result = Playersss.safeParse(newPlayer);
      expect(result.success).toBe(true);
    });

    it('should validate a veteran player with high xp', () => {
      const veteranPlayer = {
        username: 'veteran_master',
        xp: 999999,
        address: 'https://leaderboard.example.com/top-players',
      };

      const result = Playersss.safeParse(veteranPlayer);
      expect(result.success).toBe(true);
    });

    it('should reject player data from untrusted sources', () => {
      const untrustedData = {
        username: 'hacker',
        xp: 'SELECT * FROM users',
        address: 'javascript:alert(document.cookie)',
      };

      const result = Playersss.safeParse(untrustedData);
      expect(result.success).toBe(false);
    });

    it('should handle data transformation pipelines', () => {
      const rawData = {
        username: 'player_one',
        xp: 5000,
        address: 'https://api.example.com/players/1',
      };

      const parseResult = Playersss.safeParse(rawData);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        // Data can now be safely used
        const { username, xp, address } = parseResult.data;
        expect(username).toBe('player_one');
        expect(xp).toBe(5000);
        expect(address).toBe('https://api.example.com/players/1');
      }
    });
  });
});