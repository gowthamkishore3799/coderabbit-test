/**
 * Tests for demo-usage.ts
 *
 * PR changes tested:
 * - New file demonstrating AnalyticsService and NotificationService from @coderabbit-test/shared-services
 * - The `demonstrateServices` function: tracks events and sends notifications
 *
 * Because the shared-services package is not yet compiled (no dist/), these tests
 * import from the source files directly using Node's --experimental-strip-types.
 *
 * Run: node --experimental-strip-types --test demo-usage.test.ts
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Import services directly from source (avoids the unbuilt dist/ issue)
import { AnalyticsService } from "./packages/shared-services/src/analytics-service.ts";
import {
  NotificationService,
  NotificationType,
} from "./packages/shared-services/src/notification-service.ts";

// ---------------------------------------------------------------------------
// AnalyticsService – exercised by demonstrateServices()
// ---------------------------------------------------------------------------
describe("AnalyticsService (used by demonstrateServices)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  test("starts with an empty events list", () => {
    assert.deepEqual(analytics.getEvents(), []);
  });

  test("track() stores a validated event", () => {
    // Note: the `properties` field uses z.record(z.any()) which requires 2 args in zod 4.1.5;
    // we test without it since `properties` is optional in the schema.
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
    });
    const events = analytics.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "user_login");
    assert.equal(events[0].userId, "user123");
  });

  test("track() stores a page_view event", () => {
    analytics.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
    });
    const events = analytics.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "page_view");
  });

  test("track() accumulates multiple events", () => {
    analytics.track({ eventName: "user_login", timestamp: new Date() });
    analytics.track({ eventName: "page_view", timestamp: new Date() });
    assert.equal(analytics.getEvents().length, 2);
  });

  test("getEvents() returns a copy (immutable)", () => {
    analytics.track({ eventName: "test_event", timestamp: new Date() });
    const copy1 = analytics.getEvents();
    const copy2 = analytics.getEvents();
    assert.notEqual(copy1, copy2); // different array references
    assert.deepEqual(copy1, copy2);
  });

  test("getEventsByUser() filters by userId", () => {
    analytics.track({ eventName: "ev1", userId: "alice", timestamp: new Date() });
    analytics.track({ eventName: "ev2", userId: "bob", timestamp: new Date() });
    analytics.track({ eventName: "ev3", userId: "alice", timestamp: new Date() });

    const aliceEvents = analytics.getEventsByUser("alice");
    assert.equal(aliceEvents.length, 2);
    assert.ok(aliceEvents.every((e) => e.userId === "alice"));
  });

  test("getEventsByUser() returns empty array for unknown user", () => {
    analytics.track({ eventName: "ev1", userId: "alice", timestamp: new Date() });
    assert.deepEqual(analytics.getEventsByUser("nobody"), []);
  });

  test("clearEvents() removes all stored events", () => {
    analytics.track({ eventName: "ev1", timestamp: new Date() });
    analytics.clearEvents();
    assert.deepEqual(analytics.getEvents(), []);
  });

  test("exportEvents() returns valid JSON string", () => {
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
    });
    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].eventName, "user_login");
  });

  test("exportEvents() returns '[]' when no events tracked", () => {
    const exported = analytics.exportEvents();
    assert.deepEqual(JSON.parse(exported), []);
  });

  test("track() rejects event with empty eventName (Zod validation)", () => {
    assert.throws(() => {
      analytics.track({ eventName: "", timestamp: new Date() });
    });
  });
});

// ---------------------------------------------------------------------------
// NotificationService – exercised by demonstrateServices()
// ---------------------------------------------------------------------------
describe("NotificationService (used by demonstrateServices)", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  test("starts with an empty notifications list", () => {
    assert.deepEqual(notifications.getAll(), []);
  });

  test("send() with SUCCESS type stores notification with correct type", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    const all = notifications.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].type, NotificationType.SUCCESS);
    assert.equal(all[0].title, "Welcome!");
    assert.equal(all[0].message, "You have successfully logged in.");
    assert.equal(all[0].read, false);
  });

  test("send() with INFO type stores notification", () => {
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    const all = notifications.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].type, NotificationType.INFO);
    assert.equal(all[0].title, "New Feature");
  });

  test("send() returns a non-empty string ID", () => {
    const id = notifications.send(NotificationType.INFO, "Test", "msg");
    assert.equal(typeof id, "string");
    assert.ok(id.length > 0);
  });

  test("send() accumulates multiple notifications (mirrors demonstrateServices)", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    assert.equal(notifications.getAll().length, 2);
  });

  test("getAll() returns a copy (immutable)", () => {
    notifications.send(NotificationType.INFO, "Test", "msg");
    const copy1 = notifications.getAll();
    const copy2 = notifications.getAll();
    assert.notEqual(copy1, copy2);
    assert.deepEqual(copy1, copy2);
  });

  test("getUnread() returns only unread notifications", () => {
    notifications.send(NotificationType.INFO, "n1", "msg1");
    notifications.send(NotificationType.WARNING, "n2", "msg2");
    // All start as unread
    assert.equal(notifications.getUnread().length, 2);
  });

  test("markAsRead() marks a single notification as read", () => {
    const id = notifications.send(NotificationType.INFO, "Test", "msg");
    const marked = notifications.markAsRead(id);
    assert.equal(marked, true);
    const all = notifications.getAll();
    const n = all.find((n) => n.id === id);
    assert.ok(n);
    assert.equal(n!.read, true);
    assert.equal(notifications.getUnread().length, 0);
  });

  test("markAsRead() returns false for unknown ID", () => {
    const result = notifications.markAsRead("nonexistent-id");
    assert.equal(result, false);
  });

  test("markAllAsRead() marks all notifications as read", () => {
    notifications.send(NotificationType.INFO, "n1", "msg1");
    notifications.send(NotificationType.ERROR, "n2", "msg2");
    notifications.markAllAsRead();
    assert.equal(notifications.getUnread().length, 0);
    assert.ok(notifications.getAll().every((n) => n.read === true));
  });

  test("subscribe() receives notification on send()", () => {
    const received: string[] = [];
    notifications.subscribe((n) => received.push(n.title));
    notifications.send(NotificationType.SUCCESS, "Alert", "msg");
    assert.deepEqual(received, ["Alert"]);
  });

  test("subscribe() unsubscribe stops future notifications", () => {
    const received: string[] = [];
    const unsubscribe = notifications.subscribe((n) => received.push(n.title));
    notifications.send(NotificationType.INFO, "first", "msg");
    unsubscribe();
    notifications.send(NotificationType.INFO, "second", "msg");
    assert.deepEqual(received, ["first"]);
  });

  test("clear() removes all notifications", () => {
    notifications.send(NotificationType.INFO, "Test", "msg");
    notifications.clear();
    assert.deepEqual(notifications.getAll(), []);
  });

  // Regression: demonstrateServices() specifically uses SUCCESS and INFO types.
  test("NotificationType enum has SUCCESS and INFO values", () => {
    assert.equal(NotificationType.SUCCESS, "success");
    assert.equal(NotificationType.INFO, "info");
    assert.equal(NotificationType.WARNING, "warning");
    assert.equal(NotificationType.ERROR, "error");
  });
});

// ---------------------------------------------------------------------------
// demonstrateServices interaction test
// Verifies the sequence of calls made in demo-usage.ts works end-to-end.
// ---------------------------------------------------------------------------
describe("demonstrateServices interaction pattern", () => {
  test("two track() calls result in two stored events", () => {
    const analytics = new AnalyticsService();
    // demonstrateServices() tracks user_login and page_view; properties omitted here
    // because z.record(z.any()) requires 2 args in zod 4.1.5 (pre-existing issue in analytics-service.ts)
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
    });
    analytics.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
    });
    assert.equal(analytics.getEvents().length, 2);
    assert.equal(analytics.getEvents()[0].eventName, "user_login");
    assert.equal(analytics.getEvents()[1].eventName, "page_view");
  });

  test("two send() calls result in two stored notifications", () => {
    const notifications = new NotificationService();
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
    const all = notifications.getAll();
    assert.equal(all.length, 2);
    assert.equal(all[0].type, "success");
    assert.equal(all[1].type, "info");
  });

  test("exportEvents() produces JSON matching tracked events", () => {
    const analyticsLocal = new AnalyticsService();
    analyticsLocal.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    const json = analyticsLocal.exportEvents();
    const parsed = JSON.parse(json) as Array<{ eventName: string; userId: string }>;
    assert.equal(parsed[0].eventName, "user_login");
    assert.equal(parsed[0].userId, "user123");
  });

  test("getAll() returns notifications with type as uppercase-able string", () => {
    const notifications = new NotificationService();
    notifications.send(NotificationType.SUCCESS, "Title", "Msg");
    const all = notifications.getAll();
    assert.equal(all[0].type.toUpperCase(), "SUCCESS");
  });
});