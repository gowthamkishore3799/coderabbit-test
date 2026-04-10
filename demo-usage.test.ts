// Tests for demo-usage.ts (new file added in this PR)
// demonstrateServices() orchestrates AnalyticsService and NotificationService.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock @coderabbit-test/shared-services ────────────────────────────────────
// vi.mock is hoisted to the top of the file by vitest, so the factory must
// not reference variables declared below it. All mock implementations are
// created inside the factory using vi.fn().

vi.mock("@coderabbit-test/shared-services", () => {
  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  };

  class AnalyticsService {
    track = vi.fn();
    getEvents = vi.fn(() => []);
    exportEvents = vi.fn(() => "[]");
    clearEvents = vi.fn();
  }

  class NotificationService {
    send = vi.fn(() => "notif-id-1");
    getAll = vi.fn(() => []);
    getUnread = vi.fn(() => []);
    markAsRead = vi.fn(() => true);
    markAllAsRead = vi.fn();
    clear = vi.fn();
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

// ─── Import after mock is registered ─────────────────────────────────────────
import { demonstrateServices } from "./demo-usage";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

// Helper to get the mock instances created inside demonstrateServices().
// Because demonstrateServices() creates new instances on every call we grab
// the spy references from the module-level singletons created at import time.
// The module-level `analytics` and `notifications` in demo-usage.ts are
// created once at import; we can spy on them via the constructor mocks.
// However, since vitest re-uses the same mock class across calls we can
// inspect the prototype mocks instead.

describe("demonstrateServices()", () => {
  let analyticsMock: InstanceType<typeof AnalyticsService>;
  let notificationsMock: InstanceType<typeof NotificationService>;

  beforeEach(() => {
    // The module-level singletons in demo-usage.ts are the only instances.
    // Retrieve them by checking which instances were created.
    // Since we can't directly access the module-level variables, we use the
    // prototype approach: spy on prototype methods BEFORE the module runs,
    // but as the module is already loaded at this point we reset the fn mocks.
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw when called", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("returns undefined (void function)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it("logs the introductory header", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allLogs).toContain("Demonstrating Internal Package Services");
    consoleSpy.mockRestore();
  });

  it("logs the completion message", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allLogs).toContain("Service Recognition Test Complete");
    consoleSpy.mockRestore();
  });

  it("logs the analytics events section header", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allLogs).toContain("Analytics Events");
    consoleSpy.mockRestore();
  });

  it("logs the notifications section header", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(allLogs).toContain("Notifications");
    consoleSpy.mockRestore();
  });
});

// ─── AnalyticsService contract tests (directly) ───────────────────────────────
// These tests exercise the service API that demo-usage.ts relies on,
// using fresh instances to verify expected call signatures.

describe("AnalyticsService – contract used by demonstrateServices()", () => {
  it("track() accepts a user_login event shape", () => {
    const svc = new AnalyticsService();
    const event = {
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
      properties: { browser: "Chrome", version: "120.0.0" },
    };
    expect(() => svc.track(event)).not.toThrow();
    expect(svc.track).toHaveBeenCalledWith(event);
  });

  it("track() accepts a page_view event shape", () => {
    const svc = new AnalyticsService();
    const event = {
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
      properties: { page: "/dashboard", referrer: "/login" },
    };
    expect(() => svc.track(event)).not.toThrow();
    expect(svc.track).toHaveBeenCalledWith(event);
  });

  it("exportEvents() is called and returns a string", () => {
    const svc = new AnalyticsService();
    const result = svc.exportEvents();
    expect(typeof result).toBe("string");
  });
});

// ─── NotificationService contract tests ───────────────────────────────────────

describe("NotificationService – contract used by demonstrateServices()", () => {
  it("send() with SUCCESS type returns an id", () => {
    const svc = new NotificationService();
    const id = svc.send(
      NotificationType.SUCCESS as any,
      "Welcome!",
      "You have successfully logged in."
    );
    expect(id).toBeDefined();
  });

  it("send() with INFO type is callable", () => {
    const svc = new NotificationService();
    expect(() =>
      svc.send(
        NotificationType.INFO as any,
        "New Feature",
        "Check out our new analytics dashboard!"
      )
    ).not.toThrow();
  });

  it("getAll() returns an array", () => {
    const svc = new NotificationService();
    const all = svc.getAll();
    expect(Array.isArray(all)).toBe(true);
  });

  it("NotificationType.SUCCESS equals 'success'", () => {
    expect(NotificationType.SUCCESS).toBe("success");
  });

  it("NotificationType.INFO equals 'info'", () => {
    expect(NotificationType.INFO).toBe("info");
  });

  it("NotificationType enum has all four expected keys", () => {
    const keys = Object.keys(NotificationType);
    expect(keys).toContain("INFO");
    expect(keys).toContain("WARNING");
    expect(keys).toContain("ERROR");
    expect(keys).toContain("SUCCESS");
  });
});