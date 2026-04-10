/**
 * Tests for demo-usage.ts — demonstrateServices()
 *
 * This is a NEW file added in this PR. It wires together AnalyticsService and
 * NotificationService from @coderabbit-test/shared-services to demonstrate usage.
 *
 * Run (from repo root after `npm install`):
 *   node --experimental-strip-types demo-usage.test.ts
 *
 * Alternatively, build the shared-services package first:
 *   cd packages/shared-services && npm install && npm run build && cd ../..
 *   npm install
 *   node --experimental-strip-types demo-usage.test.ts
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Import services directly to set up independent test state
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

// Import the function under test
import { demonstrateServices } from "./demo-usage.ts";

// ---------------------------------------------------------------------------
// demonstrateServices() – smoke tests
// ---------------------------------------------------------------------------

describe("demonstrateServices()", () => {
  const consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs.length = 0;
    console.log = (...args: unknown[]) => {
      consoleLogs.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  test("executes without throwing", () => {
    assert.doesNotThrow(() => demonstrateServices());
  });

  test("logs the expected header line", () => {
    demonstrateServices();
    const hasHeader = consoleLogs.some((line) =>
      line.includes("Demonstrating Internal Package Services")
    );
    assert.equal(hasHeader, true);
  });

  test("logs the analytics events section header", () => {
    demonstrateServices();
    const hasAnalyticsHeader = consoleLogs.some((line) =>
      line.includes("Analytics Events")
    );
    assert.equal(hasAnalyticsHeader, true);
  });

  test("logs the notifications section header", () => {
    demonstrateServices();
    const hasNotificationsHeader = consoleLogs.some((line) =>
      line.includes("Notifications")
    );
    assert.equal(hasNotificationsHeader, true);
  });

  test("logs the completion message", () => {
    demonstrateServices();
    const hasCompletion = consoleLogs.some((line) =>
      line.includes("Service Recognition Test Complete")
    );
    assert.equal(hasCompletion, true);
  });

  test("can be called multiple times without error", () => {
    assert.doesNotThrow(() => {
      demonstrateServices();
      demonstrateServices();
    });
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService – unit tests for functionality used by demonstrateServices
// ---------------------------------------------------------------------------

describe("AnalyticsService (used by demonstrateServices)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    // suppress console output during tests
    console.log = () => {};
  });

  afterEach(() => {
    console.log = console.log; // restore (noop here; real restore in parent)
  });

  test("track() adds an event retrievable via getEvents()", () => {
    analytics.track({ eventName: "user_login", userId: "u1", timestamp: new Date() });
    const events = analytics.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "user_login");
  });

  test("track() accepts an event without userId", () => {
    assert.doesNotThrow(() =>
      analytics.track({ eventName: "anon_page_view", timestamp: new Date() })
    );
  });

  test("track() accepts events with arbitrary properties", () => {
    assert.doesNotThrow(() =>
      analytics.track({
        eventName: "page_view",
        userId: "u2",
        timestamp: new Date(),
        properties: { page: "/dashboard", referrer: "/login" },
      })
    );
  });

  test("getEvents() returns a copy (immutable snapshot)", () => {
    analytics.track({ eventName: "evt", timestamp: new Date() });
    const snapshot = analytics.getEvents();
    snapshot.push({ eventName: "injected", timestamp: new Date() });
    assert.equal(analytics.getEvents().length, 1);
  });

  test("getEventsByUser() filters by userId", () => {
    analytics.track({ eventName: "e1", userId: "alice", timestamp: new Date() });
    analytics.track({ eventName: "e2", userId: "bob", timestamp: new Date() });
    analytics.track({ eventName: "e3", userId: "alice", timestamp: new Date() });
    const aliceEvents = analytics.getEventsByUser("alice");
    assert.equal(aliceEvents.length, 2);
    assert.ok(aliceEvents.every((e) => e.userId === "alice"));
  });

  test("getEventsByUser() returns empty array for unknown userId", () => {
    analytics.track({ eventName: "e1", userId: "alice", timestamp: new Date() });
    assert.deepEqual(analytics.getEventsByUser("unknown"), []);
  });

  test("clearEvents() empties the events list", () => {
    analytics.track({ eventName: "e1", timestamp: new Date() });
    analytics.clearEvents();
    assert.equal(analytics.getEvents().length, 0);
  });

  test("exportEvents() returns valid JSON string", () => {
    analytics.track({ eventName: "export_test", timestamp: new Date() });
    const json = analytics.exportEvents();
    assert.doesNotThrow(() => JSON.parse(json));
    const parsed = JSON.parse(json);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].eventName, "export_test");
  });

  test("exportEvents() returns empty array JSON when no events", () => {
    const json = analytics.exportEvents();
    assert.equal(JSON.parse(json).length, 0);
  });

  test("track() throws for an event with empty eventName", () => {
    assert.throws(() =>
      analytics.track({ eventName: "", timestamp: new Date() })
    );
  });
});

// ---------------------------------------------------------------------------
// NotificationService – unit tests for functionality used by demonstrateServices
// ---------------------------------------------------------------------------

describe("NotificationService (used by demonstrateServices)", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    console.log = () => {};
  });

  test("send() returns a non-empty string id", () => {
    const id = notifications.send(NotificationType.SUCCESS, "Title", "Msg");
    assert.equal(typeof id, "string");
    assert.ok(id.length > 0);
  });

  test("send() stores the notification retrievable via getAll()", () => {
    notifications.send(NotificationType.INFO, "Hello", "World");
    const all = notifications.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].type, NotificationType.INFO);
    assert.equal(all[0].title, "Hello");
    assert.equal(all[0].message, "World");
  });

  test("send() creates notifications with read=false by default", () => {
    notifications.send(NotificationType.WARNING, "Warn", "Watch out");
    const all = notifications.getAll();
    assert.equal(all[0].read, false);
  });

  test("getAll() returns a copy (immutable snapshot)", () => {
    notifications.send(NotificationType.ERROR, "E", "M");
    const snap = notifications.getAll();
    snap.push({ id: "fake", type: NotificationType.INFO, title: "x", message: "y", timestamp: new Date(), read: false });
    assert.equal(notifications.getAll().length, 1);
  });

  test("getUnread() returns only unread notifications", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    notifications.send(NotificationType.SUCCESS, "B", "2");
    assert.equal(notifications.getUnread().length, 2);
  });

  test("markAsRead() marks the notification as read and returns true", () => {
    const id = notifications.send(NotificationType.INFO, "T", "M");
    const result = notifications.markAsRead(id);
    assert.equal(result, true);
    const all = notifications.getAll();
    assert.equal(all[0].read, true);
  });

  test("markAsRead() returns false for unknown id", () => {
    assert.equal(notifications.markAsRead("nonexistent-id"), false);
  });

  test("markAllAsRead() marks every notification as read", () => {
    notifications.send(NotificationType.INFO, "A", "1");
    notifications.send(NotificationType.WARNING, "B", "2");
    notifications.markAllAsRead();
    const unread = notifications.getUnread();
    assert.equal(unread.length, 0);
  });

  test("subscribe() listener is called when a notification is sent", () => {
    const received: string[] = [];
    notifications.subscribe((n) => received.push(n.type));
    notifications.send(NotificationType.SUCCESS, "S", "M");
    assert.equal(received.length, 1);
    assert.equal(received[0], NotificationType.SUCCESS);
  });

  test("subscribe() unsubscribe function stops future calls", () => {
    const received: string[] = [];
    const unsubscribe = notifications.subscribe((n) => received.push(n.type));
    notifications.send(NotificationType.INFO, "A", "1");
    unsubscribe();
    notifications.send(NotificationType.INFO, "B", "2");
    assert.equal(received.length, 1);
  });

  test("clear() empties all notifications", () => {
    notifications.send(NotificationType.ERROR, "E", "Msg");
    notifications.clear();
    assert.equal(notifications.getAll().length, 0);
  });

  test("send() accepts all NotificationType values", () => {
    const types = [
      NotificationType.INFO,
      NotificationType.WARNING,
      NotificationType.ERROR,
      NotificationType.SUCCESS,
    ];
    for (const t of types) {
      assert.doesNotThrow(() => notifications.send(t, "title", "message"));
    }
    assert.equal(notifications.getAll().length, types.length);
  });
});