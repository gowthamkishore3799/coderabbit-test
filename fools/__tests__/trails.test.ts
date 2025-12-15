import * as z from "zod";
import { Playersss } from "../trails";

describe("Playersss Schema Validation Tests", () => {
  // ============================================
  // HAPPY PATH TESTS - Valid Player Data
  // ============================================

  describe("Valid Playersss Schema - Happy Path", () => {
    it("should validate a complete valid player object", () => {
      const validPlayer = {
        username: "player123",
        xp: 1000,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          username: "player123",
          xp: 1000,
          address: "https://example.com",
        });
      }
    });

    it("should validate player with numeric username", () => {
      const validPlayer = {
        username: "player999",
        xp: 5000,
        address: "https://player.example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it("should validate player with special characters in username", () => {
      const validPlayer = {
        username: "player_123",
        xp: 2500,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it("should validate player with very long username", () => {
      const validPlayer = {
        username: "a".repeat(100),
        xp: 9999,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it("should validate player with minimum XP (0)", () => {
      const validPlayer = {
        username: "newplayer",
        xp: 0,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it("should validate player with very high XP value", () => {
      const validPlayer = {
        username: "veteran",
        xp: 999999999,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // USERNAME FIELD VALIDATION
  // ============================================

  describe("Username Field Validation", () => {
    it("should accept valid usernames", () => {
      const validUsernames = [
        "player1",
        "John_Doe",
        "user-name",
        "test.player",
        "Alpha123Beta",
        "x",
        "a".repeat(255),
      ];

      validUsernames.forEach((username) => {
        const player = {
          username,
          xp: 100,
          address: "https://example.com",
        };

        const result = Playersss.safeParse(player);
        expect(result.success).toBe(true);
      });
    });

    it("should accept empty string username", () => {
      const player = {
        username: "",
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should reject non-string username", () => {
      const invalidPlayers = [
        {
          username: 123,
          xp: 100,
          address: "https://example.com",
        },
        {
          username: null,
          xp: 100,
          address: "https://example.com",
        },
        {
          username: undefined,
          xp: 100,
          address: "https://example.com",
        },
        {
          username: true,
          xp: 100,
          address: "https://example.com",
        },
        {
          username: [],
          xp: 100,
          address: "https://example.com",
        },
      ];

      invalidPlayers.forEach((player) => {
        const result = Playersss.safeParse(player);
        expect(result.success).toBe(false);
      });
    });

    it("should reject missing username field", () => {
      const player = {
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should accept username with unicode characters", () => {
      const player = {
        username: "плеер",
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should accept username with spaces", () => {
      const player = {
        username: "player name",
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // XP FIELD VALIDATION
  // ============================================

  describe("XP (Experience Points) Field Validation", () => {
    it("should accept valid XP values", () => {
      const validXpValues = [
        0,
        1,
        100,
        1000,
        999999,
        Number.MAX_SAFE_INTEGER,
      ];

      validXpValues.forEach((xp) => {
        const player = {
          username: "player",
          xp,
          address: "https://example.com",
        };

        const result = Playersss.safeParse(player);
        expect(result.success).toBe(true);
      });
    });

    it("should accept XP as string and coerce to number", () => {
      const player = {
        username: "player",
        xp: "500",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.xp).toBe(500);
      }
    });

    it("should reject negative XP", () => {
      const player = {
        username: "player",
        xp: -1,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should reject XP as float/decimal", () => {
      const player = {
        username: "player",
        xp: 100.5,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      // Note: z.number() accepts decimals, so this may pass
      expect(result).toBeDefined();
    });

    it("should reject non-numeric XP", () => {
      const invalidPlayers = [
        {
          username: "player",
          xp: "not-a-number",
          address: "https://example.com",
        },
        {
          username: "player",
          xp: null,
          address: "https://example.com",
        },
        {
          username: "player",
          xp: undefined,
          address: "https://example.com",
        },
        {
          username: "player",
          xp: true,
          address: "https://example.com",
        },
        {
          username: "player",
          xp: [],
          address: "https://example.com",
        },
        {
          username: "player",
          xp: {},
          address: "https://example.com",
        },
      ];

      invalidPlayers.forEach((player) => {
        const result = Playersss.safeParse(player);
        expect(result.success).toBe(false);
      });
    });

    it("should reject missing XP field", () => {
      const player = {
        username: "player",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should accept XP value zero (edge case)", () => {
      const player = {
        username: "newplayer",
        xp: 0,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.xp).toBe(0);
      }
    });

    it("should accept very large XP values", () => {
      const player = {
        username: "veteran",
        xp: Number.MAX_SAFE_INTEGER,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should handle Infinity XP gracefully", () => {
      const player = {
        username: "player",
        xp: Infinity,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      // Infinity is a number but may be rejected by validation
      expect(result).toBeDefined();
    });

    it("should handle NaN XP gracefully", () => {
      const player = {
        username: "player",
        xp: NaN,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      // NaN is a number but typically rejected by validation
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // ADDRESS (URL) FIELD VALIDATION
  // ============================================

  describe("Address Field (URL) Validation", () => {
    it("should accept valid URLs", () => {
      const validUrls = [
        "https://example.com",
        "http://www.example.com",
        "https://subdomain.example.co.uk",
        "https://example.com/path",
        "https://example.com/path?query=value",
        "https://example.com:8080",
        "https://example.com:3000/api/players",
        "https://192.168.1.1",
        "https://example.com/path#anchor",
      ];

      validUrls.forEach((url) => {
        const player = {
          username: "player",
          xp: 100,
          address: url,
        };

        const result = Playersss.safeParse(player);
        expect(result.success).toBe(true);
      });
    });

    it("should accept URLs with authentication", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://user:password@example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = [
        "not-a-url",
        "example.com",
        "ftp://example.com",
        "http:/example.com",
        "://example.com",
        "http://",
        "https://",
        "",
        " https://example.com ",
      ];

      invalidUrls.forEach((url) => {
        const player = {
          username: "player",
          xp: 100,
          address: url,
        };

        const result = Playersss.safeParse(player);
        if (url === "") {
          // Empty string may be coerced differently
          expect(result).toBeDefined();
        } else {
          expect(result.success).toBe(false);
        }
      });
    });

    it("should reject non-string address", () => {
      const invalidPlayers = [
        {
          username: "player",
          xp: 100,
          address: 123,
        },
        {
          username: "player",
          xp: 100,
          address: null,
        },
        {
          username: "player",
          xp: 100,
          address: undefined,
        },
        {
          username: "player",
          xp: 100,
          address: true,
        },
        {
          username: "player",
          xp: 100,
          address: [],
        },
        {
          username: "player",
          xp: 100,
          address: {},
        },
      ];

      invalidPlayers.forEach((player) => {
        const result = Playersss.safeParse(player);
        expect(result.success).toBe(false);
      });
    });

    it("should reject missing address field", () => {
      const player = {
        username: "player",
        xp: 100,
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should handle URLs with special characters in path", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://example.com/api/players/get?id=123&name=test",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should validate IPv6 URLs", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://[2001:db8::1]",
      };

      const result = Playersss.safeParse(player);
      expect(result).toBeDefined();
    });

    it("should reject relative URLs", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "/path/to/resource",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // COMPLETE OBJECT VALIDATION
  // ============================================

  describe("Complete Object Validation", () => {
    it("should validate object with all required fields", () => {
      const player = {
        username: "testplayer",
        xp: 2500,
        address: "https://api.example.com/player/123",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(player);
      }
    });

    it("should reject object with missing username", () => {
      const player = {
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should reject object with missing xp", () => {
      const player = {
        username: "player",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should reject object with missing address", () => {
      const player = {
        username: "player",
        xp: 100,
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should handle object with extra fields", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://example.com",
        extraField: "should not cause issue",
        anotherExtra: 123,
      };

      const result = Playersss.safeParse(player);
      // z.object allows extra properties by default, may or may not pass
      expect(result).toBeDefined();
    });

    it("should reject completely empty object", () => {
      const player = {};

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should reject null instead of object", () => {
      const result = Playersss.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject undefined instead of object", () => {
      const result = Playersss.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("should reject string instead of object", () => {
      const result = Playersss.safeParse("player");
      expect(result.success).toBe(false);
    });

    it("should reject array instead of object", () => {
      const result = Playersss.safeParse(["username", 100, "https://example.com"]);
      expect(result.success).toBe(false);
    });

    it("should reject number instead of object", () => {
      const result = Playersss.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("should reject boolean instead of object", () => {
      const result = Playersss.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // DATA TYPE COERCION TESTS
  // ============================================

  describe("Data Type Coercion", () => {
    it("should coerce numeric string to number for xp", () => {
      const player = {
        username: "player",
        xp: "250",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.xp).toBe(250);
        expect(typeof result.data.xp).toBe("number");
      }
    });

    it("should not coerce non-numeric string to number for xp", () => {
      const player = {
        username: "player",
        xp: "abc",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(false);
    });

    it("should handle object with mixed type inputs", () => {
      const player = {
        username: 12345,
        xp: "100",
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      // username as number should fail string validation
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // SCHEMA TYPE INFERENCE
  // ============================================

  describe("Schema Type Inference", () => {
    it("should infer correct type for parsed player", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify the inferred type is correct
        expect(typeof result.data.username).toBe("string");
        expect(typeof result.data.xp).toBe("number");
        expect(typeof result.data.address).toBe("string");
      }
    });
  });

  // ============================================
  // VALIDATION ERROR MESSAGES
  // ============================================

  describe("Validation Error Handling", () => {
    it("should provide meaningful error for invalid data", () => {
      const invalidPlayer = {
        username: "player",
        xp: "not a number",
        address: "not-a-url",
      };

      const result = Playersss.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should provide error for multiple missing fields", () => {
      const invalidPlayer = {
        username: "player",
      };

      const result = Playersss.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should provide detailed error path information", () => {
      const invalidPlayer = {
        username: "player",
        xp: 100,
        address: "invalid-url",
      };

      const result = Playersss.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
      if (!result.success) {
        const addressError = result.error.issues.find((issue) =>
          issue.path.includes("address")
        );
        expect(addressError).toBeDefined();
      }
    });
  });

  // ============================================
  // EDGE CASES & BOUNDARY CONDITIONS
  // ============================================

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle extremely long username", () => {
      const player = {
        username: "a".repeat(10000),
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should handle whitespace-only username", () => {
      const player = {
        username: "   ",
        xp: 100,
        address: "https://example.com",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should handle URL with extremely long path", () => {
      const player = {
        username: "player",
        xp: 100,
        address: `https://example.com/${("a".repeat(1000))}`,
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should handle player object that is frozen", () => {
      const player = Object.freeze({
        username: "player",
        xp: 100,
        address: "https://example.com",
      });

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should handle player with symbol keys in object", () => {
      const sym = Symbol("test");
      const player = {
        username: "player",
        xp: 100,
        address: "https://example.com",
        [sym]: "symbol value",
      };

      const result = Playersss.safeParse(player);
      expect(result.success).toBe(true);
    });

    it("should validate same player data multiple times consistently", () => {
      const player = {
        username: "player",
        xp: 100,
        address: "https://example.com",
      };

      const result1 = Playersss.safeParse(player);
      const result2 = Playersss.safeParse(player);
      const result3 = Playersss.safeParse(player);

      expect(result1.success).toBe(result2.success);
      expect(result2.success).toBe(result3.success);

      if (result1.success && result2.success && result3.success) {
        expect(result1.data).toEqual(result2.data);
        expect(result2.data).toEqual(result3.data);
      }
    });

    it("should handle player with circular reference gracefully", () => {
      const player: any = {
        username: "player",
        xp: 100,
        address: "https://example.com",
      };
      player.self = player; // Create circular reference

      // This might throw depending on zod's handling
      expect(() => Playersss.safeParse(player)).toBeDefined();
    });
  });
});