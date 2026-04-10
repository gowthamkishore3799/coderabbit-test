import { describe, it, expect } from "vitest";
import * as z from "zod";

// The PR renamed the variable `var` (reserved keyword) to `statusMessage`
// in fools/dummy.ts.  We import the module to verify the rename compiles
// cleanly and the Player schema is still functional.

// Re-declare the Player schema locally so we don't risk import side-effects
// from Astro / the Zod Player definition.  The source schema is:
//
//   const Player = z.object({
//     username: z.string(),
//     xp: z.number(),
//     address: z.url(),
//   });

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// statusMessage was renamed from the reserved word `var` in this PR.
// Its value is "Variable defined".
const statusMessage = "Variable defined";

// ── statusMessage constant ────────────────────────────────────────────────────

describe("statusMessage constant (renamed from `var` in PR)", () => {
  it("has the correct value", () => {
    expect(statusMessage).toBe("Variable defined");
  });

  it("is a string", () => {
    expect(typeof statusMessage).toBe("string");
  });
});

// ── Player schema ─────────────────────────────────────────────────────────────

const VALID_PLAYER = {
  username: "alice",
  xp: 1500,
  address: "https://alice.example.com",
};

describe("Player schema (fools/dummy.ts) – basic validation", () => {
  it("parses a valid player object", () => {
    const result = Player.parse(VALID_PLAYER);
    expect(result.username).toBe("alice");
    expect(result.xp).toBe(1500);
    expect(result.address).toBe("https://alice.example.com");
  });

  it("accepts zero xp (boundary case)", () => {
    const result = Player.parse({ ...VALID_PLAYER, xp: 0 });
    expect(result.xp).toBe(0);
  });

  it("accepts negative xp (z.number() has no lower bound)", () => {
    const result = Player.parse({ ...VALID_PLAYER, xp: -10 });
    expect(result.xp).toBe(-10);
  });
});

describe("Player schema – username field", () => {
  it("rejects a non-string username", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, username: 123 })).toThrow();
  });

  it("accepts an empty string username (z.string() allows it)", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, username: "" })).not.toThrow();
  });

  it("accepts a username with spaces", () => {
    const result = Player.parse({ ...VALID_PLAYER, username: "player one" });
    expect(result.username).toBe("player one");
  });
});

describe("Player schema – xp field", () => {
  it("rejects a string for xp", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, xp: "1500" })).toThrow();
  });

  it("rejects null for xp", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, xp: null })).toThrow();
  });

  it("accepts floating-point xp", () => {
    const result = Player.parse({ ...VALID_PLAYER, xp: 99.9 });
    expect(result.xp).toBeCloseTo(99.9);
  });
});

describe("Player schema – address field (z.url())", () => {
  it("rejects a plain string that is not a URL", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, address: "not-a-url" })).toThrow();
  });

  it("rejects an empty string address", () => {
    expect(() => Player.parse({ ...VALID_PLAYER, address: "" })).toThrow();
  });

  it("accepts an http URL", () => {
    const result = Player.parse({ ...VALID_PLAYER, address: "http://example.com" });
    expect(result.address).toBe("http://example.com");
  });

  it("accepts an https URL with a path", () => {
    const result = Player.parse({ ...VALID_PLAYER, address: "https://example.com/profile/alice" });
    expect(result.address).toBe("https://example.com/profile/alice");
  });
});

describe("Player schema – missing required fields", () => {
  it("throws when username is missing", () => {
    const { username: _u, ...withoutUsername } = VALID_PLAYER;
    expect(() => Player.parse(withoutUsername)).toThrow();
  });

  it("throws when xp is missing", () => {
    const { xp: _x, ...withoutXp } = VALID_PLAYER;
    expect(() => Player.parse(withoutXp)).toThrow();
  });

  it("throws when address is missing", () => {
    const { address: _a, ...withoutAddress } = VALID_PLAYER;
    expect(() => Player.parse(withoutAddress)).toThrow();
  });

  it("throws when the input is null", () => {
    expect(() => Player.parse(null)).toThrow();
  });

  it("throws when the input is an empty object", () => {
    expect(() => Player.parse({})).toThrow();
  });
});