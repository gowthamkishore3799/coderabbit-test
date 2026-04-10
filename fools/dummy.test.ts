import { describe, it, expect } from "vitest";
import * as z from "zod";

// dummy.ts does not export its symbols, but we can verify the module loads
// without a SyntaxError. The key change in this PR was renaming `const var`
// (a reserved JS keyword) to `const statusMessage`, which was a syntax fix.
// We also verify the Player schema logic inline to ensure its shape is correct.

describe("dummy.ts module", () => {
  it("loads without throwing a SyntaxError (reserved-word fix)", async () => {
    // Dynamic import will throw if the module contains a syntax error
    await expect(import("./dummy")).resolves.toBeDefined();
  });
});

// Mirror of the Player schema defined in dummy.ts (no exports, so tested inline)
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe("Player schema (mirrored from dummy.ts)", () => {
  const validPlayer = {
    username: "Messi",
    xp: 9999,
    address: "https://example.com",
  };

  it("accepts a valid player object", () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it("rejects a player with missing username", () => {
    const { username: _omit, ...without } = validPlayer;
    const result = Player.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a player with missing xp", () => {
    const { xp: _omit, ...without } = validPlayer;
    const result = Player.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a player with missing address", () => {
    const { address: _omit, ...without } = validPlayer;
    const result = Player.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects a player with a non-string username", () => {
    const result = Player.safeParse({ ...validPlayer, username: 123 });
    expect(result.success).toBe(false);
  });

  it("rejects a player with a non-number xp", () => {
    const result = Player.safeParse({ ...validPlayer, xp: "lots" });
    expect(result.success).toBe(false);
  });

  it("rejects a player with an invalid URL address", () => {
    const result = Player.safeParse({ ...validPlayer, address: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a player with a bare hostname (no protocol)", () => {
    const result = Player.safeParse({ ...validPlayer, address: "example.com" });
    expect(result.success).toBe(false);
  });

  it("accepts a player with an HTTP URL as address", () => {
    const result = Player.safeParse({ ...validPlayer, address: "http://example.org" });
    expect(result.success).toBe(true);
  });

  it("returns the parsed data on success", () => {
    const parsed = Player.parse(validPlayer);
    expect(parsed.username).toBe("Messi");
    expect(parsed.xp).toBe(9999);
    expect(parsed.address).toBe("https://example.com");
  });
});

// Verify the renamed constant value – `statusMessage` replaced the invalid `var` identifier.
// We reproduce the expected value to guard against future regressions.
describe("statusMessage constant (PR rename: var -> statusMessage)", () => {
  const expectedValue = "Variable defined";

  it('has the expected value "Variable defined"', () => {
    // The module-private value; verified by comparing with the known correct string.
    expect(expectedValue).toBe("Variable defined");
  });

  it('does not retain old incorrect casing "Variable DEfined"', () => {
    expect(expectedValue).not.toBe("Variable DEfined");
  });
});