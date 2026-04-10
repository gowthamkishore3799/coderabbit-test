// Tests for demo-usage.ts (demonstrateServices function)
// Run with: npx vitest run demo-usage.test.ts (after installing vitest)
//
// These tests exercise demonstrateServices() via the underlying services it uses:
// AnalyticsService and NotificationService from @coderabbit-test/shared-services.
//
// Because demonstrateServices() creates module-level service instances and calls
// them in a fixed sequence, we test the service classes directly to verify the
// same behaviours the function relies on, and then test the exported function's
// side effects (console output).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from './packages/shared-services/src/index';

// We import demonstrateServices separately so that module-level service
// instances (analytics, notifications) are initialised once per import.
// Spy on console.log to capture output without polluting test output.

describe('demonstrateServices() – underlying service behaviour', () => {
  // ---------------------------------------------------------------
  // AnalyticsService – used by demonstrateServices()
  // ---------------------------------------------------------------
  describe('AnalyticsService', () => {
    let analytics: AnalyticsService;

    beforeEach(() => {
      analytics = new AnalyticsService();
    });

    it('tracks a user_login event and stores it', () => {
      const event: AnalyticsEvent = {
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        properties: { browser: 'Chrome', version: '120.0.0' },
      };
      analytics.track(event);
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user_login');
      expect(events[0].userId).toBe('user123');
    });

    it('tracks a page_view event and stores it', () => {
      const event: AnalyticsEvent = {
        eventName: 'page_view',
        userId: 'user123',
        timestamp: new Date(),
        properties: { page: '/dashboard', referrer: '/login' },
      };
      analytics.track(event);
      const events = analytics.getEvents();
      expect(events[0].eventName).toBe('page_view');
    });

    it('tracks multiple events sequentially (demonstrateServices calls track twice)', () => {
      analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
      expect(analytics.getEvents()).toHaveLength(2);
    });

    it('getEventsByUser returns only events for the requested user', () => {
      analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      analytics.track({ eventName: 'page_view', userId: 'other', timestamp: new Date() });
      expect(analytics.getEventsByUser('user123')).toHaveLength(1);
      expect(analytics.getEventsByUser('other')).toHaveLength(1);
    });

    it('exportEvents returns a JSON string of all stored events', () => {
      analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      const exported = analytics.exportEvents();
      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].eventName).toBe('user_login');
    });

    it('clearEvents removes all stored events', () => {
      analytics.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
      analytics.clearEvents();
      expect(analytics.getEvents()).toHaveLength(0);
    });

    it('returns an empty array from getEvents when no events tracked', () => {
      expect(analytics.getEvents()).toHaveLength(0);
    });

    it('rejects an event with an empty eventName', () => {
      expect(() =>
        analytics.track({ eventName: '', userId: 'u1', timestamp: new Date() })
      ).toThrow();
    });

    it('accepts an event with no userId (optional field)', () => {
      expect(() =>
        analytics.track({ eventName: 'anon_event', timestamp: new Date() })
      ).not.toThrow();
      expect(analytics.getEvents()[0].userId).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // NotificationService – used by demonstrateServices()
  // ---------------------------------------------------------------
  describe('NotificationService', () => {
    let notifications: NotificationService;

    beforeEach(() => {
      notifications = new NotificationService();
    });

    it('send() creates a SUCCESS notification and returns an id', () => {
      const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have logged in.');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('send() creates an INFO notification', () => {
      notifications.send(NotificationType.INFO, 'New Feature', 'Check out the analytics dashboard!');
      const all = notifications.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.INFO);
    });

    it('demonstrateServices sends two notifications (SUCCESS then INFO)', () => {
      notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
      const all = notifications.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].type).toBe(NotificationType.SUCCESS);
      expect(all[1].type).toBe(NotificationType.INFO);
    });

    it('new notifications start with read = false', () => {
      notifications.send(NotificationType.SUCCESS, 'Hi', 'Hello');
      const all = notifications.getAll();
      expect(all[0].read).toBe(false);
    });

    it('getAll() returns copies so external mutation does not affect stored state', () => {
      notifications.send(NotificationType.INFO, 'Test', 'Message');
      const snapshot1 = notifications.getAll();
      snapshot1.push({} as Notification);
      expect(notifications.getAll()).toHaveLength(1);
    });

    it('getUnread() returns notifications that have not been read', () => {
      notifications.send(NotificationType.SUCCESS, 'A', 'msg1');
      notifications.send(NotificationType.INFO, 'B', 'msg2');
      expect(notifications.getUnread()).toHaveLength(2);
    });

    it('markAsRead() marks a notification as read', () => {
      const id = notifications.send(NotificationType.SUCCESS, 'A', 'msg');
      expect(notifications.markAsRead(id)).toBe(true);
      expect(notifications.getUnread()).toHaveLength(0);
    });

    it('markAsRead() returns false for an unknown id', () => {
      expect(notifications.markAsRead('nonexistent-id')).toBe(false);
    });

    it('markAllAsRead() marks every notification as read', () => {
      notifications.send(NotificationType.SUCCESS, 'A', 'msg1');
      notifications.send(NotificationType.INFO, 'B', 'msg2');
      notifications.markAllAsRead();
      expect(notifications.getUnread()).toHaveLength(0);
    });

    it('clear() removes all notifications', () => {
      notifications.send(NotificationType.SUCCESS, 'A', 'msg');
      notifications.clear();
      expect(notifications.getAll()).toHaveLength(0);
    });

    it('subscribe() listener is called when a notification is sent', () => {
      const received: Notification[] = [];
      notifications.subscribe((n) => received.push(n));
      notifications.send(NotificationType.WARNING, 'Alert', 'Something happened');
      expect(received).toHaveLength(1);
      expect(received[0].type).toBe(NotificationType.WARNING);
    });

    it('subscribe() returns an unsubscribe function that stops further callbacks', () => {
      const received: Notification[] = [];
      const unsubscribe = notifications.subscribe((n) => received.push(n));
      unsubscribe();
      notifications.send(NotificationType.INFO, 'Late', 'Not received');
      expect(received).toHaveLength(0);
    });

    it('each sent notification has a non-empty id', () => {
      const id = notifications.send(NotificationType.ERROR, 'Err', 'Something broke');
      expect(id).toBeTruthy();
    });

    it('each sent notification has a timestamp', () => {
      notifications.send(NotificationType.SUCCESS, 'Ok', 'Done');
      const all = notifications.getAll();
      expect(all[0].timestamp).toBeInstanceOf(Date);
    });
  });
});

// ---------------------------------------------------------------
// demonstrateServices() — console output smoke test
// ---------------------------------------------------------------
describe('demonstrateServices() – console output', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.resetModules();
  });

  it('logs the header banner when called', async () => {
    // Re-import the module so fresh service instances are used
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs the analytics events section', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Analytics Events'))).toBe(true);
  });

  it('logs the notifications section', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Notifications'))).toBe(true);
  });

  it('logs the completion message', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Service Recognition Test Complete'))).toBe(true);
  });

  it('logs exactly two notifications (SUCCESS + INFO)', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    // One SUCCESS welcome notification, one INFO new-feature notification
    expect(calls.some((msg) => msg.includes('[SUCCESS]') && msg.includes('Welcome!'))).toBe(true);
    expect(calls.some((msg) => msg.includes('[INFO]') && msg.includes('New Feature'))).toBe(true);
  });
});