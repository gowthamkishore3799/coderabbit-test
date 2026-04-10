import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the shared-services package before importing demo-usage
vi.mock("@coderabbit-test/shared-services", () => {
  const mockEvents: unknown[] = [];
  const mockNotifications: unknown[] = [];

  const AnalyticsService = vi.fn().mockImplementation(() => ({
    track: vi.fn((event: unknown) => {
      mockEvents.push(event);
    }),
    getEvents: vi.fn(() => [...mockEvents]),
    exportEvents: vi.fn(() => JSON.stringify(mockEvents, null, 2)),
    clearEvents: vi.fn(() => { mockEvents.length = 0; }),
  }));

  const NotificationService = vi.fn().mockImplementation(() => {
    let idCounter = 0;
    return {
      send: vi.fn((type: string, title: string, message: string) => {
        const id = `notif-${++idCounter}`;
        mockNotifications.push({ id, type, title, message, read: false, timestamp: new Date() });
        return id;
      }),
      getAll: vi.fn(() => [...mockNotifications]),
      getUnread: vi.fn(() => mockNotifications.filter((n: unknown) => !(n as { read: boolean }).read)),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      clear: vi.fn(() => { mockNotifications.length = 0; }),
    };
  });

  return {
    AnalyticsService,
    NotificationService,
    NotificationType: {
      INFO: "info",
      WARNING: "warning",
      ERROR: "error",
      SUCCESS: "success",
    },
  };
});

import { demonstrateServices } from "./demo-usage";
import { AnalyticsService, NotificationService } from "@coderabbit-test/shared-services";

describe("demonstrateServices (demo-usage.ts)", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("executes without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("creates AnalyticsService instance", () => {
    demonstrateServices();
    expect(AnalyticsService).toHaveBeenCalled();
  });

  it("creates NotificationService instance", () => {
    demonstrateServices();
    expect(NotificationService).toHaveBeenCalled();
  });

  it("tracks exactly two analytics events", () => {
    const mockInstance = new (AnalyticsService as ReturnType<typeof vi.fn>)();
    const trackSpy = mockInstance.track;
    vi.mocked(AnalyticsService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(trackSpy).toHaveBeenCalledTimes(2);
  });

  it("tracks user_login event with correct shape", () => {
    const mockInstance = new (AnalyticsService as ReturnType<typeof vi.fn>)();
    const trackSpy = mockInstance.track;
    vi.mocked(AnalyticsService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    const firstCall = trackSpy.mock.calls[0][0];
    expect(firstCall.eventName).toBe("user_login");
    expect(firstCall.userId).toBe("user123");
    expect(firstCall.timestamp).toBeInstanceOf(Date);
    expect(firstCall.properties).toMatchObject({ browser: "Chrome", version: "120.0.0" });
  });

  it("tracks page_view event with correct shape", () => {
    const mockInstance = new (AnalyticsService as ReturnType<typeof vi.fn>)();
    const trackSpy = mockInstance.track;
    vi.mocked(AnalyticsService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    const secondCall = trackSpy.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
    expect(secondCall.userId).toBe("user123");
    expect(secondCall.properties).toMatchObject({ page: "/dashboard", referrer: "/login" });
  });

  it("sends exactly two notifications", () => {
    const mockInstance = new (NotificationService as ReturnType<typeof vi.fn>)();
    const sendSpy = mockInstance.send;
    vi.mocked(NotificationService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it("sends SUCCESS notification with Welcome message", () => {
    const mockInstance = new (NotificationService as ReturnType<typeof vi.fn>)();
    const sendSpy = mockInstance.send;
    vi.mocked(NotificationService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(sendSpy).toHaveBeenCalledWith(
      "success",
      "Welcome!",
      "You have successfully logged in."
    );
  });

  it("sends INFO notification for new feature", () => {
    const mockInstance = new (NotificationService as ReturnType<typeof vi.fn>)();
    const sendSpy = mockInstance.send;
    vi.mocked(NotificationService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(sendSpy).toHaveBeenCalledWith(
      "info",
      "New Feature",
      "Check out our new analytics dashboard!"
    );
  });

  it("calls exportEvents on analytics service", () => {
    const mockInstance = new (AnalyticsService as ReturnType<typeof vi.fn>)();
    const exportSpy = mockInstance.exportEvents;
    vi.mocked(AnalyticsService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(exportSpy).toHaveBeenCalledTimes(1);
  });

  it("calls getAll on notification service", () => {
    const mockInstance = new (NotificationService as ReturnType<typeof vi.fn>)();
    const getAllSpy = mockInstance.getAll;
    vi.mocked(NotificationService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    expect(getAllSpy).toHaveBeenCalledTimes(1);
  });

  it("logs section headers to console", () => {
    demonstrateServices();

    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain("=== Demonstrating Internal Package Services ===\n");
    expect(calls).toContain("\n=== Analytics Events ===");
    expect(calls).toContain("\n=== Notifications ===");
    expect(calls).toContain("\n=== Service Recognition Test Complete ===");
  });

  it("logs notification details for each notification returned by getAll", () => {
    const mockNotifications = [
      { id: "1", type: "success", title: "Welcome!", message: "Logged in.", read: false, timestamp: new Date() },
      { id: "2", type: "info", title: "New Feature", message: "Check dashboard!", read: false, timestamp: new Date() },
    ];
    const mockInstance = new (NotificationService as ReturnType<typeof vi.fn>)();
    mockInstance.getAll.mockReturnValueOnce(mockNotifications);
    vi.mocked(NotificationService).mockImplementationOnce(() => mockInstance);

    demonstrateServices();

    const loggedMessages = consoleSpy.mock.calls.map((c) => c[0]);
    expect(loggedMessages).toContain("[SUCCESS] Welcome!: Logged in.");
    expect(loggedMessages).toContain("[INFO] New Feature: Check dashboard!");
  });
});