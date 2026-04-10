import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

// ---------------------------------------------------------------------------
// Helpers – create fresh service instances for isolation
// ---------------------------------------------------------------------------
function makeAnalytics() {
  return new AnalyticsService();
}
function makeNotifications() {
  return new NotificationService();
}

// ---------------------------------------------------------------------------
// demonstrateServices() – integration via fresh service instances
// The module-level function in demo-usage.ts uses module-level singletons,
// so here we verify the same interaction pattern using isolated instances.
// ---------------------------------------------------------------------------
describe("demonstrateServices interaction pattern", () => {
  let analytics: AnalyticsService;
  let notifications: NotificationService;

  beforeEach(() => {
    analytics = makeAnalytics();
    notifications = makeNotifications();
  });

  it("tracks two events with correct names", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date(), properties: { browser: "Chrome" } });
    analytics.track({ eventName: "page_view", userId: "user123", timestamp: new Date(), properties: { page: "/dashboard" } });

    const events = analytics.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].eventName).toBe("user_login");
    expect(events[1].eventName).toBe("page_view");
  });

  it("sends two notifications with correct types", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");

    const all = notifications.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });

  it("notification titles match what demonstrateServices sends", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");

    const all = notifications.getAll();
    expect(all[0].title).toBe("Welcome!");
    expect(all[1].title).toBe("New Feature");
  });

  it("analytics exportEvents returns valid JSON string", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    const json = analytics.exportEvents();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe("user_login");
  });

  it("all notifications are unread initially", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Dashboard ready.");

    const unread = notifications.getUnread();
    expect(unread).toHaveLength(2);
  });

  it("user_login event carries userId 'user123'", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date(), properties: { browser: "Chrome" } });
    const byUser = analytics.getEventsByUser("user123");
    expect(byUser).toHaveLength(1);
    expect(byUser[0].userId).toBe("user123");
  });
});

