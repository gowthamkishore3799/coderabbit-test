// Tests for fools/dummy.ts
// Changed in PR: renamed `const var` (invalid identifier) to `const statusMessage`.
// Neither Player nor statusMessage are exported; tests verify module loads and document schema shape.

import { describe, it, expect } from "vitest";
import * as z from "zod";

// ---------------------------------------------------------------------------
// Module load check – ensure the rename resolves the parse error
// ---------------------------------------------------------------------------
describe("dummy.ts module", () => {
  it("loads without throwing (statusMessage rename eliminated the invalid identifier)", async () => {
    // A dynamic import rejects if the module has a runtime/syntax error.
    await expect(import("./dummy")).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Player schema (defined in dummy.ts, validated in this PR context)
// ---------------------------------------------------------------------------
describe("Player schema (fools/dummy.ts)", () => {
  // Since Player is not exported, we re-declare an equivalent schema here
  // to verify the intended shape. This documents the PR change's schema.
  const PlayerSchema = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  const validPlayer = {
    username: "hero42",
    xp: 1500,
    address: "https://player.example.com",
  };

  it("accepts a fully valid player object", () => {
    const result = PlayerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it("rejects a player with an invalid URL address", () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, address: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a player with a missing username", () => {
    const { username, ...withoutUsername } = validPlayer;
    const result = PlayerSchema.safeParse(withoutUsername);
    expect(result.success).toBe(false);
  });

  it("rejects a player with a non-numeric xp value", () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, xp: "not-a-number" });
    expect(result.success).toBe(false);
  });

  it("accepts negative xp (z.number() has no min constraint)", () => {
    // z.number() has no minimum in this schema, so negative values are accepted
    const result = PlayerSchema.safeParse({ ...validPlayer, xp: -100 });
    expect(result.success).toBe(true);
  });

  it("rejects an empty object", () => {
    const result = PlayerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a valid http URL for address", () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, address: "http://player.example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a bare hostname without protocol for address", () => {
    const result = PlayerSchema.safeParse({ ...validPlayer, address: "player.example.com" });
    expect(result.success).toBe(false);
  });
});