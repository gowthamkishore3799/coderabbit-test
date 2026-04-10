// Tests for demo-usage.ts (new file added in this PR)
// Tests the demonstrateServices function which uses AnalyticsService
// and NotificationService from @coderabbit-test/shared-services

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { demonstrateServices } from "./demo-usage";

describe("demonstrateServices (demo-usage.ts)", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("executes without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("calls console.log at least once", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("logs the demonstration header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs analytics events section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Analytics Events ===");
  });

  it("logs notifications section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Notifications ===");
  });

  it("logs service recognition test complete message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "\n=== Service Recognition Test Complete ==="
    );
  });

  it("logs internal package success message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Internal package successfully referenced and used!"
    );
  });

  it("can be called multiple times without error", () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });

  it("logs exported analytics events as a string", () => {
    demonstrateServices();
    // exportEvents() returns JSON.stringify of events array
    const calls = consoleSpy.mock.calls;
    // Find the call after "=== Analytics Events ===" that logs the JSON
    const headerIndex = calls.findIndex(
      (c) => c[0] === "\n=== Analytics Events ==="
    );
    expect(headerIndex).toBeGreaterThanOrEqual(0);
    // The next call should be the exported JSON
    const exportedJson = calls[headerIndex + 1]?.[0];
    expect(typeof exportedJson).toBe("string");
    // The exported JSON should be valid JSON containing 2 events
    const parsed = JSON.parse(exportedJson);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it("tracks user_login event with correct properties", () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls;
    const headerIndex = calls.findIndex(
      (c) => c[0] === "\n=== Analytics Events ==="
    );
    const exportedJson = calls[headerIndex + 1]?.[0];
    const events = JSON.parse(exportedJson);
    const loginEvent = events.find((e: { eventName: string }) => e.eventName === "user_login");
    expect(loginEvent).toBeDefined();
    expect(loginEvent.userId).toBe("user123");
    expect(loginEvent.properties.browser).toBe("Chrome");
  });

  it("tracks page_view event with correct properties", () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls;
    const headerIndex = calls.findIndex(
      (c) => c[0] === "\n=== Analytics Events ==="
    );
    const exportedJson = calls[headerIndex + 1]?.[0];
    const events = JSON.parse(exportedJson);
    const pageViewEvent = events.find((e: { eventName: string }) => e.eventName === "page_view");
    expect(pageViewEvent).toBeDefined();
    expect(pageViewEvent.properties.page).toBe("/dashboard");
  });

  it("sends two notifications", () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls;
    // Notifications are logged as "[TYPE] title: message"
    const notifCalls = calls.filter(
      (c) => typeof c[0] === "string" && /^\[/.test(c[0])
    );
    expect(notifCalls).toHaveLength(2);
  });

  it("logs SUCCESS notification for Welcome message", () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls;
    const successLog = calls.find(
      (c) =>
        typeof c[0] === "string" &&
        c[0].includes("[SUCCESS]") &&
        c[0].includes("Welcome!")
    );
    expect(successLog).toBeDefined();
  });

  it("logs INFO notification for New Feature message", () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls;
    const infoLog = calls.find(
      (c) =>
        typeof c[0] === "string" &&
        c[0].includes("[INFO]") &&
        c[0].includes("New Feature")
    );
    expect(infoLog).toBeDefined();
  });
});