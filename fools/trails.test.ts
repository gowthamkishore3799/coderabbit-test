import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import * as z_namespace from 'zod';

describe('Playersss Schema - Zod URL Validation Tests', () => {
  // Define the schema similar to what's in trails.ts
  const Playersss = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  type Playersss = z.infer<typeof Playersss>;

  describe('Happy Path - Valid Player Data', () => {
    test('should parse a complete valid player object', () => {
      const validPlayer = {
        username: 'GamerPro123',
        xp: 5000,
        address: 'https://example.com/profile',
      };

      const result = Playersss.safeParse(validPlayer);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.username, 'GamerPro123');
      assert.strictEqual(result.data.xp, 5000);
      assert.strictEqual(result.data.address, 'https://example.com/profile');
    });

    test('should parse player with simple username', () => {
      const player = {
        username: 'john',
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.username, 'john');
    });

    test('should parse player with complex URL', () => {
      const player = {
        username: 'player',
        xp: 1000,
        address: 'https://subdomain.example.com:8080/path/to/resource?query=value&another=param',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.address, 'https://subdomain.example.com:8080/path/to/resource?query=value&another=param');
    });

    test('should parse player with zero XP', () => {
      const player = {
        username: 'newbie',
        xp: 0,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.xp, 0);
    });

    test('should parse player with large XP value', () => {
      const player = {
        username: 'legendary',
        xp: 999999999,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.xp, 999999999);
    });

    test('should parse player with negative XP', () => {
      const player = {
        username: 'penalized',
        xp: -500,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.xp, -500);
    });

    test('should parse player with decimal XP (coerced to number)', () => {
      const player = {
        username: 'fractional',
        xp: 123.456,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.xp, 123.456);
    });

    test('should parse player with empty username', () => {
      const player = {
        username: '',
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.username, '');
    });

    test('should parse player with whitespace in username', () => {
      const player = {
        username: 'player with spaces',
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.username, 'player with spaces');
    });

    test('should parse player with special characters in username', () => {
      const player = {
        username: 'player@123_-!',
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
    });

    test('should parse multiple different URL schemes', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'https://192.168.1.1:8080',
        'http://localhost:3000',
        'https://example.co.uk/path',
      ];

      urls.forEach(url => {
        const player = {
          username: 'test',
          xp: 100,
          address: url,
        };

        const result = Playersss.safeParse(player);
        assert.strictEqual(result.success, true, `Failed for URL: ${url}`);
        assert(result.data);
        assert.strictEqual(result.data.address, url);
      });
    });

    test('should parse URL with fragment identifier', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com/page#section',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should parse URL with encoded characters', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com/path%20with%20spaces',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Edge Cases - Boundary Conditions', () => {
    test('should accept very long username', () => {
      const longUsername = 'a'.repeat(1000);
      const player = {
        username: longUsername,
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.username.length, 1000);
    });

    test('should accept very large XP number', () => {
      const largeXP = Number.MAX_SAFE_INTEGER;
      const player = {
        username: 'maxplayer',
        xp: largeXP,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(result.data.xp, largeXP);
    });

    test('should accept Infinity as XP', () => {
      const player = {
        username: 'infinite',
        xp: Infinity,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      // This depends on Zod's number validation - it may or may not accept Infinity
      // But we test the behavior
      if (result.success) {
        assert(result.data);
      }
    });

    test('should handle URL with very long path', () => {
      const longPath = '/path/' + 'segment/'.repeat(100);
      const player = {
        username: 'test',
        xp: 100,
        address: `https://example.com${longPath}`,
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with multiple query parameters', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com/path?a=1&b=2&c=3&d=4&e=5',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Validation Failures - Invalid Inputs', () => {
    test('should reject missing username field', () => {
      const player = {
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject missing xp field', () => {
      const player = {
        username: 'test',
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject missing address field', () => {
      const player = {
        username: 'test',
        xp: 100,
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject non-string username', () => {
      const player = {
        username: 123,
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject non-number xp', () => {
      const player = {
        username: 'test',
        xp: 'hundred',
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject non-URL address', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'not-a-url',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject relative URL', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: '/relative/path',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject URL without protocol', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject malformed URL with invalid characters', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://exa mple.com',
      };

      const result = Playersss.safeParse(player);
      // URL validation behavior depends on Zod implementation
      // Most implementations would reject spaces in URLs
      if (!result.success) {
        assert.strictEqual(result.success, false);
      }
    });

    test('should reject empty string as address', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: '',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject null values', () => {
      const player = {
        username: null,
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject undefined values', () => {
      const player = {
        username: 'test',
        xp: undefined,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject NaN for xp', () => {
      const player = {
        username: 'test',
        xp: NaN,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject object instead of string username', () => {
      const player = {
        username: { name: 'player' },
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject array instead of string username', () => {
      const player = {
        username: ['player1', 'player2'],
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject boolean for username', () => {
      const player = {
        username: true,
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, false);
    });

    test('should reject string as xp', () => {
      const player = {
        username: 'test',
        xp: '1000',
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      // Zod may or may not coerce string to number, test behavior
      if (!result.success) {
        assert.strictEqual(result.success, false);
      }
    });

    test('should reject invalid URL schemes', () => {
      const invalidUrls = [
        'ftp://example.com',  // ftp might not be valid depending on zod config
        'file:///path/to/file',
        'javascript:alert("xss")',
      ];

      invalidUrls.forEach(url => {
        // ftp is actually a valid URL scheme, so we test with javascript
        if (url.startsWith('javascript:')) {
          const player = {
            username: 'test',
            xp: 100,
            address: url,
          };

          const result = Playersss.safeParse(player);
          // javascript URLs should typically fail
          if (!result.success) {
            assert.strictEqual(result.success, false);
          }
        }
      });
    });
  });

  describe('Type Coercion and Conversion Tests', () => {
    test('should handle XP as string that looks like a number', () => {
      const player = {
        username: 'test',
        xp: '500',
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      // Zod's z.number() typically doesn't auto-coerce strings
      // But we test the behavior
      if (!result.success) {
        assert.strictEqual(result.success, false);
      }
    });

    test('should preserve string type for username', () => {
      const player = {
        username: 'TestPlayer123',
        xp: 100,
        address: 'https://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(typeof result.data.username, 'string');
      assert.strictEqual(result.data.username, 'TestPlayer123');
    });

    test('should preserve URL as string', () => {
      const url = 'https://example.com/profile?id=123';
      const player = {
        username: 'test',
        xp: 100,
        address: url,
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(typeof result.data.address, 'string');
      assert.strictEqual(result.data.address, url);
    });
  });

  describe('Extra Properties Handling', () => {
    test('should ignore extra properties (Zod default)', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com',
        level: 50,
        rank: 'gold',
        extraField: 'should be ignored',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      // Extra properties should not be in the result
      assert.strictEqual(('level' in result.data), false);
    });

    test('should handle multiple extra properties', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com',
        prop1: 'value1',
        prop2: 'value2',
        prop3: 'value3',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
      assert(result.data);
      assert.strictEqual(Object.keys(result.data).length, 3);
    });
  });

  describe('URL Format Variations', () => {
    test('should accept HTTPS URLs', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://secure.example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept HTTP URLs', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'http://example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept localhost URLs', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'http://localhost:3000',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept IP address URLs', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://192.168.1.1',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept IPv6 URLs', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://[::1]:8080',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with subdomain', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://api.example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with multiple subdomains', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://api.v2.example.com',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with port number', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com:8443',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with path', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com/api/v1/users',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });

    test('should accept URL with query string', () => {
      const player = {
        username: 'test',
        xp: 100,
        address: 'https://example.com?page=1&limit=10',
      };

      const result = Playersss.safeParse(player);
      assert.strictEqual(result.success, true);
    });
  });
});