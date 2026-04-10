/**
 * Tests for demo-usage.ts — new file added in this PR.
 *
 * demo-usage.ts creates module-level AnalyticsService and NotificationService
 * instances and exports demonstrateServices().  The function exercises both
 * services by tracking events and sending notifications.
 *
 * We test the behaviour via the underlying services directly (since the
 * module-level instances in demo-usage.ts are singletons we cannot reset).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from "@coderabbit-test/shared-services";

// ---------------------------------------------------------------------------
// AnalyticsService — used in demonstrateServices()
// ---------------------------------------------------------------------------

describe("AnalyticsService (used in demo-usage.ts)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  it("starts with an empty event list", () => {
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it("tracks a user_login event like demo-usage.ts does", () => {
    const event: AnalyticsEvent = {
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
      properties: { browser: "Chrome", version: "120.0.0" },
    };
    analytics.track(event);
    expect(analytics.getEvents()).toHaveLength(1);
    expect(analytics.getEvents()[0].eventName).toBe("user_login");
    expect(analytics.getEvents()[0].userId).toBe("user123");
  });

  it("tracks a page_view event like demo-usage.ts does", () => {
    analytics.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
      properties: { page: "/dashboard", referrer: "/login" },
    });
    expect(analytics.getEvents()[0].eventName).toBe("page_view");
  });

  it("tracks multiple events — both user_login and page_view", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    analytics.track({ eventName: "page_view", userId: "user123", timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it("getEventsByUser returns only events for the given userId", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    analytics.track({ eventName: "page_view", userId: "user456", timestamp: new Date() });
    expect(analytics.getEventsByUser("user123")).toHaveLength(1);
    expect(analytics.getEventsByUser("user456")).toHaveLength(1);
    expect(analytics.getEventsByUser("unknown")).toHaveLength(0);
  });

  it("exportEvents() returns a JSON string of tracked events", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    const exported = analytics.exportEvents();
    expect(typeof exported).toBe("string");
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe("user_login");
  });

  it("exportEvents() returns empty array JSON when no events tracked", () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it("getEvents() returns a copy — mutations do not affect internal state", () => {
    analytics.track({ eventName: "test", timestamp: new Date() });
    const events = analytics.getEvents();
    events.push({ eventName: "injected", timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
  });

  it("accepts an event without userId (optional field)", () => {
    const event: AnalyticsEvent = {
      eventName: "anonymous_view",
      timestamp: new Date(),
    };
    analytics.track(event);
    expect(analytics.getEvents()[0].userId).toBeUndefined();
  });

  it("accepts an event without properties (optional field)", () => {
    const event: AnalyticsEvent = {
      eventName: "bare_event",
      userId: "u1",
      timestamp: new Date(),
    };
    analytics.track(event);
    expect(analytics.getEvents()[0].properties).toBeUndefined();
  });

  it("rejects an event with an empty eventName", () => {
    expect(() =>
      analytics.track({ eventName: "", timestamp: new Date() })
    ).toThrow();
  });

  it("clearEvents() removes all tracked events", () => {
    analytics.track({ eventName: "e1", timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — used in demonstrateServices()
// ---------------------------------------------------------------------------

describe("NotificationService (used in demo-usage.ts)", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it("starts with an empty notification list", () => {
    expect(notifications.getAll()).toHaveLength(0);
  });

  it("sends a SUCCESS notification like demo-usage.ts does", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe("Welcome!");
    expect(all[0].message).toBe("You have successfully logged in.");
  });

  it("sends an INFO notification like demo-usage.ts does", () => {
    notifications.send(
      NotificationType.INFO,
      "New Feature",
      "Check out our new analytics dashboard!"
    );
    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe("New Feature");
  });

  it("send() returns a non-empty string id", () => {
    const id = notifications.send(NotificationType.INFO, "T", "M");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("send() returns unique ids for successive calls", () => {
    const id1 = notifications.send(NotificationType.INFO, "T1", "M1");
    const id2 = notifications.send(NotificationType.INFO, "T2", "M2");
    expect(id1).not.toBe(id2);
  });

  it("new notifications are unread by default", () => {
    notifications.send(NotificationType.WARNING, "Heads up", "Something happened");
    expect(notifications.getUnread()).toHaveLength(1);
  });

  it("getAll() returns all notifications sent so far", () => {
    notifications.send(NotificationType.SUCCESS, "A", "a");
    notifications.send(NotificationType.INFO, "B", "b");
    expect(notifications.getAll()).toHaveLength(2);
  });

  it("getAll() returns a copy — mutations do not affect internal state", () => {
    notifications.send(NotificationType.INFO, "T", "M");
    const all = notifications.getAll();
    all.push({} as Notification);
    expect(notifications.getAll()).toHaveLength(1);
  });

  it("getUnread() returns only unread notifications", () => {
    const id = notifications.send(NotificationType.INFO, "T", "M");
    notifications.markAsRead(id);
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it("markAsRead() marks the correct notification", () => {
    notifications.send(NotificationType.INFO, "First", "First message");
    const id2 = notifications.send(NotificationType.ERROR, "Second", "Error message");
    notifications.markAsRead(id2);

    const all = notifications.getAll();
    expect(all.find((n) => n.id === id2)?.read).toBe(true);
    expect(all.find((n) => n.id !== id2)?.read).toBe(false);
  });

  it("markAsRead() returns false for an unknown id", () => {
    expect(notifications.markAsRead("non-existent-id")).toBe(false);
  });

  it("markAllAsRead() marks every notification as read", () => {
    notifications.send(NotificationType.INFO, "A", "a");
    notifications.send(NotificationType.WARNING, "B", "b");
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it("clear() removes all notifications", () => {
    notifications.send(NotificationType.SUCCESS, "T", "M");
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it("subscribe() listener is called when a notification is sent", () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.INFO, "T", "M");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe("T");
  });

  it("unsubscribe function returned by subscribe() stops listener from being called", () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, "T", "M");
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports all NotificationType values", () => {
    for (const type of Object.values(NotificationType)) {
      notifications.send(type, "Title", "Message");
    }
    expect(notifications.getAll()).toHaveLength(Object.values(NotificationType).length);
  });
});

// ---------------------------------------------------------------------------
// NotificationType enum — used in demo-usage.ts import
// ---------------------------------------------------------------------------

describe("NotificationType enum", () => {
  it("has the four expected values", () => {
    expect(NotificationType.INFO).toBe("info");
    expect(NotificationType.WARNING).toBe("warning");
    expect(NotificationType.ERROR).toBe("error");
    expect(NotificationType.SUCCESS).toBe("success");
  });
});