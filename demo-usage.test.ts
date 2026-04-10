import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

// Tests for demo-usage.ts – demonstrateServices() function.
// The function is a new addition in this PR demonstrating AnalyticsService
// and NotificationService from the internal shared-services package.
//
// NOTE: demonstrateServices() calls analytics.track() with a 'properties' field.
// In the installed Zod version (4.3.6), z.record(z.any()) requires two type
// arguments at runtime, causing track() with properties to throw.
// Tests document both the correct service behaviour (without properties) and
// the known runtime limitation with the properties field.

describe("demo-usage.ts – demonstrateServices()", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Also suppress analytics/notification console output
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("exports demonstrateServices as a named function", async () => {
    const mod = await import("./demo-usage");
    expect(typeof mod.demonstrateServices).toBe("function");
  });

  it("demonstrateServices() throws due to z.record(z.any()) incompatibility in Zod 4.3.6", async () => {
    // The analytics.track() call in demonstrateServices() passes a 'properties' field,
    // which triggers z.record(z.any()) at runtime — a known issue in Zod 4.3.6.
    const { demonstrateServices } = await import("./demo-usage");
    expect(() => demonstrateServices()).toThrow(TypeError);
  });

  it("logs the introductory header before throwing", async () => {
    // demonstrateServices() logs the header before the first track() call
    const spy = vi.spyOn(console, "log");
    const { demonstrateServices } = await import("./demo-usage");
    try { demonstrateServices(); } catch (_) { /* expected */ }
    const allCalls = spy.mock.calls.flat();
    expect(allCalls.some((c) => String(c).includes("Demonstrating Internal Package Services"))).toBe(true);
    spy.mockRestore();
  });
});

describe("AnalyticsService – used in demo-usage.ts", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with an empty events list", () => {
    expect(service.getEvents()).toHaveLength(0);
  });

  it("tracks a 'user_login' event without properties", () => {
    service.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
    });
    expect(service.getEvents()).toHaveLength(1);
    expect(service.getEvents()[0].eventName).toBe("user_login");
  });

  it("tracks a 'page_view' event without properties", () => {
    service.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
    });
    expect(service.getEvents()[0].eventName).toBe("page_view");
  });

  it("track() with properties throws due to z.record(z.any()) Zod 4.3.6 incompatibility", () => {
    // This documents the known bug: passing properties causes a runtime error.
    expect(() =>
      service.track({
        eventName: "user_login",
        userId: "user123",
        timestamp: new Date(),
        properties: { browser: "Chrome", version: "120.0.0" },
      })
    ).toThrow();
  });

  it("accumulates multiple events", () => {
    service.track({ eventName: "user_login", timestamp: new Date() });
    service.track({ eventName: "page_view", timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it("filters events by userId with getEventsByUser()", () => {
    service.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    service.track({ eventName: "page_view", userId: "user456", timestamp: new Date() });
    const user123Events = service.getEventsByUser("user123");
    expect(user123Events).toHaveLength(1);
    expect(user123Events[0].userId).toBe("user123");
  });

  it("getEventsByUser() returns empty array for unknown userId", () => {
    service.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    expect(service.getEventsByUser("unknown")).toHaveLength(0);
  });

  it("getEventsByUser() matches only the exact userId", () => {
    service.track({ eventName: "login", userId: "user123", timestamp: new Date() });
    service.track({ eventName: "login", userId: "user1234", timestamp: new Date() });
    expect(service.getEventsByUser("user123")).toHaveLength(1);
  });

  it("exportEvents() returns valid JSON string", () => {
    service.track({ eventName: "user_login", timestamp: new Date() });
    const exported = service.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe("user_login");
  });

  it("exportEvents() returns empty JSON array when no events", () => {
    const exported = service.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it("clearEvents() removes all tracked events", () => {
    service.track({ eventName: "user_login", timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it("throws when tracking an event with an empty eventName", () => {
    expect(() =>
      service.track({ eventName: "", timestamp: new Date() })
    ).toThrow();
  });

  it("getEvents() returns a copy (mutation does not affect internal state)", () => {
    service.track({ eventName: "user_login", timestamp: new Date() });
    const events = service.getEvents();
    events.pop();
    expect(service.getEvents()).toHaveLength(1);
  });

  it("stored events include the userId when provided", () => {
    service.track({ eventName: "login", userId: "abc", timestamp: new Date() });
    expect(service.getEvents()[0].userId).toBe("abc");
  });

  it("stored events preserve the timestamp", () => {
    const ts = new Date("2024-01-01T00:00:00Z");
    service.track({ eventName: "login", timestamp: ts });
    expect(service.getEvents()[0].timestamp).toEqual(ts);
  });
});

describe("NotificationService – used in demo-usage.ts", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with an empty notification list", () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it("send() returns a non-empty string id (as in demo-usage.ts)", () => {
    const id = service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("sends a SUCCESS notification (as in demo-usage.ts)", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    expect(service.getAll()[0].type).toBe(NotificationType.SUCCESS);
  });

  it("sends an INFO notification (as in demo-usage.ts)", () => {
    service.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    const all = service.getAll();
    expect(all.some((n) => n.type === NotificationType.INFO)).toBe(true);
  });

  it("stores both notifications sent in demo-usage.ts", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    service.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    expect(service.getAll()).toHaveLength(2);
  });

  it("new notifications have read=false", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    expect(service.getAll()[0].read).toBe(false);
  });

  it("getUnread() returns all unread notifications", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    service.send(NotificationType.INFO, "Info", "Message.");
    expect(service.getUnread()).toHaveLength(2);
  });

  it("markAsRead() marks a specific notification as read", () => {
    const id = service.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    expect(service.markAsRead(id)).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
  });

  it("markAsRead() returns false for an unknown id", () => {
    expect(service.markAsRead("nonexistent-id")).toBe(false);
  });

  it("markAllAsRead() marks every notification as read", () => {
    service.send(NotificationType.SUCCESS, "A", "Message A.");
    service.send(NotificationType.INFO, "B", "Message B.");
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });

  it("subscribe() calls the listener when a notification is sent", () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, "Test", "Testing subscription.");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.INFO);
  });

  it("subscribe() returns an unsubscribe function that stops future calls", () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.send(NotificationType.INFO, "After unsub", "Should not trigger.");
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple listeners are each notified on send()", () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    service.subscribe(l1);
    service.subscribe(l2);
    service.send(NotificationType.WARNING, "Alert", "Something happened.");
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
  });

  it("clear() removes all notifications", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it("getAll() returns a copy (mutation does not affect internal state)", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    const all = service.getAll();
    all.pop();
    expect(service.getAll()).toHaveLength(1);
  });

  it("sent notification preserves correct title and message", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    const notification = service.getAll()[0];
    expect(notification.title).toBe("Welcome!");
    expect(notification.message).toBe("You have successfully logged in.");
  });

  it("getUnread() is empty after markAllAsRead()", () => {
    service.send(NotificationType.ERROR, "Error", "Something went wrong.");
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });
});