import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from "@coderabbit-test/shared-services";
import { demonstrateServices } from "./demo-usage";

// ─── AnalyticsService ─────────────────────────────────────────────────────────

describe("AnalyticsService (used by demonstrateServices)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  it("tracks an event and stores it", () => {
    const event: AnalyticsEvent = {
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
    };
    analytics.track(event);
    expect(analytics.getEvents()).toHaveLength(1);
    expect(analytics.getEvents()[0].eventName).toBe("user_login");
  });

  it("tracks multiple events in order", () => {
    analytics.track({ eventName: "page_view", timestamp: new Date() });
    analytics.track({ eventName: "button_click", timestamp: new Date() });
    const events = analytics.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].eventName).toBe("page_view");
    expect(events[1].eventName).toBe("button_click");
  });

  it("tracks event with optional userId and properties", () => {
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
      properties: { browser: "Chrome", version: "120.0.0" },
    });
    const events = analytics.getEvents();
    expect(events[0].userId).toBe("user123");
    expect(events[0].properties?.browser).toBe("Chrome");
  });

  it("tracks event without optional userId", () => {
    analytics.track({ eventName: "anonymous_view", timestamp: new Date() });
    const events = analytics.getEvents();
    expect(events[0].userId).toBeUndefined();
  });

  it("getEventsByUser returns only events for the specified user", () => {
    analytics.track({ eventName: "login", userId: "alice", timestamp: new Date() });
    analytics.track({ eventName: "login", userId: "bob", timestamp: new Date() });
    analytics.track({ eventName: "view", userId: "alice", timestamp: new Date() });

    const aliceEvents = analytics.getEventsByUser("alice");
    expect(aliceEvents).toHaveLength(2);
    aliceEvents.forEach((e) => expect(e.userId).toBe("alice"));
  });

  it("getEventsByUser returns empty array for unknown user", () => {
    analytics.track({ eventName: "login", userId: "alice", timestamp: new Date() });
    expect(analytics.getEventsByUser("nobody")).toHaveLength(0);
  });

  it("clearEvents empties the event store", () => {
    analytics.track({ eventName: "login", timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it("exportEvents returns a JSON string of all tracked events", () => {
    analytics.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date("2024-01-01T00:00:00.000Z"),
      properties: { page: "/dashboard" },
    });
    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe("page_view");
  });

  it("exportEvents returns an empty JSON array when no events tracked", () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it("getEvents returns a copy (mutation does not affect internal state)", () => {
    analytics.track({ eventName: "login", timestamp: new Date() });
    const events = analytics.getEvents();
    events.pop();
    expect(analytics.getEvents()).toHaveLength(1);
  });

  it("throws when tracking an event with an empty eventName", () => {
    expect(() =>
      analytics.track({ eventName: "", timestamp: new Date() })
    ).toThrow();
  });
});

// ─── NotificationService ──────────────────────────────────────────────────────

describe("NotificationService (used by demonstrateServices)", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it("send() creates and stores a notification", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You are logged in.");
    expect(notifications.getAll()).toHaveLength(1);
  });

  it("send() returns a non-empty string id", () => {
    const id = notifications.send(NotificationType.INFO, "Info", "Message");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("send() stores the correct notification type", () => {
    notifications.send(NotificationType.ERROR, "Error", "Something went wrong.");
    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.ERROR);
  });

  it("supports all NotificationType values", () => {
    notifications.send(NotificationType.INFO, "T", "M");
    notifications.send(NotificationType.WARNING, "T", "M");
    notifications.send(NotificationType.ERROR, "T", "M");
    notifications.send(NotificationType.SUCCESS, "T", "M");

    const types = notifications.getAll().map((n) => n.type);
    expect(types).toContain(NotificationType.INFO);
    expect(types).toContain(NotificationType.WARNING);
    expect(types).toContain(NotificationType.ERROR);
    expect(types).toContain(NotificationType.SUCCESS);
  });

  it("new notifications default to unread", () => {
    notifications.send(NotificationType.INFO, "Hello", "World");
    expect(notifications.getAll()[0].read).toBe(false);
  });

  it("getUnread() returns only unread notifications", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    notifications.send(NotificationType.INFO, "B", "2");
    expect(notifications.getUnread()).toHaveLength(2);
  });

  it("markAsRead() marks a specific notification as read", () => {
    const id = notifications.send(NotificationType.INFO, "Hello", "World");
    const result = notifications.markAsRead(id);
    expect(result).toBe(true);
    expect(notifications.getAll()[0].read).toBe(true);
  });

  it("markAsRead() returns false for unknown id", () => {
    expect(notifications.markAsRead("nonexistent-id")).toBe(false);
  });

  it("markAllAsRead() marks all notifications as read", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    notifications.send(NotificationType.INFO, "B", "2");
    notifications.markAllAsRead();
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(0);
  });

  it("clear() removes all notifications", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it("getAll() returns a copy (mutation does not affect internal state)", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    const all = notifications.getAll();
    all.pop();
    expect(notifications.getAll()).toHaveLength(1);
  });

  it("subscribe() listener receives newly sent notifications", () => {
    const received: Notification[] = [];
    notifications.subscribe((n) => received.push(n));

    notifications.send(NotificationType.SUCCESS, "Done", "Finished.");
    expect(received).toHaveLength(1);
    expect(received[0].title).toBe("Done");
  });

  it("subscribe() unsubscribe function stops receiving notifications", () => {
    const received: Notification[] = [];
    const unsubscribe = notifications.subscribe((n) => received.push(n));

    notifications.send(NotificationType.INFO, "First", "1");
    unsubscribe();
    notifications.send(NotificationType.INFO, "Second", "2");

    expect(received).toHaveLength(1);
    expect(received[0].title).toBe("First");
  });
});

// ─── demonstrateServices() ────────────────────────────────────────────────────

describe("demonstrateServices()", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs the services header", () => {
    demonstrateServices();
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining("Demonstrating Internal Package Services")
    );
  });

  it("logs the analytics section header", () => {
    demonstrateServices();
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining("Analytics Events")
    );
  });

  it("logs the notifications section header", () => {
    demonstrateServices();
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining("Notifications")
    );
  });

  it("logs the completion message", () => {
    demonstrateServices();
    expect(vi.mocked(console.log)).toHaveBeenCalledWith(
      expect.stringContaining("Internal package successfully referenced and used!")
    );
  });
});