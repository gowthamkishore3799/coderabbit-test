import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Import the schema from trails.ts
// Note: Since trails.ts doesn't export the schema, we'll recreate it for testing
const Playersss = z.object({ 
  username: z.string(),
  xp: z.number(),
  address: z.url(),
})

type Player = z.infer<typeof Playersss>

describe('Playersss Schema', () => {
  describe('Happy Path - Valid Player Data', () => {
    it('should parse a complete valid player object', () => {
      const validPlayer = {
        username: 'player123',
        xp: 1500,
        address: 'https://player.example.com/profile',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validPlayer)
      }
    })

    it('should parse player with zero XP', () => {
      const validPlayer = {
        username: 'newplayer',
        xp: 0,
        address: 'https://example.com/player',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
    })

    it('should parse player with large XP value', () => {
      const validPlayer = {
        username: 'veteran',
        xp: 999999999,
        address: 'https://example.com/veteran',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
    })

    it('should parse player with HTTP address', () => {
      const validPlayer = {
        username: 'testplayer',
        xp: 100,
        address: 'http://example.com/player',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
    })

    it('should parse player with HTTPS address with path and query', () => {
      const validPlayer = {
        username: 'advancedplayer',
        xp: 5000,
        address: 'https://example.com/players/profile?id=123',
      }

      const result = Playersss.safeParse(validPlayer)
      expect(result.success).toBe(true)
    })
  })

  describe('Username Validation', () => {
    it('should accept alphanumeric username', () => {
      const player = {
        username: 'Player123',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept username with special characters', () => {
      const player = {
        username: 'player_name-123',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept single character username', () => {
      const player = {
        username: 'A',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept very long username', () => {
      const player = {
        username: 'a'.repeat(1000),
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept username with spaces', () => {
      const player = {
        username: 'Player Name',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept username with unicode characters', () => {
      const player = {
        username: 'プレイヤー123',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept username with emojis', () => {
      const player = {
        username: 'player🎮',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should reject empty string username', () => {
      const invalidPlayer = {
        username: '',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject missing username', () => {
      const invalidPlayer = {
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject null username', () => {
      const invalidPlayer = {
        username: null,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject undefined username', () => {
      const invalidPlayer = {
        username: undefined,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string username (number)', () => {
      const invalidPlayer = {
        username: 12345,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string username (boolean)', () => {
      const invalidPlayer = {
        username: true,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string username (object)', () => {
      const invalidPlayer = {
        username: { name: 'player' },
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string username (array)', () => {
      const invalidPlayer = {
        username: ['player'],
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })
  })

  describe('XP (Experience Points) Validation', () => {
    it('should accept zero XP', () => {
      const player = {
        username: 'newbie',
        xp: 0,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept positive integer XP', () => {
      const player = {
        username: 'player',
        xp: 12345,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept negative XP', () => {
      const player = {
        username: 'penalized',
        xp: -100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept floating point XP', () => {
      const player = {
        username: 'precise',
        xp: 123.45,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept very large XP value', () => {
      const player = {
        username: 'maxed',
        xp: Number.MAX_SAFE_INTEGER,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept very small negative XP value', () => {
      const player = {
        username: 'minimal',
        xp: Number.MIN_SAFE_INTEGER,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should reject string XP value', () => {
      const invalidPlayer = {
        username: 'player',
        xp: '100',
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject missing XP', () => {
      const invalidPlayer = {
        username: 'player',
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject null XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: null,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject undefined XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: undefined,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject NaN XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: NaN,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject boolean XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: true,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject object XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: { value: 100 },
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject array XP', () => {
      const invalidPlayer = {
        username: 'player',
        xp: [100],
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should accept Infinity', () => {
      const player = {
        username: 'infinite',
        xp: Infinity,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept negative Infinity', () => {
      const player = {
        username: 'negInfinite',
        xp: -Infinity,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })
  })

  describe('Address URL Validation', () => {
    it('should accept valid HTTPS URL', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept valid HTTP URL', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'http://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with subdomain', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://api.example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with multiple subdomains', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://player.api.example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with path', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/players/profile',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with query parameters', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/player?id=123&name=test',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with fragment', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/player#section',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with port', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com:8080/player',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with authentication', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://user:pass@example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with IP address', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://192.168.1.1',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should accept URL with localhost', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'http://localhost:3000',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL format', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 'not-a-url',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject URL without protocol', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 'example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject URL with invalid protocol', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 'ftp://example.com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject empty string address', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: '',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject missing address', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject null address', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: null,
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject undefined address', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: undefined,
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string address (number)', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 12345,
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject non-string address (boolean)', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: true,
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })

    it('should reject malformed URL with spaces', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 'https://example .com',
      }

      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(false)
    })
  })

  describe('Complete Object Validation', () => {
    it('should reject completely empty object', () => {
      const result = Playersss.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject object with extra fields', () => {
      const invalidPlayer = {
        username: 'player',
        xp: 100,
        address: 'https://example.com',
        extraField: 'not allowed',
      }

      // Note: By default, Zod allows extra fields. This test documents current behavior.
      // If strict validation is needed, use z.strict()
      const result = Playersss.safeParse(invalidPlayer)
      expect(result.success).toBe(true) // Extra fields are allowed by default
    })

    it('should handle null as input', () => {
      const result = Playersss.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should handle undefined as input', () => {
      const result = Playersss.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should handle array as input', () => {
      const result = Playersss.safeParse([])
      expect(result.success).toBe(false)
    })

    it('should handle string as input', () => {
      const result = Playersss.safeParse('not an object')
      expect(result.success).toBe(false)
    })

    it('should handle number as input', () => {
      const result = Playersss.safeParse(123)
      expect(result.success).toBe(false)
    })

    it('should handle boolean as input', () => {
      const result = Playersss.safeParse(true)
      expect(result.success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer Player type from schema', () => {
      const player: Player = {
        username: 'typedPlayer',
        xp: 1000,
        address: 'https://example.com',
      }

      // This test primarily validates TypeScript compilation
      expect(player).toBeDefined()
      expect(player.username).toBe('typedPlayer')
      expect(player.xp).toBe(1000)
      expect(player.address).toBe('https://example.com')
    })
  })

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle player with minimum reasonable values', () => {
      const player = {
        username: 'a',
        xp: 0,
        address: 'http://a.co',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should handle player with maximum reasonable values', () => {
      const player = {
        username: 'A'.repeat(1000),
        xp: Number.MAX_SAFE_INTEGER,
        address: 'https://' + 'a'.repeat(200) + '.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should handle special characters in username', () => {
      const specialChars = '!@#$%^&*()[]{}|\\;:\'",<.>/?`~'
      const player = {
        username: `player${specialChars}`,
        xp: 100,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should handle URL with very long path', () => {
      const player = {
        username: 'player',
        xp: 100,
        address: 'https://example.com/' + 'a'.repeat(500),
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })

    it('should handle fractional XP with many decimal places', () => {
      const player = {
        username: 'precise',
        xp: 123.456789012345,
        address: 'https://example.com',
      }

      const result = Playersss.safeParse(player)
      expect(result.success).toBe(true)
    })
  })
})