import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { demonstrateServices } from "./demo-usage";

// The AnalyticsService and NotificationService are used inside demonstrateServices().
// We spy on console.log to verify output without importing the internal package separately.

describe("demo-usage.ts – demonstrateServices()", () => {
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

  it("logs the opening banner", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs the analytics events section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Analytics Events ===");
  });

  it("logs the notifications section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Notifications ===");
  });

  it("logs the completion banner", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Service Recognition Test Complete ===");
  });

  it("logs the internal package confirmation message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Internal package successfully referenced and used!"
    );
  });

  it("calls console.log multiple times during execution", () => {
    demonstrateServices();
    // At minimum: banner, analytics header, JSON export, notifications header,
    // 2 notification lines, completion header, confirmation = 8+ calls
    expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(8);
  });

  it("logs notification entries in [TYPE] Title: message format", () => {
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0]));
    // At least one notification log matching the expected format
    const notificationLogs = allLogs.filter((l) => /^\[.+\] .+: .+$/.test(l));
    expect(notificationLogs.length).toBeGreaterThanOrEqual(2);
  });

  it("logs a SUCCESS notification for 'Welcome!'", () => {
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0]));
    const welcomeLog = allLogs.find((l) => l.includes("[SUCCESS]") && l.includes("Welcome!"));
    expect(welcomeLog).toBeDefined();
  });

  it("logs an INFO notification for 'New Feature'", () => {
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0]));
    const featureLog = allLogs.find((l) => l.includes("[INFO]") && l.includes("New Feature"));
    expect(featureLog).toBeDefined();
  });

  it("exports a JSON string for analytics events", () => {
    demonstrateServices();
    // The second argument to console.log for analytics events is the exportEvents() string (JSON)
    const allLogs = consoleSpy.mock.calls.map((c) => c[0]);
    const jsonLog = allLogs.find((l) => {
      if (typeof l !== "string") return false;
      try {
        const parsed = JSON.parse(l);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    });
    expect(jsonLog).toBeDefined();
  });

  it("exports analytics JSON containing both tracked events", () => {
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => c[0]);
    const jsonLog = allLogs.find((l) => {
      if (typeof l !== "string") return false;
      try {
        const parsed = JSON.parse(l);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }) as string | undefined;

    expect(jsonLog).toBeDefined();
    const events = JSON.parse(jsonLog!);
    expect(events.length).toBe(2);

    const eventNames = events.map((e: { eventName: string }) => e.eventName);
    expect(eventNames).toContain("user_login");
    expect(eventNames).toContain("page_view");
  });

  it("all tracked events belong to userId 'user123'", () => {
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => c[0]);
    const jsonLog = allLogs.find((l) => {
      if (typeof l !== "string") return false;
      try {
        const parsed = JSON.parse(l);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }) as string | undefined;

    const events = JSON.parse(jsonLog!);
    for (const event of events) {
      expect(event.userId).toBe("user123");
    }
  });

  it("is idempotent – calling twice produces consistent output", () => {
    // Each call should produce the same number of console.log calls
    demonstrateServices();
    const firstCallCount = consoleSpy.mock.calls.length;
    consoleSpy.mockClear();
    demonstrateServices();
    const secondCallCount = consoleSpy.mock.calls.length;
    expect(firstCallCount).toBe(secondCallCount);
  });
});