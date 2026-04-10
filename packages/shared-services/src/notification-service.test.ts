/**
 * Tests for packages/shared-services/src/notification-service.ts
 *
 * Run with:
 *   npx tsx --test packages/shared-services/src/notification-service.test.ts
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  NotificationService,
  NotificationType,
  NotificationSchema,
  type Notification,
} from "./notification-service.js";

// ---------------------------------------------------------------------------
// NotificationSchema validation
// ---------------------------------------------------------------------------

describe("NotificationSchema", () => {
  function validNotification(): Notification {
    return {
      id: "abc123",
      type: NotificationType.INFO,
      title: "Test Title",
      message: "Test message",
      timestamp: new Date(),
      read: false,
    };
  }

  it("accepts a valid notification", () => {
    const result = NotificationSchema.safeParse(validNotification());
    assert.equal(result.success, true);
  });

  it("rejects a notification with empty title", () => {
    const result = NotificationSchema.safeParse({ ...validNotification(), title: "" });
    assert.equal(result.success, false);
  });

  it("rejects a notification with empty message", () => {
    const result = NotificationSchema.safeParse({ ...validNotification(), message: "" });
    assert.equal(result.success, false);
  });

  it("rejects a notification with an invalid type", () => {
    const result = NotificationSchema.safeParse({ ...validNotification(), type: "unknown" });
    assert.equal(result.success, false);
  });

  it("accepts all valid NotificationType enum values", () => {
    for (const type of Object.values(NotificationType)) {
      const result = NotificationSchema.safeParse({ ...validNotification(), type });
      assert.equal(result.success, true, `type '${type}' should be valid`);
    }
  });
});

// ---------------------------------------------------------------------------
// NotificationType enum
// ---------------------------------------------------------------------------

describe("NotificationType enum", () => {
  it("has INFO value", () => {
    assert.equal(NotificationType.INFO, "info");
  });

  it("has WARNING value", () => {
    assert.equal(NotificationType.WARNING, "warning");
  });

  it("has ERROR value", () => {
    assert.equal(NotificationType.ERROR, "error");
  });

  it("has SUCCESS value", () => {
    assert.equal(NotificationType.SUCCESS, "success");
  });
});

// ---------------------------------------------------------------------------
// NotificationService — send()
// ---------------------------------------------------------------------------

describe("NotificationService.send()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("returns a non-empty string id", () => {
    const id = service.send(NotificationType.INFO, "Title", "Message");
    assert.equal(typeof id, "string");
    assert.ok(id.length > 0);
  });

  it("stores the sent notification", () => {
    service.send(NotificationType.SUCCESS, "Saved", "Data saved.");
    assert.equal(service.getAll().length, 1);
  });

  it("stores the correct notification type", () => {
    service.send(NotificationType.ERROR, "Oops", "Something went wrong.");
    const notif = service.getAll()[0];
    assert.equal(notif.type, NotificationType.ERROR);
  });

  it("stores the correct title and message", () => {
    service.send(NotificationType.WARNING, "Watch out", "Careful here.");
    const notif = service.getAll()[0];
    assert.equal(notif.title, "Watch out");
    assert.equal(notif.message, "Careful here.");
  });

  it("notification is initially unread", () => {
    service.send(NotificationType.INFO, "Hello", "World");
    const notif = service.getAll()[0];
    assert.equal(notif.read, false);
  });

  it("notification has a timestamp", () => {
    service.send(NotificationType.INFO, "Hi", "There");
    const notif = service.getAll()[0];
    assert.ok(notif.timestamp instanceof Date);
  });

  it("returns unique ids for multiple sends", () => {
    const id1 = service.send(NotificationType.INFO, "A", "first");
    const id2 = service.send(NotificationType.INFO, "B", "second");
    assert.notEqual(id1, id2);
  });

  it("multiple notifications are stored independently", () => {
    service.send(NotificationType.INFO, "One", "first");
    service.send(NotificationType.ERROR, "Two", "second");
    assert.equal(service.getAll().length, 2);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — getAll()
// ---------------------------------------------------------------------------

describe("NotificationService.getAll()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("returns an empty array when no notifications sent", () => {
    assert.deepEqual(service.getAll(), []);
  });

  it("returns a copy — mutations do not affect internal state", () => {
    service.send(NotificationType.INFO, "T", "M");
    const copy = service.getAll();
    copy.push({
      id: "fake",
      type: NotificationType.INFO,
      title: "fake",
      message: "fake",
      timestamp: new Date(),
      read: false,
    });
    assert.equal(service.getAll().length, 1);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — getUnread()
// ---------------------------------------------------------------------------

describe("NotificationService.getUnread()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("returns all notifications when none are read", () => {
    service.send(NotificationType.INFO, "A", "first");
    service.send(NotificationType.INFO, "B", "second");
    assert.equal(service.getUnread().length, 2);
  });

  it("returns only unread notifications after marking one as read", () => {
    const id = service.send(NotificationType.INFO, "A", "first");
    service.send(NotificationType.INFO, "B", "second");
    service.markAsRead(id);
    assert.equal(service.getUnread().length, 1);
  });

  it("returns empty array when all notifications are read", () => {
    const id1 = service.send(NotificationType.INFO, "A", "msg");
    const id2 = service.send(NotificationType.INFO, "B", "msg");
    service.markAsRead(id1);
    service.markAsRead(id2);
    assert.equal(service.getUnread().length, 0);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — markAsRead()
// ---------------------------------------------------------------------------

describe("NotificationService.markAsRead()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("returns true and marks the notification as read", () => {
    const id = service.send(NotificationType.INFO, "T", "M");
    const result = service.markAsRead(id);
    assert.equal(result, true);
    const notif = service.getAll().find((n) => n.id === id);
    assert.equal(notif?.read, true);
  });

  it("returns false for a non-existent id", () => {
    const result = service.markAsRead("no-such-id");
    assert.equal(result, false);
  });

  it("does not affect other notifications", () => {
    const id1 = service.send(NotificationType.INFO, "A", "msg");
    service.send(NotificationType.INFO, "B", "msg");
    service.markAsRead(id1);
    const unread = service.getUnread();
    assert.equal(unread.length, 1);
    assert.equal(unread[0].title, "B");
  });
});

// ---------------------------------------------------------------------------
// NotificationService — markAllAsRead()
// ---------------------------------------------------------------------------

describe("NotificationService.markAllAsRead()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("marks all notifications as read", () => {
    service.send(NotificationType.INFO, "A", "first");
    service.send(NotificationType.ERROR, "B", "second");
    service.markAllAsRead();
    assert.ok(service.getAll().every((n) => n.read === true));
  });

  it("is safe to call on an empty service", () => {
    assert.doesNotThrow(() => service.markAllAsRead());
  });

  it("getUnread() returns empty after markAllAsRead()", () => {
    service.send(NotificationType.WARNING, "X", "msg");
    service.markAllAsRead();
    assert.equal(service.getUnread().length, 0);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — subscribe()
// ---------------------------------------------------------------------------

describe("NotificationService.subscribe()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("calls the listener when a notification is sent", () => {
    let received: Notification | null = null;
    service.subscribe((n) => { received = n; });
    service.send(NotificationType.SUCCESS, "Sub Title", "Sub Message");
    assert.notEqual(received, null);
    assert.equal((received as unknown as Notification).type, NotificationType.SUCCESS);
  });

  it("unsubscribing stops the listener from receiving new notifications", () => {
    let callCount = 0;
    const unsubscribe = service.subscribe(() => { callCount++; });
    service.send(NotificationType.INFO, "T1", "M1");
    unsubscribe();
    service.send(NotificationType.INFO, "T2", "M2");
    assert.equal(callCount, 1);
  });

  it("multiple listeners all receive the notification", () => {
    let count = 0;
    service.subscribe(() => { count++; });
    service.subscribe(() => { count++; });
    service.send(NotificationType.INFO, "T", "M");
    assert.equal(count, 2);
  });

  it("unsubscribing one does not affect other listeners", () => {
    let countA = 0;
    let countB = 0;
    const unsubA = service.subscribe(() => { countA++; });
    service.subscribe(() => { countB++; });
    unsubA();
    service.send(NotificationType.INFO, "T", "M");
    assert.equal(countA, 0);
    assert.equal(countB, 1);
  });
});

// ---------------------------------------------------------------------------
// NotificationService — clear()
// ---------------------------------------------------------------------------

describe("NotificationService.clear()", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("removes all notifications", () => {
    service.send(NotificationType.INFO, "A", "first");
    service.send(NotificationType.INFO, "B", "second");
    service.clear();
    assert.deepEqual(service.getAll(), []);
  });

  it("is safe to call on an empty service", () => {
    assert.doesNotThrow(() => service.clear());
  });

  it("allows sending new notifications after clear", () => {
    service.send(NotificationType.INFO, "Before", "clear");
    service.clear();
    service.send(NotificationType.SUCCESS, "After", "clear");
    assert.equal(service.getAll().length, 1);
    assert.equal(service.getAll()[0].title, "After");
  });
});