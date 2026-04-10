// Tests for demo-usage.ts (new file added in this PR)
// demonstrateServices() creates AnalyticsService + NotificationService instances at module scope,
// tracks events, sends notifications, then logs results.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Use vi.hoisted() so variables are available inside the hoisted vi.mock() factory
// ---------------------------------------------------------------------------
const {
  mockTrack,
  mockExportEvents,
  mockGetEvents,
  mockGetEventsByUser,
  mockClearEvents,
  mockSend,
  mockGetAll,
  mockGetUnread,
  mockMarkAsRead,
  mockMarkAllAsRead,
  mockSubscribe,
  mockClear,
} = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn(() => JSON.stringify([{ eventName: "user_login" }], null, 2)),
  mockGetEvents: vi.fn(() => []),
  mockGetEventsByUser: vi.fn(() => []),
  mockClearEvents: vi.fn(),
  mockSend: vi.fn(() => "mock-notification-id"),
  mockGetAll: vi.fn(() => [
    { id: "1", type: "success", title: "Welcome!", message: "You have successfully logged in.", read: false, timestamp: new Date() },
    { id: "2", type: "info", title: "New Feature", message: "Check out our new analytics dashboard!", read: false, timestamp: new Date() },
  ]),
  mockGetUnread: vi.fn(() => []),
  mockMarkAsRead: vi.fn(() => true),
  mockMarkAllAsRead: vi.fn(),
  mockSubscribe: vi.fn(() => () => {}),
  mockClear: vi.fn(),
}));

vi.mock("@coderabbit-test/shared-services", () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    track: mockTrack,
    getEvents: mockGetEvents,
    getEventsByUser: mockGetEventsByUser,
    clearEvents: mockClearEvents,
    exportEvents: mockExportEvents,
  })),
  NotificationService: vi.fn().mockImplementation(() => ({
    send: mockSend,
    getAll: mockGetAll,
    getUnread: mockGetUnread,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    subscribe: mockSubscribe,
    clear: mockClear,
  })),
  NotificationType: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  },
}));

// Import after mocking (top-level await works in Vitest ESM mode)
const { demonstrateServices } = await import("./demo-usage");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("demonstrateServices", () => {
  beforeEach(() => {
    // Reset call counts but restore return values (clearAllMocks removes implementations)
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue(JSON.stringify([{ eventName: "user_login" }], null, 2));
    mockSend.mockReturnValue("mock-notification-id");
    mockGetAll.mockReturnValue([
      { id: "1", type: "success", title: "Welcome!", message: "You have successfully logged in.", read: false, timestamp: new Date() },
      { id: "2", type: "info", title: "New Feature", message: "Check out our new analytics dashboard!", read: false, timestamp: new Date() },
    ]);
    mockMarkAsRead.mockReturnValue(true);
    mockSubscribe.mockReturnValue(() => {});
  });

  it("is a function", () => {
    expect(typeof demonstrateServices).toBe("function");
  });

  it("calls analytics.track twice", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks a user_login event", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "user_login", userId: "user123" })
    );
  });

  it("tracks a page_view event", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "page_view", userId: "user123" })
    );
  });

  it("calls notifications.send twice", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with title 'Welcome!'", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith("success", "Welcome!", "You have successfully logged in.");
  });

  it("sends an INFO notification with title 'New Feature'", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith("info", "New Feature", "Check out our new analytics dashboard!");
  });

  it("calls analytics.exportEvents once", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls notifications.getAll once", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("logs to console (does not throw)", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => demonstrateServices()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns undefined (void)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it("passes a timestamp (Date) as part of the user_login event", () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    const loginCall = calls.find(([arg]) => arg.eventName === "user_login");
    expect(loginCall).toBeDefined();
    expect(loginCall![0].timestamp).toBeInstanceOf(Date);
  });

  it("passes correct browser properties for user_login event", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ browser: "Chrome" }),
      })
    );
  });

  it("passes correct page properties for page_view event", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ page: "/dashboard" }),
      })
    );
  });
});