import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, NotificationType, type Notification } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('send()', () => {
    it('returns a non-empty string id', () => {
      const id = service.send(NotificationType.INFO, 'Title', 'Message');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('stores the notification with correct type/title/message', () => {
      service.send(NotificationType.SUCCESS, 'Welcome!', 'You logged in.');

      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.SUCCESS);
      expect(all[0].title).toBe('Welcome!');
      expect(all[0].message).toBe('You logged in.');
    });

    it('created notification has read=false by default', () => {
      service.send(NotificationType.INFO, 'Test', 'Body');

      expect(service.getAll()[0].read).toBe(false);
    });

    it('created notification has a timestamp', () => {
      const before = new Date();
      service.send(NotificationType.WARNING, 'Heads up', 'Watch out');
      const after = new Date();

      const ts = service.getAll()[0].timestamp;
      expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('supports all notification types', () => {
      service.send(NotificationType.INFO, 'I', 'info');
      service.send(NotificationType.WARNING, 'W', 'warn');
      service.send(NotificationType.ERROR, 'E', 'err');
      service.send(NotificationType.SUCCESS, 'S', 'ok');

      const types = service.getAll().map(n => n.type);
      expect(types).toContain(NotificationType.INFO);
      expect(types).toContain(NotificationType.WARNING);
      expect(types).toContain(NotificationType.ERROR);
      expect(types).toContain(NotificationType.SUCCESS);
    });

    it('generates unique ids for each notification', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'msg1');
      const id2 = service.send(NotificationType.INFO, 'B', 'msg2');

      expect(id1).not.toBe(id2);
    });

    it('invokes subscribed listeners with the new notification', () => {
      const listener = vi.fn();
      service.subscribe(listener);

      service.send(NotificationType.SUCCESS, 'Hi', 'There');

      expect(listener).toHaveBeenCalledOnce();
      const arg: Notification = listener.mock.calls[0][0];
      expect(arg.title).toBe('Hi');
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns a defensive copy', () => {
      service.send(NotificationType.INFO, 'T', 'M');

      const all = service.getAll();
      all.pop();

      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications initially since they start as unread', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.ERROR, 'B', 'msg');

      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes notifications that have been marked as read', () => {
      const id = service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.WARNING, 'B', 'msg');

      service.markAsRead(id);

      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].type).toBe(NotificationType.WARNING);
    });
  });

  describe('markAsRead()', () => {
    it('returns true and marks the notification as read', () => {
      const id = service.send(NotificationType.INFO, 'Title', 'Body');

      const result = service.markAsRead(id);

      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false for an unknown id', () => {
      expect(service.markAsRead('nonexistent-id')).toBe(false);
    });

    it('does not affect other notifications', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');

      service.markAsRead(id1);

      const all = service.getAll();
      const b = all.find(n => n.title === 'B')!;
      expect(b.read).toBe(false);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');

      service.markAllAsRead();

      expect(service.getAll().every(n => n.read)).toBe(true);
    });

    it('is a no-op on an empty notification list', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('unsubscribes the listener when the returned function is called', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      unsubscribe();
      service.send(NotificationType.INFO, 'After', 'unsub');

      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple independent listeners', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      service.subscribe(l1);
      service.subscribe(l2);

      service.send(NotificationType.INFO, 'Broadcast', 'msg');

      expect(l1).toHaveBeenCalledOnce();
      expect(l2).toHaveBeenCalledOnce();
    });

    it('unsubscribing one listener does not affect others', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      const unsub1 = service.subscribe(l1);
      service.subscribe(l2);

      unsub1();
      service.send(NotificationType.INFO, 'Partial', 'broadcast');

      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalledOnce();
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.ERROR, 'B', 'msg');

      service.clear();

      expect(service.getAll()).toEqual([]);
    });

    it('is idempotent when called on an already-empty service', () => {
      expect(() => service.clear()).not.toThrow();
      expect(service.getAll()).toEqual([]);
    });
  });
});