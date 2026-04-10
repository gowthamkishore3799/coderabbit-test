import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationService, NotificationType } from "./notification-service";
import type { Notification } from "./notification-service";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe("send()", () => {
    it("sends a SUCCESS notification and returns an id string", () => {
      const id = service.send(NotificationType.SUCCESS, "Done", "Operation completed.");
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("sends an INFO notification", () => {
      service.send(NotificationType.INFO, "Info", "Heads up!");
      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.INFO);
    });

    it("sends a WARNING notification", () => {
      service.send(NotificationType.WARNING, "Warning", "Be careful.");
      const all = service.getAll();
      expect(all[0].type).toBe(NotificationType.WARNING);
    });

    it("sends an ERROR notification", () => {
      service.send(NotificationType.ERROR, "Error", "Something failed.");
      const all = service.getAll();
      expect(all[0].type).toBe(NotificationType.ERROR);
    });

    it("stores notifications with read=false by default", () => {
      service.send(NotificationType.INFO, "Test", "Test message");
      expect(service.getAll()[0].read).toBe(false);
    });

    it("stores the correct title and message", () => {
      service.send(NotificationType.SUCCESS, "My Title", "My Message");
      const n = service.getAll()[0];
      expect(n.title).toBe("My Title");
      expect(n.message).toBe("My Message");
    });

    it("logs the notification to console", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      service.send(NotificationType.SUCCESS, "Log Test", "Check log");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Log Test"));
      consoleSpy.mockRestore();
    });

    it("sends multiple notifications with unique ids", () => {
      const id1 = service.send(NotificationType.INFO, "T1", "M1");
      const id2 = service.send(NotificationType.INFO, "T2", "M2");
      expect(id1).not.toBe(id2);
    });

    it("stores a timestamp for each notification", () => {
      const before = new Date();
      service.send(NotificationType.INFO, "T", "M");
      const after = new Date();
      const ts = service.getAll()[0].timestamp;
      expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("getAll()", () => {
    it("returns empty array when no notifications have been sent", () => {
      expect(service.getAll()).toEqual([]);
    });

    it("returns all sent notifications in order", () => {
      service.send(NotificationType.INFO, "First", "M1");
      service.send(NotificationType.SUCCESS, "Second", "M2");
      const all = service.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].title).toBe("First");
      expect(all[1].title).toBe("Second");
    });

    it("returns a copy (not a reference to the internal array)", () => {
      service.send(NotificationType.INFO, "T", "M");
      const a = service.getAll();
      const b = service.getAll();
      expect(a).not.toBe(b);
    });
  });

  describe("getUnread()", () => {
    it("returns all notifications as unread initially", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      expect(service.getUnread()).toHaveLength(2);
    });

    it("excludes read notifications", () => {
      const id = service.send(NotificationType.INFO, "T", "M");
      service.markAsRead(id);
      expect(service.getUnread()).toHaveLength(0);
    });

    it("returns only the unread notifications when some are read", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      const id2 = service.send(NotificationType.INFO, "T2", "M2");
      service.markAsRead(id2);
      const unread = service.getUnread();
      expect(unread).toHaveLength(1);
      expect(unread[0].title).toBe("T1");
    });
  });

  describe("markAsRead()", () => {
    it("marks a notification as read and returns true", () => {
      const id = service.send(NotificationType.INFO, "T", "M");
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it("returns false for a non-existent id", () => {
      const result = service.markAsRead("nonexistent-id");
      expect(result).toBe(false);
    });

    it("only marks the specified notification as read", () => {
      const id1 = service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.INFO, "T2", "M2");
      service.markAsRead(id1);
      const all = service.getAll();
      expect(all[0].read).toBe(true);
      expect(all[1].read).toBe(false);
    });
  });

  describe("markAllAsRead()", () => {
    it("marks all notifications as read", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.SUCCESS, "T2", "M2");
      service.markAllAsRead();
      const all = service.getAll();
      expect(all.every((n) => n.read)).toBe(true);
    });

    it("has no effect when there are no notifications", () => {
      expect(() => service.markAllAsRead()).not.toThrow();
      expect(service.getAll()).toEqual([]);
    });
  });

  describe("subscribe()", () => {
    it("calls the listener when a notification is sent", () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, "T", "M");
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ title: "T" }));
    });

    it("calls all registered listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.subscribe(listener1);
      service.subscribe(listener2);
      service.send(NotificationType.SUCCESS, "T", "M");
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("returns an unsubscribe function that stops further calls", () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      service.send(NotificationType.INFO, "First", "M1");
      unsubscribe();
      service.send(NotificationType.INFO, "Second", "M2");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("does not call unsubscribed listener", () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.INFO, "T", "M");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("clear()", () => {
    it("removes all notifications", () => {
      service.send(NotificationType.INFO, "T1", "M1");
      service.send(NotificationType.ERROR, "T2", "M2");
      service.clear();
      expect(service.getAll()).toEqual([]);
    });

    it("logs when clearing", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      service.clear();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
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
});