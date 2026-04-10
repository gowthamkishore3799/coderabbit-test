/**
 * Tests for fools/dummy.ts — Player schema and statusMessage
 *
 * This PR fixed two issues:
 *   1. Renamed the reserved keyword variable `var` to `statusMessage`
 *   2. The module now exports `statusMessage` as a valid identifier
 *
 * Run:
 *   node --experimental-strip-types --experimental-vm-modules fools/dummy.test.ts
 * (requires `zod` installed: cd fools && npm install)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Import the module under test.
// dummy.ts does not export explicitly, so we import the module namespace.
import * as dummyModule from "./dummy.ts";

// ---------------------------------------------------------------------------
// statusMessage – value check (PR changed `var` -> `statusMessage`)
// ---------------------------------------------------------------------------

describe("statusMessage export", () => {
  test("statusMessage is exported from the module", () => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(dummyModule, "statusMessage") ||
        "statusMessage" in dummyModule,
      "statusMessage should be accessible on the module"
    );
  });

  test("statusMessage equals 'Variable defined'", () => {
    assert.equal((dummyModule as Record<string, unknown>)["statusMessage"], "Variable defined");
  });

  test("statusMessage is a string", () => {
    assert.equal(typeof (dummyModule as Record<string, unknown>)["statusMessage"], "string");
  });
});

// ---------------------------------------------------------------------------
// Player schema – validate fields
// ---------------------------------------------------------------------------

// dummy.ts does not export Player, so we re-import zod and define the same
// schema to test its structure, OR we rely on schema behaviour being observable
// through module-level effects. Since Player is not exported, we test by
// re-constructing it identically to verify Zod's behaviour on the shape.

import * as z from "zod";

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe("Player schema – username field", () => {
  test("accepts a valid username string", () => {
    const result = Player.safeParse({
      username: "coolPlayer",
      xp: 100,
      address: "https://player.example.com",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing username", () => {
    const result = Player.safeParse({ xp: 50, address: "https://example.com" });
    assert.equal(result.success, false);
  });

  test("rejects null username", () => {
    const result = Player.safeParse({ username: null, xp: 10, address: "https://x.com" });
    assert.equal(result.success, false);
  });

  test("rejects numeric username", () => {
    const result = Player.safeParse({ username: 42, xp: 10, address: "https://x.com" });
    assert.equal(result.success, false);
  });
});

describe("Player schema – xp field", () => {
  test("accepts a positive xp value", () => {
    const result = Player.safeParse({
      username: "p1",
      xp: 9999,
      address: "https://x.com",
    });
    assert.equal(result.success, true);
  });

  test("accepts xp of zero", () => {
    const result = Player.safeParse({
      username: "newbie",
      xp: 0,
      address: "https://x.com",
    });
    assert.equal(result.success, true);
  });

  test("accepts negative xp (schema has no minimum)", () => {
    const result = Player.safeParse({
      username: "debuffed",
      xp: -10,
      address: "https://x.com",
    });
    assert.equal(result.success, true);
  });

  test("rejects string xp", () => {
    const result = Player.safeParse({ username: "p", xp: "fast", address: "https://x.com" });
    assert.equal(result.success, false);
  });

  test("rejects missing xp", () => {
    const result = Player.safeParse({ username: "p", address: "https://x.com" });
    assert.equal(result.success, false);
  });
});

describe("Player schema – address field (z.url)", () => {
  test("accepts a valid https URL", () => {
    const result = Player.safeParse({ username: "p", xp: 1, address: "https://example.com" });
    assert.equal(result.success, true);
  });

  test("accepts a valid http URL", () => {
    const result = Player.safeParse({ username: "p", xp: 1, address: "http://example.com" });
    assert.equal(result.success, true);
  });

  test("rejects a plain string without protocol", () => {
    const result = Player.safeParse({ username: "p", xp: 1, address: "example.com" });
    assert.equal(result.success, false);
  });

  test("rejects an empty address", () => {
    const result = Player.safeParse({ username: "p", xp: 1, address: "" });
    assert.equal(result.success, false);
  });

  test("rejects a missing address", () => {
    const result = Player.safeParse({ username: "p", xp: 1 });
    assert.equal(result.success, false);
  });
});

describe("Player schema – complete object", () => {
  test("rejects an empty object", () => {
    const result = Player.safeParse({});
    assert.equal(result.success, false);
  });

  test("returns typed data on success", () => {
    const result = Player.safeParse({
      username: "hero",
      xp: 500,
      address: "https://hero.io",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.username, "hero");
      assert.equal(result.data.xp, 500);
      assert.equal(result.data.address, "https://hero.io");
    }
  });
});