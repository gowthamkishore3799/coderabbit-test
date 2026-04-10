import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock the shared-services module before importing demo-usage so that we
// can inspect the calls made by demonstrateServices().

const mockTrack = vi.fn();
const mockExportEvents = vi.fn().mockReturnValue("[]");
const mockGetEvents = vi.fn().mockReturnValue([]);
const mockSend = vi.fn().mockReturnValue("notification-id-1");
const mockGetAll = vi.fn().mockReturnValue([]);

vi.mock("@coderabbit-test/shared-services", () => {
  class AnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
    getEvents = mockGetEvents;
  }
  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }
  const NotificationType = {
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
  };
  return { AnalyticsService, NotificationService, NotificationType };
});

const { demonstrateServices } = await import("./demo-usage");

describe("demonstrateServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue("[]");
    mockGetAll.mockReturnValue([
      {
        id: "abc123",
        type: "success",
        title: "Welcome!",
        message: "You have successfully logged in.",
        timestamp: new Date(),
        read: false,
      },
      {
        id: "def456",
        type: "info",
        title: "New Feature",
        message: "Check out our new analytics dashboard!",
        timestamp: new Date(),
        read: false,
      },
    ]);
  });

  it("runs without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("tracks two analytics events", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks a user_login event first", () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe("user_login");
    expect(firstCall.userId).toBe("user123");
    expect(firstCall.properties).toMatchObject({ browser: "Chrome" });
  });

  it("tracks a page_view event second", () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
    expect(secondCall.userId).toBe("user123");
    expect(secondCall.properties).toMatchObject({ page: "/dashboard" });
  });

  it("sends two notifications", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with correct title and message", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      "success",
      "Welcome!",
      "You have successfully logged in."
    );
  });

  it("sends an INFO notification with correct title and message", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      "info",
      "New Feature",
      "Check out our new analytics dashboard!"
    );
  });

  it("calls exportEvents to export analytics data", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls getAll to retrieve all notifications", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("each tracked event has a timestamp that is a Date", () => {
    demonstrateServices();
    for (const call of mockTrack.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it("page_view event includes correct referrer property", () => {
    demonstrateServices();
    const pageViewEvent = mockTrack.mock.calls[1][0];
    expect(pageViewEvent.properties?.referrer).toBe("/login");
  });

  it("does not crash when getAll returns an empty list", () => {
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("user_login event includes browser version property", () => {
    demonstrateServices();
    const loginEvent = mockTrack.mock.calls[0][0];
    expect(loginEvent.properties?.version).toBe("120.0.0");
  });
});