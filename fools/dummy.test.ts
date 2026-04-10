import { describe, it, expect } from "vitest";

// dummy.ts exports are not named exports — re-import the module internals
// by importing the module object so we can test the schema and constant.
// The module has: Player (z.object), statusMessage (string constant)
import * as dummyModule from "./dummy";

describe("dummy.ts module", () => {
  describe("statusMessage constant (renamed from invalid 'var' identifier in this PR)", () => {
    it("exports statusMessage as a string", () => {
      // Verify the module exports the constant and it has the correct type
      expect(typeof (dummyModule as any).statusMessage).toBe("string");
    });

    it("statusMessage has value 'Variable defined'", () => {
      expect((dummyModule as any).statusMessage).toBe("Variable defined");
    });

    it("statusMessage is not empty", () => {
      expect((dummyModule as any).statusMessage.length).toBeGreaterThan(0);
    });
  });

  describe("Player schema", () => {
    const validPlayer = {
      username: "heroPlayer",
      xp: 1500,
      address: "https://player.example.com",
    };

    it("accepts a valid player", () => {
      const result = (dummyModule as any).Player.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it("accepts player with zero xp", () => {
      const result = (dummyModule as any).Player.safeParse({ ...validPlayer, xp: 0 });
      expect(result.success).toBe(true);
    });

    it("accepts player with negative xp", () => {
      const result = (dummyModule as any).Player.safeParse({ ...validPlayer, xp: -100 });
      expect(result.success).toBe(true);
    });

    it("rejects player with non-string username", () => {
      const result = (dummyModule as any).Player.safeParse({ ...validPlayer, username: 42 });
      expect(result.success).toBe(false);
    });

    it("rejects player with non-number xp", () => {
      const result = (dummyModule as any).Player.safeParse({ ...validPlayer, xp: "lots" });
      expect(result.success).toBe(false);
    });

    it("rejects player with invalid address URL", () => {
      const result = (dummyModule as any).Player.safeParse({ ...validPlayer, address: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects player with missing username", () => {
      const { username, ...rest } = validPlayer;
      const result = (dummyModule as any).Player.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects player with missing xp", () => {
      const { xp, ...rest } = validPlayer;
      const result = (dummyModule as any).Player.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects player with missing address", () => {
      const { address, ...rest } = validPlayer;
      const result = (dummyModule as any).Player.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects completely empty object", () => {
      const result = (dummyModule as any).Player.safeParse({});
      expect(result.success).toBe(false);
    });

    it("parses valid player and returns correct fields", () => {
      const result = (dummyModule as any).Player.parse(validPlayer);
      expect(result.username).toBe("heroPlayer");
      expect(result.xp).toBe(1500);
      expect(result.address).toBe("https://player.example.com");
    });
  });
});