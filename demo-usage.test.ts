/**
 * Tests for demo-usage.ts — demonstrateServices()
 *
 * Run with:
 *   npx tsx --test demo-usage.test.ts
 */

import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// demonstrateServices() — behavioural tests
// We import the function after capturing the module-level side-effects.
// ---------------------------------------------------------------------------

describe("demonstrateServices()", () => {
  let consoleLogSpy: ReturnType<typeof mock.method>;

  beforeEach(() => {
    // Suppress console.log noise during tests and capture calls
    consoleLogSpy = mock.method(console, "log", () => {});
  });

  afterEach(() => {
    consoleLogSpy.mock.restore();
  });

  it("executes without throwing", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");
    assert.doesNotThrow(() => demonstrateServices());
  });

  it("logs the header banner", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");

    demonstrateServices();

    const loggedMessages = consoleLogSpy.mock.calls.map((c) =>
      String(c.arguments[0])
    );
    const hasHeader = loggedMessages.some((m) =>
      m.includes("Demonstrating Internal Package Services")
    );
    assert.equal(hasHeader, true, "Header banner should be logged");
  });

  it("logs the analytics events section header", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");

    demonstrateServices();

    const loggedMessages = consoleLogSpy.mock.calls.map((c) =>
      String(c.arguments[0])
    );
    const hasAnalyticsHeader = loggedMessages.some((m) =>
      m.includes("Analytics Events")
    );
    assert.equal(hasAnalyticsHeader, true, "'Analytics Events' section should be logged");
  });

  it("logs the notifications section header", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");

    demonstrateServices();

    const loggedMessages = consoleLogSpy.mock.calls.map((c) =>
      String(c.arguments[0])
    );
    const hasNotifHeader = loggedMessages.some((m) =>
      m.includes("Notifications")
    );
    assert.equal(hasNotifHeader, true, "'Notifications' section should be logged");
  });

  it("logs the completion message", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");

    demonstrateServices();

    const loggedMessages = consoleLogSpy.mock.calls.map((c) =>
      String(c.arguments[0])
    );
    const hasCompletion = loggedMessages.some((m) =>
      m.includes("Service Recognition Test Complete")
    );
    assert.equal(hasCompletion, true, "Completion message should be logged");
  });

  it("can be called multiple times without throwing", async () => {
    const { demonstrateServices } = await import("./demo-usage.js");

    assert.doesNotThrow(() => {
      demonstrateServices();
      demonstrateServices();
    });
  });

  it("is exported as a named export", async () => {
    const module = await import("./demo-usage.js");
    assert.equal(typeof module.demonstrateServices, "function");
  });
});