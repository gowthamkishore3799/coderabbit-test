/**
 * Tests for NotificationService
 *
 * The NotificationService is exercised by demo-usage.ts which was added in this PR.
 *
 * Run (after npm install in packages/shared-services/):
 *   node --experimental-strip-types --test packages/shared-services/src/__tests__/notification-service.test.ts
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NotificationService, NotificationType } from "../notification-service.js";
import type { Notification } from "../notification-service.js";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  // -------------------------------------------------------------------------
  // send()
  // -------------------------------------------------------------------------
  describe("send()", () => {
    it("returns a non-empty string ID", () => {
      const id = service.send(NotificationType.INFO, "Title", "Message");
      assert.equal(typeof id, "string");
      assert.ok(id.length > 0);
    });

    it("stores the sent notification so getAll() returns it", () => {
      service.send(NotificationType.SUCCESS, "Welcome!", "You are in.");
      const all = service.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].title, "Welcome!");
      assert.equal(all[0].message, "You are in.");
      assert.equal(all[0].type, NotificationType.SUCCESS);
    });

    it("new notifications are unread by default", () => {
      service.send(NotificationType.WARNING, "Heads up", "Something happened");
      const all = service.getAll();
      assert.equal(all[0].read, false);
    });

    it("sends all four notification types without error", () => {
      assert.doesNotThrow(() => {
        service.send(NotificationType.INFO, "I", "m");
        service.send(NotificationType.WARNING, "W", "m");
        service.send(NotificationType.ERROR, "E", "m");
        service.send(NotificationType.SUCCESS, "S", "m");
      });
      assert.equal(service.getAll().length, 4);
    });

    it("each call generates a unique ID", () => {
      const id1 = service.send(NotificationType.INFO, "A", "a");
      const id2 = service.send(NotificationType.INFO, "B", "b");
      assert.notEqual(id1, id2);
    });

    it("fires registered listeners with the new notification", () => {
      const received: Notification[] = [];
      service.subscribe((n) => received.push(n));
      service.send(NotificationType.INFO, "Ping", "body");
      assert.equal(received.length, 1);
      assert.equal(received[0].title, "Ping");
    });
  });

  // -------------------------------------------------------------------------
  // getAll()
  // -------------------------------------------------------------------------
  describe("getAll()", () => {
    it("returns an empty array when no notifications exist", () => {
      assert.deepEqual(service.getAll(), []);
    });

    it("returns a copy — mutating it does not affect internal state", () => {
      service.send(NotificationType.INFO, "T", "m");
      const copy = service.getAll();
      copy.pop();
      assert.equal(service.getAll().length, 1);
    });

    it("returns notifications in insertion order", () => {
      service.send(NotificationType.INFO, "First", "1");
      service.send(NotificationType.SUCCESS, "Second", "2");
      const all = service.getAll();
      assert.equal(all[0].title, "First");
      assert.equal(all[1].title, "Second");
    });
  });

  // -------------------------------------------------------------------------
  // getUnread()
  // -------------------------------------------------------------------------
  describe("getUnread()", () => {
    it("returns all notifications when none have been read", () => {
      service.send(NotificationType.INFO, "A", "a");
      service.send(NotificationType.INFO, "B", "b");
      assert.equal(service.getUnread().length, 2);
    });

    it("excludes notifications that have been marked as read", () => {
      const id = service.send(NotificationType.INFO, "Read me", "body");
      service.markAsRead(id);
      assert.equal(service.getUnread().length, 0);
    });

    it("returns an empty array when no notifications exist", () => {
      assert.deepEqual(service.getUnread(), []);
    });

    it("only returns unread after partial read", () => {
      const id1 = service.send(NotificationType.INFO, "Read", "r");
      service.send(NotificationType.INFO, "Unread", "u");
      service.markAsRead(id1);
      const unread = service.getUnread();
      assert.equal(unread.length, 1);
      assert.equal(unread[0].title, "Unread");
    });
  });

  // -------------------------------------------------------------------------
  // markAsRead()
  // -------------------------------------------------------------------------
  describe("markAsRead()", () => {
    it("returns true when the notification exists", () => {
      const id = service.send(NotificationType.INFO, "T", "m");
      assert.equal(service.markAsRead(id), true);
    });

    it("marks the notification as read", () => {
      const id = service.send(NotificationType.INFO, "T", "m");
      service.markAsRead(id);
      const all = service.getAll();
      assert.equal(all[0].read, true);
    });

    it("returns false for an unknown ID", () => {
      assert.equal(service.markAsRead("nonexistent-id"), false);
    });

    it("calling markAsRead twice on the same ID returns true both times", () => {
      const id = service.send(NotificationType.INFO, "T", "m");
      assert.equal(service.markAsRead(id), true);
      assert.equal(service.markAsRead(id), true);
    });
  });

  // -------------------------------------------------------------------------
  // markAllAsRead()
  // -------------------------------------------------------------------------
  describe("markAllAsRead()", () => {
    it("marks all notifications as read", () => {
      service.send(NotificationType.INFO, "A", "a");
      service.send(NotificationType.WARNING, "B", "b");
      service.markAllAsRead();
      assert.equal(service.getUnread().length, 0);
      assert.ok(service.getAll().every((n) => n.read));
    });

    it("can be called safely when there are no notifications", () => {
      assert.doesNotThrow(() => service.markAllAsRead());
    });
  });

  // -------------------------------------------------------------------------
  // subscribe() / unsubscribe
  // -------------------------------------------------------------------------
  describe("subscribe()", () => {
    it("listener is called when a notification is sent", () => {
      let called = false;
      service.subscribe(() => { called = true; });
      service.send(NotificationType.INFO, "T", "m");
      assert.equal(called, true);
    });

    it("listener receives the correct notification object", () => {
      let received: Notification | null = null;
      service.subscribe((n) => { received = n; });
      service.send(NotificationType.ERROR, "Error Title", "Error body");
      assert.ok(received !== null);
      assert.equal((received as Notification).title, "Error Title");
      assert.equal((received as Notification).type, NotificationType.ERROR);
    });

    it("multiple listeners are all called", () => {
      const calls: number[] = [];
      service.subscribe(() => calls.push(1));
      service.subscribe(() => calls.push(2));
      service.send(NotificationType.INFO, "T", "m");
      assert.deepEqual(calls.sort(), [1, 2]);
    });

    it("unsubscribed listener is no longer called", () => {
      let count = 0;
      const unsubscribe = service.subscribe(() => count++);
      service.send(NotificationType.INFO, "T", "m");
      unsubscribe();
      service.send(NotificationType.INFO, "T2", "m2");
      assert.equal(count, 1);
    });

    it("calling unsubscribe twice does not throw", () => {
      const unsubscribe = service.subscribe(() => {});
      unsubscribe();
      assert.doesNotThrow(() => unsubscribe());
    });
  });

  // -------------------------------------------------------------------------
  // clear()
  // -------------------------------------------------------------------------
  describe("clear()", () => {
    it("removes all notifications", () => {
      service.send(NotificationType.INFO, "A", "a");
      service.send(NotificationType.INFO, "B", "b");
      service.clear();
      assert.deepEqual(service.getAll(), []);
    });

    it("can be called on an empty service without error", () => {
      assert.doesNotThrow(() => service.clear());
    });

    it("allows sending new notifications after clearing", () => {
      service.send(NotificationType.INFO, "Old", "o");
      service.clear();
      service.send(NotificationType.SUCCESS, "New", "n");
      const all = service.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].title, "New");
    });
  });
});