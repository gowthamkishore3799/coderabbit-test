// Tests for demo-usage.ts - demonstrateServices function (new file in this PR)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the shared-services package before importing demo-usage
vi.mock("@coderabbit-test/shared-services", () => {
  const trackMock = vi.fn();
  const exportEventsMock = vi.fn().mockReturnValue("[]");
  const getAllMock = vi.fn().mockReturnValue([]);
  const sendMock = vi.fn().mockReturnValue("mock-id-123");

  const AnalyticsService = vi.fn().mockImplementation(() => ({
    track: trackMock,
    exportEvents: exportEventsMock,
    getEvents: vi.fn().mockReturnValue([]),
    clearEvents: vi.fn(),
  }));

  const NotificationService = vi.fn().mockImplementation(() => ({
    send: sendMock,
    getAll: getAllMock,
    getUnread: vi.fn().mockReturnValue([]),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    subscribe: vi.fn(),
    clear: vi.fn(),
  }));

  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  };

  return { AnalyticsService, NotificationService, NotificationType };
});

import { demonstrateServices } from "./demo-usage";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

describe("demonstrateServices", () => {
  let analyticsInstance: ReturnType<typeof AnalyticsService.prototype.constructor>;
  let notificationsInstance: ReturnType<typeof NotificationService.prototype.constructor>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("calls analytics.track twice (user_login and page_view events)", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    expect(instance.track).toHaveBeenCalledTimes(2);
  });

  it("tracks user_login event with correct eventName", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const firstCall = instance.track.mock.calls[0][0];
    expect(firstCall.eventName).toBe("user_login");
  });

  it("tracks page_view event with correct eventName", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const secondCall = instance.track.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
  });

  it("tracks events with userId 'user123'", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const calls = instance.track.mock.calls;
    expect(calls[0][0].userId).toBe("user123");
    expect(calls[1][0].userId).toBe("user123");
  });

  it("tracks events with a timestamp that is a Date instance", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const calls = instance.track.mock.calls;
    expect(calls[0][0].timestamp).toBeInstanceOf(Date);
    expect(calls[1][0].timestamp).toBeInstanceOf(Date);
  });

  it("tracks user_login event with browser properties", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const firstCall = instance.track.mock.calls[0][0];
    expect(firstCall.properties).toBeDefined();
    expect(firstCall.properties.browser).toBe("Chrome");
    expect(firstCall.properties.version).toBe("120.0.0");
  });

  it("tracks page_view event with page properties", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    const secondCall = instance.track.mock.calls[1][0];
    expect(secondCall.properties.page).toBe("/dashboard");
    expect(secondCall.properties.referrer).toBe("/login");
  });

  it("calls notifications.send twice", () => {
    demonstrateServices();

    const notifConstructor = vi.mocked(NotificationService);
    const instance = notifConstructor.mock.instances[0] as any;
    expect(instance.send).toHaveBeenCalledTimes(2);
  });

  it("sends SUCCESS notification with title 'Welcome!'", () => {
    demonstrateServices();

    const notifConstructor = vi.mocked(NotificationService);
    const instance = notifConstructor.mock.instances[0] as any;
    const firstCall = instance.send.mock.calls[0];
    expect(firstCall[0]).toBe(NotificationType.SUCCESS);
    expect(firstCall[1]).toBe("Welcome!");
    expect(firstCall[2]).toBe("You have successfully logged in.");
  });

  it("sends INFO notification with title 'New Feature'", () => {
    demonstrateServices();

    const notifConstructor = vi.mocked(NotificationService);
    const instance = notifConstructor.mock.instances[0] as any;
    const secondCall = instance.send.mock.calls[1];
    expect(secondCall[0]).toBe(NotificationType.INFO);
    expect(secondCall[1]).toBe("New Feature");
    expect(secondCall[2]).toBe("Check out our new analytics dashboard!");
  });

  it("calls analytics.exportEvents once", () => {
    demonstrateServices();

    const analyticsConstructor = vi.mocked(AnalyticsService);
    const instance = analyticsConstructor.mock.instances[0] as any;
    expect(instance.exportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls notifications.getAll once", () => {
    demonstrateServices();

    const notifConstructor = vi.mocked(NotificationService);
    const instance = notifConstructor.mock.instances[0] as any;
    expect(instance.getAll).toHaveBeenCalledTimes(1);
  });

  it("logs console output during execution", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("logs the header message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs notification entries from getAll result", () => {
    const mockNotif = {
      id: "abc123",
      type: "success",
      title: "Welcome!",
      message: "You have successfully logged in.",
      timestamp: new Date(),
      read: false,
    };
    const notifConstructor = vi.mocked(NotificationService);
    (notifConstructor as any).mockImplementationOnce(() => ({
      send: vi.fn().mockReturnValue("abc123"),
      getAll: vi.fn().mockReturnValue([mockNotif]),
      getUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      subscribe: vi.fn(),
      clear: vi.fn(),
    }));
    const analyticsConstructor = vi.mocked(AnalyticsService);
    (analyticsConstructor as any).mockImplementationOnce(() => ({
      track: vi.fn(),
      exportEvents: vi.fn().mockReturnValue("[]"),
      getEvents: vi.fn(),
      clearEvents: vi.fn(),
    }));

    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map((c) => c[0]);
    const notifLog = logCalls.find(
      (msg) => typeof msg === "string" && msg.includes("[SUCCESS]")
    );
    expect(notifLog).toBeDefined();
  });

  it("returns undefined (void function)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it("does not throw when services work normally", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });
});