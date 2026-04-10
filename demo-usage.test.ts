import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the internal shared-services package before importing demo-usage.ts
const mockTrack = vi.fn();
const mockSend = vi.fn().mockReturnValue("mock-notification-id");
const mockExportEvents = vi.fn().mockReturnValue("[]");
const mockGetAll = vi.fn().mockReturnValue([]);

vi.mock("@coderabbit-test/shared-services", () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    track: mockTrack,
    exportEvents: mockExportEvents,
    getEvents: vi.fn().mockReturnValue([]),
    clearEvents: vi.fn(),
  })),
  NotificationService: vi.fn().mockImplementation(() => ({
    send: mockSend,
    getAll: mockGetAll,
    getUnread: vi.fn().mockReturnValue([]),
    markAsRead: vi.fn().mockReturnValue(true),
    markAllAsRead: vi.fn(),
    subscribe: vi.fn(),
    clear: vi.fn(),
  })),
  NotificationType: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  },
}));

import { demonstrateServices } from "./demo-usage";

describe("demonstrateServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default return values after clearAllMocks
    mockSend.mockReturnValue("mock-notification-id");
    mockExportEvents.mockReturnValue("[]");
    mockGetAll.mockReturnValue([]);
  });

  it("is a function", () => {
    expect(typeof demonstrateServices).toBe("function");
  });

  it("calls analytics.track exactly twice", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks user_login event first", () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe("user_login");
    expect(firstCall.userId).toBe("user123");
  });

  it("tracks page_view event second", () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
    expect(secondCall.userId).toBe("user123");
  });

  it("tracked user_login event has browser property", () => {
    demonstrateServices();
    const event = mockTrack.mock.calls[0][0];
    expect(event.properties).toMatchObject({ browser: "Chrome" });
  });

  it("tracked page_view event has page property", () => {
    demonstrateServices();
    const event = mockTrack.mock.calls[1][0];
    expect(event.properties).toMatchObject({ page: "/dashboard" });
  });

  it("tracked events have a timestamp that is a Date", () => {
    demonstrateServices();
    for (const call of mockTrack.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it("calls notifications.send exactly twice", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with 'Welcome!' title", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith("success", "Welcome!", expect.any(String));
  });

  it("sends an INFO notification with 'New Feature' title", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith("info", "New Feature", expect.any(String));
  });

  it("calls analytics.exportEvents once", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls notifications.getAll once", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("returns undefined (void function)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it("logs service demonstration header to console", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const allLogs = consoleSpy.mock.calls.map((c) => c[0]);
    expect(allLogs.some((msg) => typeof msg === "string" && msg.includes("Demonstrating Internal Package Services"))).toBe(true);
    consoleSpy.mockRestore();
  });

  it("iterates over all notifications returned by getAll", () => {
    const fakeNotifications = [
      { id: "1", type: "success", title: "Done", message: "All good" },
      { id: "2", type: "info", title: "Note", message: "FYI" },
    ];
    mockGetAll.mockReturnValue(fakeNotifications);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();

    const allLogs = consoleSpy.mock.calls.flat();
    expect(allLogs.some((msg) => typeof msg === "string" && msg.includes("SUCCESS") || msg.includes("DONE"))).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it("can be called multiple times without error", () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
    expect(mockTrack).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});