// ---------------------------------------------------------------------------
// demonstrateServices() – console output verification
// ---------------------------------------------------------------------------
describe("demonstrateServices console output", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs the opening banner", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs the analytics section header", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Analytics Events ===");
  });

  it("logs the notifications section header", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Notifications ===");
  });

  it("logs the completion message", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Service Recognition Test Complete ===");
  });

  it("does not throw when called", async () => {
    const { demonstrateServices } = await import("./demo-usage");
    expect(() => demonstrateServices()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService – direct unit tests (backing the demo usage)
// ---------------------------------------------------------------------------
describe("AnalyticsService", () => {
  it("starts with an empty event list", () => {
    const svc = makeAnalytics();
    expect(svc.getEvents()).toHaveLength(0);
  });

  it("accumulates events across multiple track() calls", () => {
    const svc = makeAnalytics();
    svc.track({ eventName: "e1", timestamp: new Date() });
    svc.track({ eventName: "e2", timestamp: new Date() });
    svc.track({ eventName: "e3", timestamp: new Date() });
    expect(svc.getEvents()).toHaveLength(3);
  });

  it("getEvents returns a copy, not the internal array", () => {
    const svc = makeAnalytics();
    svc.track({ eventName: "e1", timestamp: new Date() });
    const copy1 = svc.getEvents();
    const copy2 = svc.getEvents();
    expect(copy1).not.toBe(copy2);
  });

  it("clearEvents empties the event list", () => {
    const svc = makeAnalytics();
    svc.track({ eventName: "e1", timestamp: new Date() });
    svc.clearEvents();
    expect(svc.getEvents()).toHaveLength(0);
  });

  it("getEventsByUser returns only matching user events", () => {
    const svc = makeAnalytics();
    svc.track({ eventName: "login", userId: "alice", timestamp: new Date() });
    svc.track({ eventName: "logout", userId: "bob", timestamp: new Date() });
    svc.track({ eventName: "click", userId: "alice", timestamp: new Date() });
    const aliceEvents = svc.getEventsByUser("alice");
    expect(aliceEvents).toHaveLength(2);
    aliceEvents.forEach((e) => expect(e.userId).toBe("alice"));
  });

  it("getEventsByUser returns empty array for unknown user", () => {
    const svc = makeAnalytics();
    svc.track({ eventName: "login", userId: "alice", timestamp: new Date() });
    expect(svc.getEventsByUser("nobody")).toHaveLength(0);
  });

  it("throws when eventName is empty", () => {
    const svc = makeAnalytics();
    expect(() =>
      svc.track({ eventName: "", timestamp: new Date() })
    ).toThrow();
  });

  it("accepts optional userId being absent", () => {
    const svc = makeAnalytics();
    expect(() =>
      svc.track({ eventName: "anonymous_view", timestamp: new Date() })
    ).not.toThrow();
    expect(svc.getEvents()[0].userId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// NotificationService – direct unit tests (backing the demo usage)
// ---------------------------------------------------------------------------
describe("NotificationService", () => {
  it("starts with an empty notification list", () => {
    const svc = makeNotifications();
    expect(svc.getAll()).toHaveLength(0);
  });

  it("send() returns a non-empty id string", () => {
    const svc = makeNotifications();
    const id = svc.send(NotificationType.INFO, "Title", "Message");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("newly sent notification has read=false", () => {
    const svc = makeNotifications();
    svc.send(NotificationType.SUCCESS, "Hello", "World");
    const notifications = svc.getAll();
    expect(notifications[0].read).toBe(false);
  });

  it("markAsRead returns true for existing notification", () => {
    const svc = makeNotifications();
    const id = svc.send(NotificationType.WARNING, "Warn", "Be careful");
    expect(svc.markAsRead(id)).toBe(true);
    const notification = svc.getAll().find((n) => n.id === id);
    expect(notification?.read).toBe(true);
  });

  it("markAsRead returns false for unknown id", () => {
    const svc = makeNotifications();
    expect(svc.markAsRead("nonexistent-id")).toBe(false);
  });

  it("markAllAsRead marks every notification as read", () => {
    const svc = makeNotifications();
    svc.send(NotificationType.INFO, "A", "msg");
    svc.send(NotificationType.ERROR, "B", "msg");
    svc.markAllAsRead();
    svc.getAll().forEach((n) => expect(n.read).toBe(true));
  });

  it("getUnread returns only unread notifications", () => {
    const svc = makeNotifications();
    const id1 = svc.send(NotificationType.INFO, "First", "first message");
    svc.send(NotificationType.SUCCESS, "Second", "second message");
    svc.markAsRead(id1);
    const unread = svc.getUnread();
    expect(unread).toHaveLength(1);
    expect(unread[0].title).toBe("Second");
  });

  it("subscribe listener is called on send()", () => {
    const svc = makeNotifications();
    const listener = vi.fn();
    svc.subscribe(listener);
    svc.send(NotificationType.SUCCESS, "Hi", "there");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops listener from being called", () => {
    const svc = makeNotifications();
    const listener = vi.fn();
    const unsubscribe = svc.subscribe(listener);
    unsubscribe();
    svc.send(NotificationType.INFO, "Test", "message");
    expect(listener).not.toHaveBeenCalled();
  });

  it("clear() removes all notifications", () => {
    const svc = makeNotifications();
    svc.send(NotificationType.INFO, "A", "msg");
    svc.send(NotificationType.ERROR, "B", "msg");
    svc.clear();
    expect(svc.getAll()).toHaveLength(0);
  });

  it("getAll returns a copy of the internal array", () => {
    const svc = makeNotifications();
    svc.send(NotificationType.INFO, "T", "M");
    const list1 = svc.getAll();
    const list2 = svc.getAll();
    expect(list1).not.toBe(list2);
  });

  it("all four NotificationType values are accepted", () => {
    const svc = makeNotifications();
    [
      NotificationType.INFO,
      NotificationType.WARNING,
      NotificationType.ERROR,
      NotificationType.SUCCESS,
    ].forEach((type) => {
      expect(() => svc.send(type, "Title", "Body")).not.toThrow();
    });
    expect(svc.getAll()).toHaveLength(4);
  });

  it("notification object has the expected shape", () => {
    const svc = makeNotifications();
    const id = svc.send(NotificationType.ERROR, "Error Title", "Error body.");
    const n = svc.getAll()[0];
    expect(n.id).toBe(id);
    expect(n.type).toBe(NotificationType.ERROR);
    expect(n.title).toBe("Error Title");
    expect(n.message).toBe("Error body.");
    expect(n.timestamp).toBeInstanceOf(Date);
    expect(n.read).toBe(false);
  });
});