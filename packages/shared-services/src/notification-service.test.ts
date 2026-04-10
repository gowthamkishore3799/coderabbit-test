// Tests for NotificationService (packages/shared-services/src/notification-service.ts)
// Exercised by the new demo-usage.ts file added in this PR.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, NotificationType, type Notification } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('returns a non-empty string ID', () => {
      const id = service.send(NotificationType.SUCCESS, 'Title', 'Message');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('stores the sent notification', () => {
      service.send(NotificationType.SUCCESS, 'Welcome!', 'You logged in.');
      expect(service.getAll()).toHaveLength(1);
    });

    it('stores notification with correct type', () => {
      service.send(NotificationType.INFO, 'Info', 'Some info');
      expect(service.getAll()[0].type).toBe(NotificationType.INFO);
    });

    it('stores notification with correct title and message', () => {
      service.send(NotificationType.WARNING, 'Warn Title', 'Warn message');
      const n = service.getAll()[0];
      expect(n.title).toBe('Warn Title');
      expect(n.message).toBe('Warn message');
    });

    it('stores notification as unread by default', () => {
      service.send(NotificationType.ERROR, 'Error', 'Something went wrong');
      expect(service.getAll()[0].read).toBe(false);
    });

    it('stores notification with a timestamp', () => {
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(service.getAll()[0].timestamp).toBeInstanceOf(Date);
    });

    it('generates unique IDs for different notifications', () => {
      const id1 = service.send(NotificationType.SUCCESS, 'T1', 'M1');
      const id2 = service.send(NotificationType.SUCCESS, 'T2', 'M2');
      expect(id1).not.toBe(id2);
    });

    it('sends all four notification types without error', () => {
      expect(() => {
        service.send(NotificationType.INFO, 'I', 'M');
        service.send(NotificationType.WARNING, 'W', 'M');
        service.send(NotificationType.ERROR, 'E', 'M');
        service.send(NotificationType.SUCCESS, 'S', 'M');
      }).not.toThrow();
      expect(service.getAll()).toHaveLength(4);
    });

    it('logs to console when sending a notification', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.send(NotificationType.SUCCESS, 'Hello', 'World');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('calls subscribed listeners with the new notification', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'Test', 'Message');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.INFO }));
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns all sent notifications', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      expect(service.getAll()).toHaveLength(2);
    });

    it('returns a copy of the notifications array', () => {
      service.send(NotificationType.SUCCESS, 'T', 'M');
      const all = service.getAll();
      all.push({ id: 'fake' } as Notification);
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications as unread initially', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes read notifications', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      const id = service.send(NotificationType.INFO, 'T2', 'M2');
      service.markAsRead(id);
      expect(service.getUnread()).toHaveLength(1);
      expect(service.getUnread()[0].type).toBe(NotificationType.SUCCESS);
    });

    it('returns empty array when all notifications are read', () => {
      service.send(NotificationType.SUCCESS, 'T', 'M');
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
    });
  });

  describe('markAsRead()', () => {
    it('marks a notification as read by ID', () => {
      const id = service.send(NotificationType.SUCCESS, 'T', 'M');
      const result = service.markAsRead(id);
      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false for a non-existent ID', () => {
      const result = service.markAsRead('non-existent-id');
      expect(result).toBe(false);
    });

    it('does not affect other notifications', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      const id2 = service.send(NotificationType.INFO, 'T2', 'M2');
      service.markAsRead(id2);
      expect(service.getAll()[0].read).toBe(false);
      expect(service.getAll()[1].read).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      service.markAllAsRead();
      expect(service.getAll().every(n => n.read)).toBe(true);
    });

    it('is a no-op when there are no notifications', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('calls listener when a notification is sent', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('calls multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.subscribe(listener1);
      service.subscribe(listener2);
      service.send(NotificationType.INFO, 'T', 'M');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function that stops further calls', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(listener).not.toHaveBeenCalled();
    });

    it('listener receives the full notification object', () => {
      let received: Notification | null = null;
      service.subscribe(n => { received = n; });
      service.send(NotificationType.ERROR, 'Error title', 'Error message');
      expect(received).not.toBeNull();
      expect(received!.type).toBe(NotificationType.ERROR);
      expect(received!.title).toBe('Error title');
      expect(received!.read).toBe(false);
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it('allows sending new notifications after clearing', () => {
      service.send(NotificationType.SUCCESS, 'T', 'M');
      service.clear();
      service.send(NotificationType.INFO, 'New', 'Notification');
      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].title).toBe('New');
    });

    it('logs to console when clearing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.clear();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('demo-usage.ts scenario – SUCCESS and INFO notifications', () => {
    it('sends SUCCESS welcome notification as in demo-usage.ts', () => {
      const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      expect(id).toBeTruthy();
      const n = service.getAll()[0];
      expect(n.type).toBe(NotificationType.SUCCESS);
      expect(n.title).toBe('Welcome!');
      expect(n.read).toBe(false);
    });

    it('sends INFO new feature notification as in demo-usage.ts', () => {
      service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
      const n = service.getAll()[0];
      expect(n.type).toBe(NotificationType.INFO);
      expect(n.message).toContain('analytics dashboard');
    });

    it('getAll returns both notifications after sending two as in demo-usage.ts', () => {
      service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
      const all = service.getAll();
      expect(all).toHaveLength(2);
    });
  });
});