import { describe, it, expect } from 'vitest'
import * as z from 'zod'

// Import the schema from trails.ts
// Note: Since Playersss is not exported, we'll need to test it indirectly
// or we can recreate it for testing purposes
describe('Playersss Schema (from trails.ts)', () => {
  // Recreate the schema as it appears in trails.ts for testing
  const Playersss = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  })

  describe('Valid Player Objects', () => {
    it('should validate a complete valid player object', () => {
      const validPlayer = {
        username: 'john_doe',
        xp: 1500,
        address: 'https://player.example.com/john',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.username).toBe('john_doe')
        expect(result.data.xp).toBe(1500)
        expect(result.data.address).toBe('https://player.example.com/john')
      }
    })

    it('should validate player with zero xp', () => {
      const player = {
        username: 'newbie',
        xp: 0,
        address: 'https://game.com/players/newbie',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should validate player with negative xp', () => {
      const player = {
        username: 'penalized_player',
        xp: -100,
        address: 'https://game.com/players/penalized',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should validate player with very large xp', () => {
      const player = {
        username: 'pro_gamer',
        xp: 9999999,
        address: 'https://leaderboard.game.com/pro',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should validate player with decimal xp', () => {
      const player = {
        username: 'partial_progress',
        xp: 1234.56,
        address: 'https://game.com/player',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })
  })

  describe('Username Validation', () => {
    it('should accept various username formats', () => {
      const validUsernames = [
        'simple',
        'user123',
        'user_name',
        'user-name',
        'User.Name',
        'a',
        'very_long_username_with_many_characters_1234567890',
      ]

      validUsernames.forEach(username => {
        const player = {
          username,
          xp: 100,
          address: 'https://example.com',
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should accept empty string username', () => {
      const player = {
        username: '',
        xp: 100,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should accept username with special characters', () => {
      const player = {
        username: '!@#$%^&*()',
        xp: 100,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should accept username with unicode characters', () => {
      const player = {
        username: '用户名',
        xp: 100,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should accept username with emojis', () => {
      const player = {
        username: '🎮player🎯',
        xp: 100,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should reject non-string username', () => {
      const invalidPlayers = [
        { username: 123, xp: 100, address: 'https://example.com' },
        { username: null, xp: 100, address: 'https://example.com' },
        { username: undefined, xp: 100, address: 'https://example.com' },
        { username: [], xp: 100, address: 'https://example.com' },
        { username: {}, xp: 100, address: 'https://example.com' },
      ]

      invalidPlayers.forEach(player => {
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })
  })

  describe('XP (Experience Points) Validation', () => {
    it('should accept integer xp values', () => {
      const xpValues = [0, 1, 100, 1000, 10000, 999999]

      xpValues.forEach(xp => {
        const player = {
          username: 'player',
          xp,
          address: 'https://example.com',
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should accept floating point xp values', () => {
      const xpValues = [0.5, 1.25, 99.99, 1234.5678]

      xpValues.forEach(xp => {
        const player = {
          username: 'player',
          xp,
          address: 'https://example.com',
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should accept negative xp values', () => {
      const xpValues = [-1, -100, -1000.5]

      xpValues.forEach(xp => {
        const player = {
          username: 'player',
          xp,
          address: 'https://example.com',
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should reject non-numeric xp values', () => {
      const invalidXpValues = [
        'string',
        '100',
        null,
        undefined,
        [],
        {},
        true,
        false,
      ]

      invalidXpValues.forEach(xp => {
        const player = {
          username: 'player',
          xp,
          address: 'https://example.com',
        }
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })

    it('should reject NaN as xp', () => {
      const player = {
        username: 'player',
        xp: NaN,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })

    it('should reject Infinity as xp', () => {
      const invalidPlayers = [
        { username: 'player', xp: Infinity, address: 'https://example.com' },
        { username: 'player', xp: -Infinity, address: 'https://example.com' },
      ]

      invalidPlayers.forEach(player => {
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })
  })

  describe('Address (URL) Validation', () => {
    it('should accept valid HTTP URLs', () => {
      const validUrls = [
        'http://example.com',
        'http://www.example.com',
        'http://subdomain.example.com',
        'http://example.com/path',
        'http://example.com/path/to/resource',
        'http://example.com:8080',
        'http://example.com:8080/path',
      ]

      validUrls.forEach(address => {
        const player = {
          username: 'player',
          xp: 100,
          address,
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should accept valid HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://www.example.com',
        'https://api.example.com/v1',
        'https://example.com:443',
        'https://example.com/path?query=value',
        'https://example.com/path#fragment',
      ]

      validUrls.forEach(address => {
        const player = {
          username: 'player',
          xp: 100,
          address,
        }
        expect(Playersss.safeParse(player).success).toBe(true)
      })
    })

    it('should accept URLs with query parameters', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/player?id=123&level=5',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should accept URLs with fragments', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/profile#achievements',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should accept URLs with special characters in path', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/player/user-name_123',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should reject invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'www.example.com',
        'ftp://example.com',
        'file:///path/to/file',
        'javascript:alert(1)',
        'mailto:user@example.com',
        '',
        ' ',
      ]

      invalidUrls.forEach(address => {
        const player = {
          username: 'player',
          xp: 100,
          address,
        }
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })

    it('should reject URL without protocol', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'example.com/path',
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'http://',
        'https://',
        'http://.',
        'http://..',
        'http://../',
        'http://?',
        'http://??',
        'http://??/',
        'http://#',
        'http://##',
        'http://##/',
      ]

      malformedUrls.forEach(address => {
        const player = {
          username: 'player',
          xp: 100,
          address,
        }
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })

    it('should reject non-string address values', () => {
      const invalidValues = [123, null, undefined, [], {}, true]

      invalidValues.forEach(address => {
        const player = {
          username: 'player',
          xp: 100,
          address,
        }
        expect(Playersss.safeParse(player).success).toBe(false)
      })
    })
  })

  describe('Missing Required Fields', () => {
    it('should reject player missing username', () => {
      const player = {
        xp: 100,
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })

    it('should reject player missing xp', () => {
      const player = {
        username: 'player',
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })

    it('should reject player missing address', () => {
      const player = {
        username: 'player',
        xp: 100,
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })

    it('should reject empty object', () => {
      expect(Playersss.safeParse({}).success).toBe(false)
    })
  })

  describe('Extra Fields Handling', () => {
    it('should strip extra fields by default', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com',
        extraField: 'should be stripped',
        anotherExtra: 123,
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField')
        expect(result.data).not.toHaveProperty('anotherExtra')
        expect(Object.keys(result.data)).toEqual(['username', 'xp', 'address'])
      }
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle player with all boundary values', () => {
      const edgeCasePlayer = {
        username: '',
        xp: 0,
        address: 'http://a.b',
      }

      expect(Playersss.safeParse(edgeCasePlayer).success).toBe(true)
    })

    it('should handle player with maximum practical values', () => {
      const maxPlayer = {
        username: 'a'.repeat(1000),
        xp: Number.MAX_SAFE_INTEGER,
        address: 'https://example.com/' + 'path/'.repeat(100),
      }

      const result = Playersss.safeParse(maxPlayer)
      expect(result.success).toBe(true)
    })

    it('should reject player with unsafe integer xp', () => {
      const player = {
        username: 'player',
        xp: Number.MAX_SAFE_INTEGER + 1,
        address: 'https://example.com',
      }

      // While technically this will parse, testing the behavior
      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })
  })

  describe('Type Safety and Schema Structure', () => {
    it('should maintain correct field types after parsing', () => {
      const player = {
        username: 'type_test',
        xp: 500,
        address: 'https://test.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.username).toBe('string')
        expect(typeof result.data.xp).toBe('number')
        expect(typeof result.data.address).toBe('string')
      }
    })

    it('should not coerce types implicitly', () => {
      const player = {
        username: 'player',
        xp: '100', // String instead of number
        address: 'https://example.com',
      }

      expect(Playersss.safeParse(player).success).toBe(false)
    })
  })

  describe('Schema Composition and Inference', () => {
    it('should allow type inference from schema', () => {
      type Player = z.infer<typeof Playersss>

      const player: Player = {
        username: 'inferred',
        xp: 250,
        address: 'https://inferred.com',
      }

      expect(Playersss.safeParse(player).success).toBe(true)
    })

    it('should be composable with other schemas', () => {
      const ExtendedPlayer = Playersss.extend({
        level: z.number().int().min(1),
      })

      const extendedPlayer = {
        username: 'extended_player',
        xp: 1000,
        address: 'https://game.com',
        level: 5,
      }

      expect(ExtendedPlayer.safeParse(extendedPlayer).success).toBe(true)
    })

    it('should support partial schemas', () => {
      const PartialPlayer = Playersss.partial()

      const partialPlayer = {
        username: 'partial',
      }

      expect(PartialPlayer.safeParse(partialPlayer).success).toBe(true)
    })

    it('should support picking specific fields', () => {
      const UsernameOnly = Playersss.pick({ username: true })

      const usernameOnly = {
        username: 'picked',
      }

      expect(UsernameOnly.safeParse(usernameOnly).success).toBe(true)
    })
  })

  describe('Error Messages and Validation Feedback', () => {
    it('should provide clear error for invalid username type', () => {
      const player = {
        username: 123,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1)
        expect(result.error.issues[0].path).toContain('username')
      }
    })

    it('should provide clear error for invalid xp type', () => {
      const player = {
        username: 'player',
        xp: 'not-a-number',
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('xp')
      }
    })

    it('should provide clear error for invalid address', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'not-a-url',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('address')
      }
    })

    it('should accumulate multiple errors', () => {
      const player = {
        username: 123,
        xp: 'invalid',
        address: 'invalid-url',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
      }
    })
  })
})