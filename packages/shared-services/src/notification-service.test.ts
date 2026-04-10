import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, NotificationType, type Notification } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('send()', () => {
    it('returns a non-empty notification id string', () => {
      const id = service.send(NotificationType.INFO, 'Hello', 'World');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('stores the notification after sending', () => {
      service.send(NotificationType.SUCCESS, 'Done', 'Operation complete');
      expect(service.getAll()).toHaveLength(1);
    });

    it('stores notification with correct type, title, and message', () => {
      service.send(NotificationType.WARNING, 'Caution', 'Low disk space');
      const notification = service.getAll()[0];
      expect(notification.type).toBe(NotificationType.WARNING);
      expect(notification.title).toBe('Caution');
      expect(notification.message).toBe('Low disk space');
    });

    it('stores notification with read = false by default', () => {
      service.send(NotificationType.ERROR, 'Error', 'Something failed');
      expect(service.getAll()[0].read).toBe(false);
    });

    it('stores notification with a timestamp', () => {
      const before = new Date();
      service.send(NotificationType.INFO, 'Test', 'Message');
      const after = new Date();
      const ts = service.getAll()[0].timestamp;
      expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('each call generates a unique notification id', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'B');
      const id2 = service.send(NotificationType.INFO, 'C', 'D');
      expect(id1).not.toBe(id2);
    });

    it('supports all NotificationType variants', () => {
      service.send(NotificationType.INFO, 'i', 'i');
      service.send(NotificationType.SUCCESS, 's', 's');
      service.send(NotificationType.WARNING, 'w', 'w');
      service.send(NotificationType.ERROR, 'e', 'e');
      const types = service.getAll().map(n => n.type);
      expect(types).toContain(NotificationType.INFO);
      expect(types).toContain(NotificationType.SUCCESS);
      expect(types).toContain(NotificationType.WARNING);
      expect(types).toContain(NotificationType.ERROR);
    });

    it('logs to console when a notification is sent', () => {
      service.send(NotificationType.INFO, 'Title', 'Msg');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Title')
      );
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns a copy, not the internal array', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      const all = service.getAll();
      all.push({ id: 'x', type: NotificationType.INFO, title: 'injected', message: 'msg', timestamp: new Date(), read: false });
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications when none are read', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      service.send(NotificationType.SUCCESS, 'C', 'D');
      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes notifications that have been marked as read', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      const id = service.send(NotificationType.SUCCESS, 'C', 'D');
      service.markAsRead(id);
      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].type).toBe(NotificationType.INFO);
    });

    it('returns empty array when all notifications are read', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
    });
  });

  describe('markAsRead()', () => {
    it('returns true when notification is found and marked as read', () => {
      const id = service.send(NotificationType.INFO, 'A', 'B');
      expect(service.markAsRead(id)).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false when notification id does not exist', () => {
      expect(service.markAsRead('nonexistent-id')).toBe(false);
    });

    it('only marks the targeted notification as read', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'B');
      service.send(NotificationType.SUCCESS, 'C', 'D');
      service.markAsRead(id1);
      const all = service.getAll();
      const n1 = all.find(n => n.id === id1)!;
      const n2 = all.find(n => n.id !== id1)!;
      expect(n1.read).toBe(true);
      expect(n2.read).toBe(false);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      service.send(NotificationType.ERROR, 'C', 'D');
      service.markAllAsRead();
      expect(service.getAll().every(n => n.read)).toBe(true);
    });

    it('is a no-op when there are no notifications', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('calls the listener when a notification is sent', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'Hello', 'World');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('passes the notification to the listener', () => {
      let received: Notification | undefined;
      service.subscribe(n => { received = n; });
      service.send(NotificationType.SUCCESS, 'Done', 'OK');
      expect(received).toBeDefined();
      expect(received!.title).toBe('Done');
      expect(received!.type).toBe(NotificationType.SUCCESS);
    });

    it('calls multiple listeners when a notification is sent', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      service.subscribe(l1);
      service.subscribe(l2);
      service.send(NotificationType.INFO, 'X', 'Y');
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes listener when the returned function is called', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.INFO, 'After unsub', 'msg');
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not affect other listeners when one is unsubscribed', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      const unsub1 = service.subscribe(l1);
      service.subscribe(l2);
      unsub1();
      service.send(NotificationType.INFO, 'Test', 'msg');
      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('removes all stored notifications', () => {
      service.send(NotificationType.INFO, 'A', 'B');
      service.send(NotificationType.SUCCESS, 'C', 'D');
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it('logs when clearing notifications', () => {
      service.clear();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleared')
      );
    });

    it('can send new notifications after clearing', () => {
      service.send(NotificationType.INFO, 'old', 'msg');
      service.clear();
      service.send(NotificationType.SUCCESS, 'new', 'msg');
      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].title).toBe('new');
    });
  });
});