/**
 * Tests for the demonstrateServices() function exported from demo-usage.ts.
 *
 * @coderabbit-test/shared-services is mocked here so these tests are
 * completely isolated from service-layer internals (and from the pre-existing
 * Zod v3/v4 incompatibility in AnalyticsEventSchema).
 *
 * vi.hoisted() is used so the mock spy references are available inside the
 * vi.mock() factory which is hoisted before module imports by vitest.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoist mock functions so they are available in the vi.mock() factory.
// ---------------------------------------------------------------------------
const { mockTrack, mockExportEvents, mockSend, mockGetAll } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn().mockReturnValue("[]"),
  mockSend: vi.fn().mockReturnValue("notif-id-1"),
  mockGetAll: vi.fn().mockReturnValue([]),
}));

vi.mock("@coderabbit-test/shared-services", () => {
  // Use regular function (not arrow) so `new AnalyticsService()` works.
  function AnalyticsService(this: any) {
    this.track = mockTrack;
    this.exportEvents = mockExportEvents;
  }
  function NotificationService(this: any) {
    this.send = mockSend;
    this.getAll = mockGetAll;
  }
  const NotificationType = {
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
  };
  return { AnalyticsService, NotificationService, NotificationType };
});

import { demonstrateServices } from "./demo-usage";

describe("demonstrateServices", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockTrack.mockReset();
    mockExportEvents.mockReset().mockReturnValue("[]");
    mockSend.mockReset().mockReturnValue("notif-id-1");
    mockGetAll.mockReset().mockReturnValue([]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("runs to completion without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs the opening banner", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Demonstrating Internal Package Services")
    );
  });

  it("logs the analytics events section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Analytics Events")
    );
  });

  it("logs the notifications section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Notifications")
    );
  });

  it("logs the completion message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Service Recognition Test Complete")
    );
  });

  it("logs the 'Internal package successfully referenced' confirmation", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Internal package successfully referenced")
    );
  });

  it("calls analytics.track() exactly twice (user_login and page_view)", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks user_login event first", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventName: "user_login", userId: "user123" })
    );
  });

  it("tracks page_view event second", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventName: "page_view", userId: "user123" })
    );
  });

  it("user_login event carries browser properties", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        properties: expect.objectContaining({ browser: "Chrome" }),
      })
    );
  });

  it("page_view event carries page and referrer properties", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        properties: expect.objectContaining({ page: "/dashboard", referrer: "/login" }),
      })
    );
  });

  it("calls notifications.send() exactly twice", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with 'Welcome!' first", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenNthCalledWith(1, "success", "Welcome!", expect.any(String));
  });

  it("sends an INFO notification with 'New Feature' second", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenNthCalledWith(2, "info", "New Feature", expect.any(String));
  });

  it("calls analytics.exportEvents() to produce the events log output", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledOnce();
  });

  it("logs exportEvents() output to console", () => {
    mockExportEvents.mockReturnValue('["event-data"]');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('["event-data"]');
  });

  it("calls notifications.getAll() to retrieve notifications for printing", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledOnce();
  });

  it("iterates over getAll() results and logs each notification", () => {
    mockGetAll.mockReturnValue([
      { type: "success", title: "Hello",  message: "World"  },
      { type: "info",    title: "Info",   message: "Detail" },
    ]);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("[SUCCESS] Hello: World");
    expect(consoleSpy).toHaveBeenCalledWith("[INFO] Info: Detail");
  });

  it("can be called multiple times without error", () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });

  it("each call tracks exactly 2 analytics events (accumulates across calls)", () => {
    demonstrateServices();
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(4);
  });
});