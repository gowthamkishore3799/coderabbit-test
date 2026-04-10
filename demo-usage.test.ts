/**
 * Tests for demo-usage.ts – demonstrateServices()
 *
 * Run: node --experimental-strip-types --test demo-usage.test.ts
 * (requires dependencies installed: npm install)
 */
import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Helpers to capture console output during tests
// ---------------------------------------------------------------------------

function captureConsole(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  return {
    lines,
    restore: () => {
      console.log = original;
    },
  };
}

// ---------------------------------------------------------------------------
// Import the function under test
// ---------------------------------------------------------------------------

// Dynamic import so that module-level singletons are created once per process.
// We re-import with a cache-busting query only if the test runner supports it.
import { demonstrateServices } from "./demo-usage.ts";

// ---------------------------------------------------------------------------
// demonstrateServices()
// ---------------------------------------------------------------------------

describe("demonstrateServices()", () => {
  it("runs without throwing", () => {
    const { restore } = captureConsole();
    try {
      assert.doesNotThrow(() => demonstrateServices());
    } finally {
      restore();
    }
  });

  it("logs the header banner to console", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const banner = lines.find((l) => l.includes("Demonstrating Internal Package Services"));
    assert.ok(banner, "expected header banner line in console output");
  });

  it("logs the analytics events section header", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const analyticsHeader = lines.find((l) => l.includes("Analytics Events"));
    assert.ok(analyticsHeader, "expected '=== Analytics Events ===' in output");
  });

  it("logs the notifications section header", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const notificationsHeader = lines.find((l) => l.includes("Notifications"));
    assert.ok(notificationsHeader, "expected '=== Notifications ===' in output");
  });

  it("logs the completion message", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const completionLine = lines.find((l) => l.includes("Service Recognition Test Complete"));
    assert.ok(completionLine, "expected completion message in output");
  });

  it("logs exported events as JSON (analytics.exportEvents output)", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    // exportEvents() returns JSON.stringify(events, null, 2) — must be valid JSON
    // Find the line that looks like JSON (starts with '[')
    const jsonLine = lines.find((l) => l.trimStart().startsWith("["));
    assert.ok(jsonLine, "expected JSON array output from exportEvents()");
    assert.doesNotThrow(() => JSON.parse(jsonLine), "exported events should be valid JSON");
  });

  it("logs at least two notification lines (one per send call)", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    // Notification lines look like "[SUCCESS] Welcome!: ..." or "[INFO] New Feature: ..."
    const notifLines = lines.filter((l) => /\[(SUCCESS|INFO|WARNING|ERROR)\]/.test(l));
    assert.ok(notifLines.length >= 2, `expected at least 2 notification lines, got ${notifLines.length}`);
  });

  it("logs a SUCCESS notification for user login", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const successLine = lines.find((l) => l.includes("[SUCCESS]") && l.includes("Welcome!"));
    assert.ok(successLine, "expected a SUCCESS notification for 'Welcome!'");
  });

  it("logs an INFO notification for new feature", () => {
    const { lines, restore } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      restore();
    }
    const infoLine = lines.find((l) => l.includes("[INFO]") && l.includes("New Feature"));
    assert.ok(infoLine, "expected an INFO notification for 'New Feature'");
  });

  it("returns undefined (void function)", () => {
    const { restore } = captureConsole();
    let returnValue: unknown = "not-set";
    try {
      returnValue = demonstrateServices();
    } finally {
      restore();
    }
    assert.equal(returnValue, undefined);
  });

  it("can be called multiple times without throwing", () => {
    const { restore } = captureConsole();
    try {
      assert.doesNotThrow(() => {
        demonstrateServices();
        demonstrateServices();
      });
    } finally {
      restore();
    }
  });
});

// ---------------------------------------------------------------------------
// Module-level singleton state (regression: ensure each call appends events)
// ---------------------------------------------------------------------------

describe("demonstrateServices() – accumulated state across calls", () => {
  it("accumulates analytics events on repeated calls (module singleton behaviour)", () => {
    const { lines: firstCallLines, restore: r1 } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      r1();
    }

    const { lines: secondCallLines, restore: r2 } = captureConsole();
    try {
      demonstrateServices();
    } finally {
      r2();
    }

    // Both calls should produce JSON output from exportEvents()
    const firstJson = firstCallLines.find((l) => l.trimStart().startsWith("["));
    const secondJson = secondCallLines.find((l) => l.trimStart().startsWith("["));
    assert.ok(firstJson, "first call should produce JSON");
    assert.ok(secondJson, "second call should produce JSON");

    const firstEvents: unknown[] = JSON.parse(firstJson!);
    const secondEvents: unknown[] = JSON.parse(secondJson!);
    // Second call accumulates (singleton), so count should be greater
    assert.ok(
      secondEvents.length > firstEvents.length,
      `second call (${secondEvents.length} events) should have more events than first (${firstEvents.length} events)`
    );
  });
});