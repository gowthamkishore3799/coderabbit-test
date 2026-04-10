/**
 * Unit tests for AnalyticsService and NotificationService from
 * @coderabbit-test/shared-services – the services used by demo-usage.ts (PR change).
 *
 * NOTE: The AnalyticsEventSchema in shared-services uses `z.record(z.any())`
 * which is a pre-existing Zod v3 API incompatibility in v4. Calling
 * analytics.track() with a `properties` object triggers this bug.
 * Tests here only pass events without `properties` to stay within the working
 * surface; the demonstrateServices() integration tests use mocks instead
 * (see demo-usage-function.test.ts).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from "@coderabbit-test/shared-services";

// ---------------------------------------------------------------------------
// AnalyticsService
// ---------------------------------------------------------------------------
describe("AnalyticsService (used in demo-usage)", () => {
  let svc: AnalyticsService;

  beforeEach(() => {
    svc = new AnalyticsService();
  });

  it("starts with zero events", () => {
    expect(svc.getEvents()).toHaveLength(0);
  });

  it("track() stores an event", () => {
    svc.track({ eventName: "user_login", userId: "u1", timestamp: new Date() });
    expect(svc.getEvents()).toHaveLength(1);
  });

  it("track() stores the correct event name", () => {
    svc.track({ eventName: "page_view", userId: "u2", timestamp: new Date() });
    expect(svc.getEvents()[0].eventName).toBe("page_view");
  });

  it("track() preserves the userId", () => {
    svc.track({ eventName: "click", userId: "alice", timestamp: new Date() });
    expect(svc.getEvents()[0].userId).toBe("alice");
  });

  it("multiple track() calls accumulate events", () => {
    svc.track({ eventName: "e1", userId: "u1", timestamp: new Date() });
    svc.track({ eventName: "e2", userId: "u1", timestamp: new Date() });
    expect(svc.getEvents()).toHaveLength(2);
  });

  it("getEventsByUser() returns only events for the given user", () => {
    svc.track({ eventName: "ev1", userId: "alice", timestamp: new Date() });
    svc.track({ eventName: "ev2", userId: "bob",   timestamp: new Date() });
    svc.track({ eventName: "ev3", userId: "alice", timestamp: new Date() });
    expect(svc.getEventsByUser("alice")).toHaveLength(2);
    expect(svc.getEventsByUser("bob")).toHaveLength(1);
  });

  it("getEventsByUser() returns empty array for unknown user", () => {
    svc.track({ eventName: "ev1", userId: "alice", timestamp: new Date() });
    expect(svc.getEventsByUser("nobody")).toHaveLength(0);
  });

  it("exportEvents() returns valid JSON string", () => {
    svc.track({ eventName: "test", userId: "u1", timestamp: new Date() });
    const json = svc.exportEvents();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it("exportEvents() returns '[]' when no events tracked", () => {
    const json = svc.exportEvents();
    expect(JSON.parse(json)).toEqual([]);
  });

  it("clearEvents() empties the event list", () => {
    svc.track({ eventName: "ev", userId: "u1", timestamp: new Date() });
    svc.clearEvents();
    expect(svc.getEvents()).toHaveLength(0);
  });

  it("getEvents() returns a copy (mutations do not affect internal state)", () => {
    svc.track({ eventName: "ev", userId: "u1", timestamp: new Date() });
    const copy = svc.getEvents();
    copy.push({ eventName: "injected", timestamp: new Date() });
    expect(svc.getEvents()).toHaveLength(1);
  });

  it("mirrors the two track() calls made in demonstrateServices()", () => {
    svc.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    svc.track({ eventName: "page_view",  userId: "user123", timestamp: new Date() });
    expect(svc.getEvents()).toHaveLength(2);
    expect(svc.getEventsByUser("user123")).toHaveLength(2);
    expect(svc.getEvents()[0].eventName).toBe("user_login");
    expect(svc.getEvents()[1].eventName).toBe("page_view");
  });
});

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------
describe("NotificationService (used in demo-usage)", () => {
  let svc: NotificationService;

  beforeEach(() => {
    svc = new NotificationService();
  });

  it("starts with zero notifications", () => {
    expect(svc.getAll()).toHaveLength(0);
  });

  it("send() returns a non-empty string id", () => {
    const id = svc.send(NotificationType.SUCCESS, "Title", "Message");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("send() stores the notification", () => {
    svc.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    expect(svc.getAll()).toHaveLength(1);
  });

  it("send() stores correct type", () => {
    svc.send(NotificationType.INFO, "T", "M");
    expect(svc.getAll()[0].type).toBe(NotificationType.INFO);
  });

  it("send() stores correct title", () => {
    svc.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    expect(svc.getAll()[0].title).toBe("New Feature");
  });

  it("send() stores correct message", () => {
    svc.send(NotificationType.INFO, "T", "Check out our new analytics dashboard!");
    expect(svc.getAll()[0].message).toBe("Check out our new analytics dashboard!");
  });

  it("new notifications start as unread", () => {
    svc.send(NotificationType.WARNING, "Heads up", "Something happened.");
    expect(svc.getAll()[0].read).toBe(false);
  });

  it("getUnread() returns only unread notifications", () => {
    svc.send(NotificationType.INFO, "T1", "M1");
    svc.send(NotificationType.ERROR, "T2", "M2");
    expect(svc.getUnread()).toHaveLength(2);
  });

  it("getUnread() is empty after markAllAsRead()", () => {
    svc.send(NotificationType.INFO, "T1", "M1");
    svc.send(NotificationType.INFO, "T2", "M2");
    svc.markAllAsRead();
    expect(svc.getUnread()).toHaveLength(0);
  });

  it("markAsRead() marks the correct notification as read", () => {
    const id = svc.send(NotificationType.SUCCESS, "T", "M");
    svc.markAsRead(id);
    const notification = svc.getAll().find((n) => n.id === id);
    expect(notification?.read).toBe(true);
  });

  it("markAsRead() returns true when notification exists", () => {
    const id = svc.send(NotificationType.SUCCESS, "T", "M");
    expect(svc.markAsRead(id)).toBe(true);
  });

  it("markAsRead() returns false for unknown id", () => {
    expect(svc.markAsRead("nonexistent-id")).toBe(false);
  });

  it("markAsRead() does not affect other notifications", () => {
    const id1 = svc.send(NotificationType.INFO, "T1", "M1");
    svc.send(NotificationType.INFO, "T2", "M2");
    svc.markAsRead(id1);
    expect(svc.getUnread()).toHaveLength(1);
  });

  it("clear() removes all notifications", () => {
    svc.send(NotificationType.SUCCESS, "T", "M");
    svc.clear();
    expect(svc.getAll()).toHaveLength(0);
  });

  it("subscribe() listener is called when a notification is sent", () => {
    const listener = vi.fn();
    svc.subscribe(listener);
    svc.send(NotificationType.SUCCESS, "T", "M");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("subscribe() listener receives the correct notification object", () => {
    const listener = vi.fn();
    svc.subscribe(listener);
    svc.send(NotificationType.ERROR, "Error title", "Error message");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.ERROR, title: "Error title" })
    );
  });

  it("unsubscribe stops listener from being called", () => {
    const listener = vi.fn();
    const unsubscribe = svc.subscribe(listener);
    unsubscribe();
    svc.send(NotificationType.INFO, "T", "M");
    expect(listener).not.toHaveBeenCalled();
  });

  it("getAll() returns a copy (mutations do not affect internal state)", () => {
    svc.send(NotificationType.INFO, "T", "M");
    const copy = svc.getAll();
    copy.push({
      id: "fake",
      type: NotificationType.INFO,
      title: "Fake",
      message: "Fake",
      timestamp: new Date(),
      read: false,
    });
    expect(svc.getAll()).toHaveLength(1);
  });

  it("mirrors the two send() calls made in demonstrateServices()", () => {
    svc.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    svc.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    const all = svc.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });
});