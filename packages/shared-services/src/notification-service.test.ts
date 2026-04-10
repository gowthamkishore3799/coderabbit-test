// Tests for notification-service.ts
// These are tested as part of coverage for demo-usage.ts which depends on NotificationService

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationService, NotificationType, type Notification } from "./notification-service";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe("send()", () => {
    it("sends a SUCCESS notification and returns an id string", () => {
      const id = service.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("sends an INFO notification", () => {
      service.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");
      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.INFO);
      expect(all[0].title).toBe("New Feature");
    });

    it("sends a WARNING notification", () => {
      service.send(NotificationType.WARNING, "Low Storage", "Your storage is almost full.");
      const all = service.getAll();
      expect(all[0].type).toBe(NotificationType.WARNING);
    });

    it("sends an ERROR notification", () => {
      service.send(NotificationType.ERROR, "Upload Failed", "Failed to upload file.");
      const all = service.getAll();
      expect(all[0].type).toBe(NotificationType.ERROR);
    });

    it("creates notification with read=false by default", () => {
      service.send(NotificationType.INFO, "Title", "Message");
      const all = service.getAll();
      expect(all[0].read).toBe(false);
    });

    it("creates notification with a timestamp", () => {
      const before = new Date();
      service.send(NotificationType.SUCCESS, "T", "M");
      const after = new Date();
      const all = service.getAll();
      expect(all[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(all[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("generates unique ids for each notification", () => {
      const id1 = service.send(NotificationType.INFO, "T1", "M1");
      const id2 = service.send(NotificationType.INFO, "T2", "M2");
      expect(id1).not.toBe(id2);
    });

    it("accumulates multiple notifications", () => {
      service.send(NotificationType.SUCCESS, "Title1", "Message1");
      service.send(NotificationType.INFO, "Title2", "Message2");
      expect(service.getAll()).toHaveLength(2);
    });
  });

  describe("getAll()", () => {
    it("returns empty array initially", () => {
      expect(service.getAll()).toEqual([]);
    });

    it("returns all sent notifications", () => {
      service.send(NotificationType.SUCCESS, "S", "M");
      service.send(NotificationType.ERROR, "E", "M");
      const all = service.getAll();
      expect(all).toHaveLength(2);
    });

    it("returns a copy (not a reference to internal array)", () => {
      service.send(NotificationType.INFO, "T", "M");
      const all1 = service.getAll();
      const all2 = service.getAll();
      expect(all1).not.toBe(all2);
    });

    it("does not allow external mutation of notifications list", () => {
      service.send(NotificationType.INFO, "T", "M");
      const all = service.getAll();
      all.pop();
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe("getUnread()", () => {
    it("returns all notifications as unread initially", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      expect(service.getUnread()).toHaveLength(2);
    });

    it("returns empty array when all are read", () => {
      service.send(NotificationType.INFO, "T", "M");
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
    });

    it("excludes read notifications", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      const id2 = service.send(NotificationType.INFO, "T2", "M2");
      service.markAsRead(id2);
      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].title).toBe("T1");
    });
  });

  describe("markAsRead()", () => {
    it("marks a notification as read and returns true", () => {
      const id = service.send(NotificationType.INFO, "T", "M");
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      const all = service.getAll();
      expect(all[0].read).toBe(true);
    });

    it("returns false for unknown id", () => {
      const result = service.markAsRead("non-existent-id");
      expect(result).toBe(false);
    });

    it("does not affect other notifications when marking one as read", () => {
      const id1 = service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      service.markAsRead(id1);
      const all = service.getAll();
      expect(all.find((n) => n.id === id1)?.read).toBe(true);
      expect(all.find((n) => n.title === "T2")?.read).toBe(false);
    });
  });

  describe("markAllAsRead()", () => {
    it("marks all notifications as read", () => {
      service.send(NotificationType.SUCCESS, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      service.send(NotificationType.WARNING, "T3", "M3");
      service.markAllAsRead();
      expect(service.getAll().every((n) => n.read)).toBe(true);
    });

    it("has no effect when there are no notifications", () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe("subscribe()", () => {
    it("calls listener when a notification is sent", () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.SUCCESS, "T", "M");
      expect(listener).toHaveBeenCalledOnce();
    });

    it("passes the notification object to the listener", () => {
      let received: Notification | null = null;
      service.subscribe((n) => { received = n; });
      service.send(NotificationType.ERROR, "Error Title", "Error message");
      expect(received).not.toBeNull();
      expect((received as unknown as Notification).type).toBe(NotificationType.ERROR);
      expect((received as unknown as Notification).title).toBe("Error Title");
    });

    it("returns an unsubscribe function that stops the listener", () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.INFO, "T", "M");
      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple listeners", () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      service.subscribe(l1);
      service.subscribe(l2);
      service.send(NotificationType.INFO, "T", "M");
      expect(l1).toHaveBeenCalledOnce();
      expect(l2).toHaveBeenCalledOnce();
    });

    it("only unsubscribes the specific listener", () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      const unsub1 = service.subscribe(l1);
      service.subscribe(l2);
      unsub1();
      service.send(NotificationType.INFO, "T", "M");
      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalledOnce();
    });
  });

  describe("clear()", () => {
    it("removes all notifications", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it("allows sending new notifications after clearing", () => {
      service.send(NotificationType.INFO, "Old", "M");
      service.clear();
      service.send(NotificationType.SUCCESS, "New", "M");
      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].title).toBe("New");
    });
  });

  describe("NotificationType enum", () => {
    it("has correct string values", () => {
      expect(NotificationType.INFO).toBe("info");
      expect(NotificationType.WARNING).toBe("warning");
      expect(NotificationType.ERROR).toBe("error");
      expect(NotificationType.SUCCESS).toBe("success");
    });
  });
});