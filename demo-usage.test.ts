import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

// ---------------------------------------------------------------------------
// Tests for demo-usage.ts (demonstrateServices)
//
// demo-usage.ts creates module-level AnalyticsService / NotificationService
// instances and calls them inside demonstrateServices(). The tests below
// verify the services used by that function work correctly and cover every
// interaction the function performs.
// ---------------------------------------------------------------------------

describe('demonstrateServices – underlying service behaviour', () => {
  let analytics: AnalyticsService;
  let notifications: NotificationService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    notifications = new NotificationService();
  });

  afterEach(() => {
    analytics.clearEvents();
    notifications.clear();
  });

  // -------------------------------------------------------------------------
  // AnalyticsService.track – called twice in demonstrateServices
  // -------------------------------------------------------------------------
  describe('AnalyticsService.track', () => {
    it('stores a user_login event', () => {
      analytics.track({
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        properties: { browser: 'Chrome', version: '120.0.0' },
      });
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user_login');
      expect(events[0].userId).toBe('user123');
    });

    it('stores a page_view event', () => {
      analytics.track({
        eventName: 'page_view',
        userId: 'user123',
        timestamp: new Date(),
        properties: { page: '/dashboard', referrer: '/login' },
      });
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('page_view');
    });

    it('accumulates multiple tracked events', () => {
      analytics.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
      analytics.track({ eventName: 'page_view', userId: 'u1', timestamp: new Date() });
      expect(analytics.getEvents()).toHaveLength(2);
    });

    it('tracks an event without optional userId', () => {
      analytics.track({ eventName: 'anonymous_visit', timestamp: new Date() });
      expect(analytics.getEvents()[0].userId).toBeUndefined();
    });

    it('tracks an event without optional properties', () => {
      analytics.track({ eventName: 'bare_event', timestamp: new Date() });
      expect(analytics.getEvents()[0].properties).toBeUndefined();
    });

    it('returns a copy of events (immutable public getter)', () => {
      analytics.track({ eventName: 'e', timestamp: new Date() });
      const first = analytics.getEvents();
      const second = analytics.getEvents();
      expect(first).not.toBe(second); // different array references
    });
  });

  // -------------------------------------------------------------------------
  // AnalyticsService.exportEvents – called once in demonstrateServices
  // -------------------------------------------------------------------------
  describe('AnalyticsService.exportEvents', () => {
    it('returns a JSON string', () => {
      analytics.track({ eventName: 'e', timestamp: new Date() });
      const json = analytics.exportEvents();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('exported JSON contains the tracked event name', () => {
      analytics.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
      const json = analytics.exportEvents();
      expect(json).toContain('user_login');
    });

    it('returns an empty JSON array when no events have been tracked', () => {
      const json = analytics.exportEvents();
      expect(JSON.parse(json)).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // AnalyticsService.getEventsByUser
  // -------------------------------------------------------------------------
  describe('AnalyticsService.getEventsByUser', () => {
    it('returns only events for the given userId', () => {
      analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
      analytics.track({ eventName: 'logout', userId: 'other', timestamp: new Date() });
      const events = analytics.getEventsByUser('user123');
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('login');
    });

    it('returns empty array for unknown userId', () => {
      analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
      expect(analytics.getEventsByUser('nobody')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // AnalyticsService.clearEvents
  // -------------------------------------------------------------------------
  describe('AnalyticsService.clearEvents', () => {
    it('removes all tracked events', () => {
      analytics.track({ eventName: 'e', timestamp: new Date() });
      analytics.clearEvents();
      expect(analytics.getEvents()).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.send – called twice in demonstrateServices
  // -------------------------------------------------------------------------
  describe('NotificationService.send', () => {
    it('stores a SUCCESS notification with correct fields', () => {
      notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      const all = notifications.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.SUCCESS);
      expect(all[0].title).toBe('Welcome!');
      expect(all[0].message).toBe('You have successfully logged in.');
      expect(all[0].read).toBe(false);
    });

    it('stores an INFO notification', () => {
      notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
      const all = notifications.getAll();
      expect(all[0].type).toBe(NotificationType.INFO);
      expect(all[0].title).toBe('New Feature');
    });

    it('returns a string ID', () => {
      const id = notifications.send(NotificationType.SUCCESS, 'T', 'M');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('returns unique IDs for separate sends', () => {
      const id1 = notifications.send(NotificationType.INFO, 'A', 'A message');
      const id2 = notifications.send(NotificationType.INFO, 'B', 'B message');
      expect(id1).not.toBe(id2);
    });

    it('notification timestamp is a Date object', () => {
      notifications.send(NotificationType.WARNING, 'T', 'M');
      const n = notifications.getAll()[0];
      expect(n.timestamp).toBeInstanceOf(Date);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.getAll – called in demonstrateServices
  // -------------------------------------------------------------------------
  describe('NotificationService.getAll', () => {
    it('returns all sent notifications in order', () => {
      notifications.send(NotificationType.SUCCESS, 'First', 'msg');
      notifications.send(NotificationType.INFO, 'Second', 'msg');
      const all = notifications.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].title).toBe('First');
      expect(all[1].title).toBe('Second');
    });

    it('returns a copy (immutable public getter)', () => {
      notifications.send(NotificationType.INFO, 'T', 'M');
      expect(notifications.getAll()).not.toBe(notifications.getAll());
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.getUnread
  // -------------------------------------------------------------------------
  describe('NotificationService.getUnread', () => {
    it('newly sent notifications are unread', () => {
      notifications.send(NotificationType.INFO, 'T', 'M');
      expect(notifications.getUnread()).toHaveLength(1);
    });

    it('returns empty after all marked as read', () => {
      notifications.send(NotificationType.INFO, 'T', 'M');
      notifications.markAllAsRead();
      expect(notifications.getUnread()).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.markAsRead
  // -------------------------------------------------------------------------
  describe('NotificationService.markAsRead', () => {
    it('marks the notification as read by ID', () => {
      const id = notifications.send(NotificationType.INFO, 'T', 'M');
      const result = notifications.markAsRead(id);
      expect(result).toBe(true);
      expect(notifications.getAll()[0].read).toBe(true);
    });

    it('returns false for an unknown ID', () => {
      expect(notifications.markAsRead('nonexistent-id')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.subscribe
  // -------------------------------------------------------------------------
  describe('NotificationService.subscribe', () => {
    it('calls listener when a notification is sent', () => {
      const listener = vi.fn();
      notifications.subscribe(listener);
      notifications.send(NotificationType.SUCCESS, 'T', 'M');
      expect(listener).toHaveBeenCalledOnce();
      const arg = listener.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SUCCESS);
    });

    it('does not call unsubscribed listener', () => {
      const listener = vi.fn();
      const unsubscribe = notifications.subscribe(listener);
      unsubscribe();
      notifications.send(NotificationType.INFO, 'T', 'M');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // NotificationService.clear
  // -------------------------------------------------------------------------
  describe('NotificationService.clear', () => {
    it('removes all notifications', () => {
      notifications.send(NotificationType.ERROR, 'T', 'M');
      notifications.clear();
      expect(notifications.getAll()).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// demonstrateServices – integration smoke test
// ---------------------------------------------------------------------------

describe('demonstrateServices function', () => {
  it('runs without throwing and logs output', async () => {
    // Import the function dynamically so module-level service instantiation
    // is exercised. We spy on console.log to avoid noise in test output.
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).not.toThrow();

    // Verify that the function produced output via console.log
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('logs analytics events output', async () => {
    const logs: string[] = [];
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation((...args) => logs.push(String(args[0])));

    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();

    const hasAnalyticsHeader = logs.some((l) => l.includes('Analytics'));
    expect(hasAnalyticsHeader).toBe(true);

    consoleSpy.mockRestore();
  });

  it('logs notifications output', async () => {
    const logs: string[] = [];
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation((...args) => logs.push(String(args[0])));

    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();

    const hasNotificationsHeader = logs.some((l) => l.includes('Notifications'));
    expect(hasNotificationsHeader).toBe(true);

    consoleSpy.mockRestore();
  });
});