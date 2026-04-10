import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so these mock functions are available inside the vi.mock factory
// (vi.mock factories are hoisted to the top, before module-level const declarations)
const { mockTrack, mockExportEvents, mockSend, mockGetAll } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn(() => JSON.stringify([])),
  mockSend: vi.fn((_type: string, _title: string, _message: string) => "mock-id"),
  mockGetAll: vi.fn(() => [] as any[]),
}));

vi.mock("@coderabbit-test/shared-services", () => {
  return {
    AnalyticsService: function AnalyticsService() {
      return {
        track: mockTrack,
        exportEvents: mockExportEvents,
        getEvents: vi.fn(() => []),
        getEventsByUser: vi.fn(() => []),
        clearEvents: vi.fn(),
      };
    },
    NotificationService: function NotificationService() {
      return {
        send: mockSend,
        getAll: mockGetAll,
        getUnread: vi.fn(() => []),
        markAsRead: vi.fn(() => true),
        markAllAsRead: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        clear: vi.fn(),
      };
    },
    NotificationType: {
      INFO: "info",
      WARNING: "warning",
      ERROR: "error",
      SUCCESS: "success",
    },
  };
});

// Import after mock setup
const { demonstrateServices } = await import("./demo-usage");

describe("demonstrateServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue(JSON.stringify([]));
    mockGetAll.mockReturnValue([]);
    mockSend.mockReturnValue("mock-id");
  });

  it("tracks exactly two analytics events", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks a user_login event with correct eventName", () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    const loginCall = calls.find((c: any[]) => c[0]?.eventName === "user_login");
    expect(loginCall).toBeDefined();
  });

  it("tracks a page_view event with correct eventName", () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    const pageViewCall = calls.find((c: any[]) => c[0]?.eventName === "page_view");
    expect(pageViewCall).toBeDefined();
  });

  it("tracks user_login with userId 'user123'", () => {
    demonstrateServices();
    const loginCall = mockTrack.mock.calls.find((c: any[]) => c[0]?.eventName === "user_login");
    expect(loginCall?.[0].userId).toBe("user123");
  });

  it("tracks user_login with browser property 'Chrome'", () => {
    demonstrateServices();
    const loginCall = mockTrack.mock.calls.find((c: any[]) => c[0]?.eventName === "user_login");
    expect(loginCall?.[0].properties?.browser).toBe("Chrome");
  });

  it("tracks page_view with page property '/dashboard'", () => {
    demonstrateServices();
    const pageViewCall = mockTrack.mock.calls.find((c: any[]) => c[0]?.eventName === "page_view");
    expect(pageViewCall?.[0].properties?.page).toBe("/dashboard");
  });

  it("tracks page_view with referrer '/login'", () => {
    demonstrateServices();
    const pageViewCall = mockTrack.mock.calls.find((c: any[]) => c[0]?.eventName === "page_view");
    expect(pageViewCall?.[0].properties?.referrer).toBe("/login");
  });

  it("sends exactly two notifications", () => {
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

  it("calls exportEvents to log analytics output", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls getAll to retrieve all notifications", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("does not throw", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => demonstrateServices()).not.toThrow();
    spy.mockRestore();
  });

  it("logs expected section headers to console", () => {
    const logged: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logged.push(args.join(" "));
    });

    demonstrateServices();
    spy.mockRestore();

    expect(logged.some((l) => l.includes("Demonstrating Internal Package Services"))).toBe(true);
    expect(logged.some((l) => l.includes("Analytics Events"))).toBe(true);
    expect(logged.some((l) => l.includes("Notifications"))).toBe(true);
    expect(logged.some((l) => l.includes("Service Recognition Test Complete"))).toBe(true);
  });

  it("logs notification details for each returned notification", () => {
    const fakeNotifications = [
      { type: "success", title: "Welcome!", message: "You are in." },
      { type: "info", title: "New Feature", message: "Check this out." },
    ];
    mockGetAll.mockReturnValue(fakeNotifications);

    const logged: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logged.push(args.join(" "));
    });

    demonstrateServices();
    spy.mockRestore();

    expect(logged.some((l) => l.includes("[SUCCESS]") && l.includes("Welcome!"))).toBe(true);
    expect(logged.some((l) => l.includes("[INFO]") && l.includes("New Feature"))).toBe(true);
  });

  it("tracks events with a timestamp that is a Date instance", () => {
    demonstrateServices();
    const allCalls = mockTrack.mock.calls;
    allCalls.forEach((call: any[]) => {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    });
  });

  it("track calls are made before send calls (analytics before notifications)", () => {
    const callOrder: string[] = [];
    mockTrack.mockImplementation(() => callOrder.push("track"));
    mockSend.mockImplementation(() => { callOrder.push("send"); return "id"; });

    demonstrateServices();

    const firstSendIdx = callOrder.indexOf("send");
    const lastTrackIdx = callOrder.lastIndexOf("track");
    expect(lastTrackIdx).toBeLessThan(firstSendIdx);
  });
});