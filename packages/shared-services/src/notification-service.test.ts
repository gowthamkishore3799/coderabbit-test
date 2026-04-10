import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, NotificationType, type Notification } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('creates a notification with the correct type, title, and message', () => {
      service.send(NotificationType.SUCCESS, 'Welcome!', 'You have logged in.');
      const notifications = service.getAll();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe(NotificationType.SUCCESS);
      expect(notifications[0].title).toBe('Welcome!');
      expect(notifications[0].message).toBe('You have logged in.');
    });

    it('returns a non-empty string ID', () => {
      const id = service.send(NotificationType.INFO, 'Info', 'Some info');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('creates notifications with read=false by default', () => {
      service.send(NotificationType.WARNING, 'Warning', 'Be careful');
      expect(service.getAll()[0].read).toBe(false);
    });

    it('creates notifications with a timestamp', () => {
      const before = new Date();
      service.send(NotificationType.ERROR, 'Error', 'Something went wrong');
      const after = new Date();
      const ts = service.getAll()[0].timestamp;
      expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('returns unique IDs for multiple notifications', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'msg1');
      const id2 = service.send(NotificationType.INFO, 'B', 'msg2');
      expect(id1).not.toBe(id2);
    });

    it('supports all NotificationType values', () => {
      service.send(NotificationType.INFO, 'Info', 'info msg');
      service.send(NotificationType.WARNING, 'Warning', 'warn msg');
      service.send(NotificationType.ERROR, 'Error', 'error msg');
      service.send(NotificationType.SUCCESS, 'Success', 'success msg');
      expect(service.getAll()).toHaveLength(4);
    });

    it('notifies subscribed listeners on send', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'Title', 'Message');
      expect(listener).toHaveBeenCalledTimes(1);
      const notif: Notification = listener.mock.calls[0][0];
      expect(notif.title).toBe('Title');
    });

    it('logs to console when sending a notification', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.send(NotificationType.INFO, 'Test', 'Body');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test'));
      consoleSpy.mockRestore();
    });
  });

  describe('getAll()', () => {
    it('returns empty array initially', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns all sent notifications', () => {
      service.send(NotificationType.INFO, 'A', 'msg1');
      service.send(NotificationType.SUCCESS, 'B', 'msg2');
      expect(service.getAll()).toHaveLength(2);
    });

    it('returns a copy, not the internal array', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      const all = service.getAll();
      all.push({ id: 'fake', type: NotificationType.INFO, title: 'Fake', message: 'fake', timestamp: new Date(), read: false });
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications as unread initially', () => {
      service.send(NotificationType.INFO, 'A', '1');
      service.send(NotificationType.INFO, 'B', '2');
      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes read notifications', () => {
      const id = service.send(NotificationType.INFO, 'A', '1');
      service.send(NotificationType.INFO, 'B', '2');
      service.markAsRead(id);
      expect(service.getUnread()).toHaveLength(1);
    });

    it('returns empty array when all are read', () => {
      service.send(NotificationType.INFO, 'A', '1');
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
    });
  });

  describe('markAsRead()', () => {
    it('marks a specific notification as read', () => {
      const id = service.send(NotificationType.INFO, 'Notif', 'msg');
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false when notification ID does not exist', () => {
      const result = service.markAsRead('nonexistent-id');
      expect(result).toBe(false);
    });

    it('does not affect other notifications', () => {
      const id1 = service.send(NotificationType.INFO, 'A', '1');
      service.send(NotificationType.INFO, 'B', '2');
      service.markAsRead(id1);
      expect(service.getAll()[1].read).toBe(false);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'A', '1');
      service.send(NotificationType.SUCCESS, 'B', '2');
      service.markAllAsRead();
      expect(service.getAll().every(n => n.read)).toBe(true);
    });

    it('is a no-op when no notifications exist', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });

    it('new notifications after markAllAsRead are still unread', () => {
      service.send(NotificationType.INFO, 'A', '1');
      service.markAllAsRead();
      service.send(NotificationType.INFO, 'B', '2');
      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].title).toBe('B');
    });
  });

  describe('subscribe()', () => {
    it('returns an unsubscribe function', () => {
      const unsubscribe = service.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
    });

    it('stops receiving notifications after unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.INFO, 'A', 'msg');
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.subscribe(listener1);
      service.subscribe(listener2);
      service.send(NotificationType.INFO, 'A', 'msg');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('only unsubscribes the specific listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsub1 = service.subscribe(listener1);
      service.subscribe(listener2);
      unsub1();
      service.send(NotificationType.INFO, 'A', 'msg');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.INFO, 'A', '1');
      service.send(NotificationType.SUCCESS, 'B', '2');
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it('allows sending new notifications after clearing', () => {
      service.send(NotificationType.INFO, 'Old', 'msg');
      service.clear();
      service.send(NotificationType.SUCCESS, 'New', 'msg');
      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].title).toBe('New');
    });
  });

  describe('NotificationType enum', () => {
    it('has the expected string values', () => {
      expect(NotificationType.INFO).toBe('info');
      expect(NotificationType.WARNING).toBe('warning');
      expect(NotificationType.ERROR).toBe('error');
      expect(NotificationType.SUCCESS).toBe('success');
    });
  });
});