import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the shared-services package before importing demo-usage
vi.mock("@coderabbit-test/shared-services", () => {
  const trackedEvents: unknown[] = [];
  const sentNotifications: Array<{
    type: string;
    title: string;
    message: string;
    id: string;
    read: boolean;
    timestamp: Date;
  }> = [];

  const mockTrack = vi.fn((event: unknown) => {
    trackedEvents.push(event);
  });
  const mockExportEvents = vi.fn(() => JSON.stringify(trackedEvents, null, 2));
  const mockGetEvents = vi.fn(() => [...trackedEvents]);

  const mockSend = vi.fn((type: string, title: string, message: string) => {
    const id = `mock-id-${sentNotifications.length}`;
    sentNotifications.push({ type, title, message, id, read: false, timestamp: new Date() });
    return id;
  });
  const mockGetAll = vi.fn(() => [...sentNotifications]);

  class MockAnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
    getEvents = mockGetEvents;
  }

  class MockNotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }

  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  };

  return {
    AnalyticsService: MockAnalyticsService,
    NotificationService: MockNotificationService,
    NotificationType,
    __trackedEvents: trackedEvents,
    __sentNotifications: sentNotifications,
    __mockTrack: mockTrack,
    __mockSend: mockSend,
    __mockExportEvents: mockExportEvents,
    __mockGetAll: mockGetAll,
  };
});

import { demonstrateServices } from "./demo-usage";
import * as sharedServices from "@coderabbit-test/shared-services";

describe("demonstrateServices", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.clearAllMocks();
    // Reset the tracked arrays
    (sharedServices as Record<string, unknown[]>).__trackedEvents.length = 0;
    (sharedServices as Record<string, unknown[]>).__sentNotifications.length = 0;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("is exported as a function", () => {
    expect(typeof demonstrateServices).toBe("function");
  });

  it("calls analytics.track with a user_login event", () => {
    demonstrateServices();
    const mockTrack = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockTrack;
    const calls = mockTrack.mock.calls as Array<Array<{ eventName: string }>>;
    const loginCall = calls.find((c) => c[0]?.eventName === "user_login");
    expect(loginCall).toBeDefined();
  });

  it("calls analytics.track with a page_view event", () => {
    demonstrateServices();
    const mockTrack = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockTrack;
    const calls = mockTrack.mock.calls as Array<Array<{ eventName: string }>>;
    const pageViewCall = calls.find((c) => c[0]?.eventName === "page_view");
    expect(pageViewCall).toBeDefined();
  });

  it("tracks exactly two analytics events", () => {
    demonstrateServices();
    const mockTrack = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockTrack;
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("user_login event has correct userId and properties", () => {
    demonstrateServices();
    const mockTrack = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockTrack;
    const calls = mockTrack.mock.calls as Array<Array<{
      eventName: string;
      userId: string;
      properties: Record<string, string>;
    }>>;
    const loginCall = calls.find((c) => c[0]?.eventName === "user_login");
    expect(loginCall).toBeDefined();
    const event = loginCall![0];
    expect(event.userId).toBe("user123");
    expect(event.properties).toMatchObject({ browser: "Chrome", version: "120.0.0" });
  });

  it("page_view event has correct properties", () => {
    demonstrateServices();
    const mockTrack = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockTrack;
    const calls = mockTrack.mock.calls as Array<Array<{
      eventName: string;
      properties: Record<string, string>;
    }>>;
    const pageViewCall = calls.find((c) => c[0]?.eventName === "page_view");
    expect(pageViewCall).toBeDefined();
    expect(pageViewCall![0].properties).toMatchObject({ page: "/dashboard", referrer: "/login" });
  });

  it("calls notifications.send with a SUCCESS notification", () => {
    demonstrateServices();
    const mockSend = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockSend;
    const calls = mockSend.mock.calls as Array<[string, string, string]>;
    const successCall = calls.find((c) => c[0] === "success");
    expect(successCall).toBeDefined();
    expect(successCall![1]).toBe("Welcome!");
  });

  it("calls notifications.send with an INFO notification", () => {
    demonstrateServices();
    const mockSend = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockSend;
    const calls = mockSend.mock.calls as Array<[string, string, string]>;
    const infoCall = calls.find((c) => c[0] === "info");
    expect(infoCall).toBeDefined();
    expect(infoCall![1]).toBe("New Feature");
  });

  it("sends exactly two notifications", () => {
    demonstrateServices();
    const mockSend = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockSend;
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("calls analytics.exportEvents to export tracked events", () => {
    demonstrateServices();
    const mockExportEvents = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockExportEvents;
    expect(mockExportEvents).toHaveBeenCalled();
  });

  it("calls notifications.getAll to retrieve all notifications", () => {
    demonstrateServices();
    const mockGetAll = (sharedServices as Record<string, ReturnType<typeof vi.fn>>).__mockGetAll;
    expect(mockGetAll).toHaveBeenCalled();
  });

  it("logs output to the console", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("logs a header message indicating service demonstration", () => {
    demonstrateServices();
    const allMessages = consoleSpy.mock.calls.map((c) => String(c[0]));
    const hasHeader = allMessages.some((m) => m.includes("Demonstrating Internal Package Services"));
    expect(hasHeader).toBe(true);
  });

  it("logs analytics events section header", () => {
    demonstrateServices();
    const allMessages = consoleSpy.mock.calls.map((c) => String(c[0]));
    const hasAnalyticsHeader = allMessages.some((m) => m.includes("Analytics Events"));
    expect(hasAnalyticsHeader).toBe(true);
  });

  it("logs notifications section header", () => {
    demonstrateServices();
    const allMessages = consoleSpy.mock.calls.map((c) => String(c[0]));
    const hasNotifHeader = allMessages.some((m) => m.includes("Notifications"));
    expect(hasNotifHeader).toBe(true);
  });

  it("returns void (undefined)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });
});