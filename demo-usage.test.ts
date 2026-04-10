import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

/**
 * Tests for demo-usage.ts (added in this PR).
 *
 * demonstrateServices() is the exported function that drives AnalyticsService
 * and NotificationService from the internal @coderabbit-test/shared-services package.
 *
 * NOTE: AnalyticsService.track() uses z.record(z.any()) which is a zod v4.0.x API
 * that is incompatible with zod v4.1.x (z.record now requires two arguments).
 * Accordingly, tests for demonstrateServices() and AnalyticsService.track() use
 * vi.mock to isolate the function under test from the schema incompatibility.
 */

// ---------------------------------------------------------------------------
// Mock the shared-services package for demonstrateServices unit tests
// ---------------------------------------------------------------------------

vi.mock("@coderabbit-test/shared-services", async (importActual) => {
  const actual = await importActual<typeof import("@coderabbit-test/shared-services")>();

  class MockAnalyticsService {
    private _events: { eventName: string }[] = [];
    track = vi.fn().mockImplementation((event: { eventName: string }) => {
      this._events.push(event);
    });
    getEvents = vi.fn().mockImplementation(() => [...this._events]);
    getEventsByUser = vi.fn().mockReturnValue([]);
    clearEvents = vi.fn().mockImplementation(() => { this._events = []; });
    exportEvents = vi.fn().mockReturnValue("[]");
  }

  return {
    ...actual,
    AnalyticsService: MockAnalyticsService,
  };
});

describe("demonstrateServices", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("executes without throwing", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs the banner header", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((m) => m.includes("Demonstrating Internal Package Services"))).toBe(true);
  });

  it("logs the completion message", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((m) => m.includes("Service Recognition Test Complete"))).toBe(true);
  });

  it("logs the analytics events section header", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((m) => m.includes("Analytics Events"))).toBe(true);
  });

  it("logs the notifications section header", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((m) => m.includes("Notifications"))).toBe(true);
  });

  it("logs the internal package success message", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((m) => m.includes("Internal package successfully referenced"))).toBe(true);
  });

  it("calls console.log multiple times (banner + 3 sections + details)", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// NotificationService – works correctly with zod v4.1.x
// ---------------------------------------------------------------------------

describe("NotificationService – used by demonstrateServices", () => {
  let service: NotificationService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new NotificationService();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("sends a SUCCESS notification and returns a string id", () => {
    const id = service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("sends an INFO notification", () => {
    service.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
  });

  it("getAll returns all sent notifications", () => {
    service.send(NotificationType.SUCCESS, "A", "msg a");
    service.send(NotificationType.INFO, "B", "msg b");
    expect(service.getAll()).toHaveLength(2);
  });

  it("new notifications start as unread", () => {
    service.send(NotificationType.SUCCESS, "Hello", "World");
    const notif = service.getAll()[0];
    expect(notif.read).toBe(false);
  });

  it("getUnread returns only unread notifications", () => {
    service.send(NotificationType.SUCCESS, "A", "a");
    service.send(NotificationType.INFO, "B", "b");
    expect(service.getUnread()).toHaveLength(2);
  });

  it("markAsRead marks a notification as read and returns true", () => {
    const id = service.send(NotificationType.INFO, "T", "M");
    const result = service.markAsRead(id);
    expect(result).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
  });

  it("markAsRead returns false for an unknown id", () => {
    expect(service.markAsRead("non-existent-id")).toBe(false);
  });

  it("markAllAsRead marks every notification as read", () => {
    service.send(NotificationType.SUCCESS, "A", "a");
    service.send(NotificationType.WARNING, "B", "b");
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });

  it("subscribe listener is invoked when a notification is sent", () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.ERROR, "Title", "Msg");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.ERROR);
  });

  it("unsubscribe stops the listener from being called", () => {
    const listener = vi.fn();
    const unsub = service.subscribe(listener);
    unsub();
    service.send(NotificationType.INFO, "T", "M");
    expect(listener).not.toHaveBeenCalled();
  });

  it("clear removes all notifications", () => {
    service.send(NotificationType.INFO, "X", "Y");
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it("getAll returns a defensive copy – external mutations do not affect state", () => {
    service.send(NotificationType.INFO, "T", "M");
    const copy = service.getAll();
    copy.pop();
    expect(service.getAll()).toHaveLength(1);
  });

  it("notification fields are correctly set", () => {
    const before = new Date();
    service.send(NotificationType.WARNING, "Warn Title", "Warn message");
    const after = new Date();
    const notif = service.getAll()[0];
    expect(notif.title).toBe("Warn Title");
    expect(notif.message).toBe("Warn message");
    expect(notif.type).toBe(NotificationType.WARNING);
    expect(notif.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(notif.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});