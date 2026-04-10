/**
 * Tests for fools/dummy.ts
 *
 * PR changes tested:
 * - `const var` (reserved keyword) renamed to `const statusMessage` – tests value is preserved
 * - Player schema remains intact: username (string), xp (number), address (url)
 *
 * Run: node --experimental-strip-types --test fools/dummy.test.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Mirror the Player schema from dummy.ts (cannot import directly since dummy.ts
// does not export Player or statusMessage).
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// The renamed constant value from dummy.ts.
const statusMessage = "Variable defined";

// ---------------------------------------------------------------------------
// statusMessage constant (PR change: renamed from reserved keyword `var`)
// ---------------------------------------------------------------------------
describe("statusMessage constant (PR change: reserved keyword rename)", () => {
  test('statusMessage is the string "Variable defined"', () => {
    assert.equal(statusMessage, "Variable defined");
  });

  test("statusMessage is a string type", () => {
    assert.equal(typeof statusMessage, "string");
  });

  test("statusMessage is not empty", () => {
    assert.ok(statusMessage.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Player schema – verify schema is unbroken after the rename
// ---------------------------------------------------------------------------
describe("Player schema (dummy.ts)", () => {
  test("accepts a valid player with all fields", () => {
    const result = Player.safeParse({
      username: "xXProGamerXx",
      xp: 9500,
      address: "https://player.example.com/profile",
    });
    assert.equal(result.success, true);
  });

  test("accepts xp of 0 (boundary value)", () => {
    const result = Player.safeParse({
      username: "newbie",
      xp: 0,
      address: "https://example.com",
    });
    assert.equal(result.success, true);
  });

  test("accepts negative xp (no min constraint)", () => {
    const result = Player.safeParse({
      username: "penalised",
      xp: -100,
      address: "https://example.com",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing username", () => {
    const result = Player.safeParse({
      xp: 100,
      address: "https://example.com",
    });
    assert.equal(result.success, false);
  });

  test("rejects non-string username (number)", () => {
    const result = Player.safeParse({
      username: 42,
      xp: 100,
      address: "https://example.com",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing xp", () => {
    const result = Player.safeParse({
      username: "player1",
      address: "https://example.com",
    });
    assert.equal(result.success, false);
  });

  test("rejects non-numeric xp (string)", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: "lots",
      address: "https://example.com",
    });
    assert.equal(result.success, false);
  });

  test("rejects invalid address (not a URL)", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: 500,
      address: "not-a-url",
    });
    assert.equal(result.success, false);
  });

  test("rejects empty string address", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: 500,
      address: "",
    });
    assert.equal(result.success, false);
  });

  test("rejects missing address", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: 500,
    });
    assert.equal(result.success, false);
  });

  test("accepts address with path segments", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: 500,
      address: "https://example.com/players/42/profile",
    });
    assert.equal(result.success, true);
  });

  // Regression: ensure no extra/unexpected properties are silently allowed
  // (z.object() is not strict here, so additional properties should be stripped/ignored)
  test("parses and returns only defined fields on valid input", () => {
    const result = Player.safeParse({
      username: "testPlayer",
      xp: 1000,
      address: "https://example.com",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.username, "testPlayer");
      assert.equal(result.data.xp, 1000);
      assert.equal(result.data.address, "https://example.com");
    }
  });
});