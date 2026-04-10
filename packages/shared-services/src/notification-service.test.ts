import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotificationService,
  NotificationType,
  NotificationSchema,
  type Notification,
} from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('sends a SUCCESS notification and returns an id', () => {
      const id = service.send(NotificationType.SUCCESS, 'Done', 'Operation completed.');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('sends an INFO notification', () => {
      service.send(NotificationType.INFO, 'Info', 'Some info.');
      const notifications = service.getAll();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe(NotificationType.INFO);
    });

    it('sends a WARNING notification', () => {
      service.send(NotificationType.WARNING, 'Warn', 'Be careful.');
      expect(service.getAll()[0].type).toBe(NotificationType.WARNING);
    });

    it('sends an ERROR notification', () => {
      service.send(NotificationType.ERROR, 'Error', 'Something failed.');
      expect(service.getAll()[0].type).toBe(NotificationType.ERROR);
    });

    it('creates notification with read=false by default', () => {
      service.send(NotificationType.INFO, 'Test', 'Message');
      expect(service.getAll()[0].read).toBe(false);
    });

    it('creates notification with a timestamp', () => {
      service.send(NotificationType.SUCCESS, 'Title', 'Message');
      const n = service.getAll()[0];
      expect(n.timestamp).toBeInstanceOf(Date);
    });

    it('stores title and message correctly', () => {
      service.send(NotificationType.SUCCESS, 'My Title', 'My Message');
      const n = service.getAll()[0];
      expect(n.title).toBe('My Title');
      expect(n.message).toBe('My Message');
    });

    it('generates unique ids for each notification', () => {
      const id1 = service.send(NotificationType.INFO, 'T1', 'M1');
      const id2 = service.send(NotificationType.INFO, 'T2', 'M2');
      expect(id1).not.toBe(id2);
    });

    it('accumulates multiple notifications', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');
      service.send(NotificationType.ERROR, 'C', 'msg');
      expect(service.getAll()).toHaveLength(3);
    });

    it('logs to console when sending', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.send(NotificationType.SUCCESS, 'Title', 'Message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('notifies listeners when a notification is sent', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'Hello', 'World');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].title).toBe('Hello');
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns a copy (immutable)', () => {
      service.send(NotificationType.INFO, 'T', 'M');
      const all1 = service.getAll();
      const all2 = service.getAll();
      expect(all1).not.toBe(all2);
    });

    it('mutation of returned array does not affect internal state', () => {
      service.send(NotificationType.INFO, 'T', 'M');
      const all = service.getAll();
      all.splice(0, 1);
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications initially (all unread)', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');
      expect(service.getUnread()).toHaveLength(2);
    });

    it('returns empty array when all are read', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
    });

    it('returns only unread notifications after marking some read', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');
      service.markAsRead(id1);
      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].title).toBe('B');
    });

    it('returns empty array when no notifications sent', () => {
      expect(service.getUnread()).toEqual([]);
    });
  });

  describe('markAsRead()', () => {
    it('marks an existing notification as read', () => {
      const id = service.send(NotificationType.INFO, 'Test', 'Message');
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false for a non-existent notification id', () => {
      expect(service.markAsRead('non-existent-id')).toBe(false);
    });

    it('does not affect other notifications', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.INFO, 'B', 'msg');
      service.markAsRead(id1);
      const all = service.getAll();
      expect(all.find(n => n.id === id1)?.read).toBe(true);
      expect(all[1].read).toBe(false);
    });

    it('is idempotent — marking already-read notification returns true', () => {
      const id = service.send(NotificationType.SUCCESS, 'T', 'M');
      service.markAsRead(id);
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');
      service.markAllAsRead();
      service.getAll().forEach(n => expect(n.read).toBe(true));
    });

    it('does nothing when there are no notifications', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('invokes listener for each sent notification', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('returns an unsubscribe function that stops future callbacks', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      service.send(NotificationType.INFO, 'First', 'msg');
      unsubscribe();
      service.send(NotificationType.INFO, 'Second', 'msg');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple listeners', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      service.subscribe(l1);
      service.subscribe(l2);
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it('passes the validated notification to the listener', () => {
      let received: Notification | null = null;
      service.subscribe(n => { received = n; });
      service.send(NotificationType.ERROR, 'Oops', 'Something broke');
      expect(received).not.toBeNull();
      expect(received!.type).toBe(NotificationType.ERROR);
      expect(received!.title).toBe('Oops');
      expect(received!.read).toBe(false);
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.INFO, 'A', 'msg');
      service.send(NotificationType.SUCCESS, 'B', 'msg');
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it('allows new notifications after clearing', () => {
      service.send(NotificationType.INFO, 'Before', 'msg');
      service.clear();
      service.send(NotificationType.SUCCESS, 'After', 'msg');
      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].title).toBe('After');
    });

    it('logs to console when clearing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.clear();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('NotificationType enum', () => {
  it('has INFO value', () => {
    expect(NotificationType.INFO).toBe('info');
  });

  it('has WARNING value', () => {
    expect(NotificationType.WARNING).toBe('warning');
  });

  it('has ERROR value', () => {
    expect(NotificationType.ERROR).toBe('error');
  });

  it('has SUCCESS value', () => {
    expect(NotificationType.SUCCESS).toBe('success');
  });
});

describe('NotificationSchema', () => {
  it('accepts a valid notification object', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: NotificationType.INFO,
      title: 'Hello',
      message: 'World',
      timestamp: new Date(),
      read: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc',
      type: NotificationType.INFO,
      title: '',
      message: 'msg',
      timestamp: new Date(),
      read: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty message', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc',
      type: NotificationType.INFO,
      title: 'title',
      message: '',
      timestamp: new Date(),
      read: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid notification type', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc',
      type: 'unknown_type',
      title: 'title',
      message: 'message',
      timestamp: new Date(),
      read: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean read field', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc',
      type: NotificationType.INFO,
      title: 'T',
      message: 'M',
      timestamp: new Date(),
      read: 'yes',
    });
    expect(result.success).toBe(false);
  });
});