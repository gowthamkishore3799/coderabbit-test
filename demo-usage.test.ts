/**
 * Tests for demo-usage.ts and the shared services it uses.
 *
 * Note: AnalyticsService uses z.record(z.any()) which does not work in zod v4.
 * The valid call path is to omit the optional `properties` field when calling track().
 * Tests that exercise demonstrateServices() directly mock the module-level singleton
 * instances or test only the exported function's observable behaviour.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

describe('demonstrateServices export', () => {
  it('is exported as a function', async () => {
    const mod = await import('./demo-usage');
    expect(typeof mod.demonstrateServices).toBe('function');
  });
});

describe('AnalyticsService (used in demo-usage.ts)', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  // Note: events with `properties` trigger z.record(z.any()) which is broken in
  // zod v4 (requires two args). Tests here use the valid path: omitting properties.
  it('tracks a user_login event without properties', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    });
    expect(analytics.getEvents()).toHaveLength(1);
    expect(analytics.getEvents()[0].eventName).toBe('user_login');
  });

  it('tracks a page_view event', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });
    expect(analytics.getEvents()[0].eventName).toBe('page_view');
  });

  it('accumulates multiple tracked events', () => {
    analytics.track({ eventName: 'user_login', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('filters events by userId', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'user_login', userId: 'user456', timestamp: new Date() });
    const userEvents = analytics.getEventsByUser('user123');
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].userId).toBe('user123');
  });

  it('returns empty array for user with no events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEventsByUser('nonexistent')).toHaveLength(0);
  });

  it('exportEvents returns valid JSON string', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const exported = analytics.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('clears all events', () => {
    analytics.track({ eventName: 'user_login', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy not the internal array', () => {
    analytics.track({ eventName: 'user_login', timestamp: new Date() });
    const events = analytics.getEvents();
    events.push({ eventName: 'injected', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
  });

  it('track() with properties triggers zod v4 z.record(z.any()) bug', () => {
    // Documents that passing `properties` to track() is broken in the current zod v4 version
    expect(() =>
      analytics.track({
        eventName: 'user_login',
        timestamp: new Date(),
        properties: { browser: 'Chrome' },
      })
    ).toThrow();
  });
});

describe('NotificationService (used in demo-usage.ts)', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it('sends a SUCCESS notification', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].message).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
  });

  it('send returns a non-empty id string', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Title', 'Message');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns all notifications in correct insertion order', () => {
    notifications.send(NotificationType.SUCCESS, 'First', 'msg1');
    notifications.send(NotificationType.INFO, 'Second', 'msg2');
    const all = notifications.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe('First');
    expect(all[1].title).toBe('Second');
  });

  it('new notifications are unread by default', () => {
    notifications.send(NotificationType.INFO, 'Title', 'Message');
    expect(notifications.getAll()[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    const id = notifications.send(NotificationType.INFO, 'Title', 'Message');
    notifications.send(NotificationType.SUCCESS, 'Other', 'Other');
    notifications.markAsRead(id);
    expect(notifications.getUnread()).toHaveLength(1);
  });

  it('markAsRead marks the correct notification as read and returns true', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Title', 'Message');
    const result = notifications.markAsRead(id);
    expect(result).toBe(true);
    expect(notifications.getAll()[0].read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    notifications.send(NotificationType.INFO, 'A', 'a');
    notifications.send(NotificationType.SUCCESS, 'B', 'b');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('clear removes all notifications', () => {
    notifications.send(NotificationType.ERROR, 'Error', 'Something failed');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('subscriber is called when a notification is sent', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.WARNING, 'Warn', 'Heads up');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.WARNING);
  });

  it('unsubscribe stops future notifications from reaching listener', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, 'After unsub', 'Should not call listener');
    expect(listener).not.toHaveBeenCalled();
  });

  it('getAll returns a copy not the internal array', () => {
    notifications.send(NotificationType.INFO, 'Title', 'Message');
    const all = notifications.getAll();
    all.pop();
    expect(notifications.getAll()).toHaveLength(1);
  });

  it('notifications have a timestamp as a Date instance', () => {
    notifications.send(NotificationType.INFO, 'Title', 'Message');
    expect(notifications.getAll()[0].timestamp).toBeInstanceOf(Date);
  });
});

describe('NotificationType enum values (used in demo-usage.ts)', () => {
  it('SUCCESS has value "success"', () => {
    expect(NotificationType.SUCCESS).toBe('success');
  });

  it('INFO has value "info"', () => {
    expect(NotificationType.INFO).toBe('info');
  });

  it('WARNING has value "warning"', () => {
    expect(NotificationType.WARNING).toBe('warning');
  });

  it('ERROR has value "error"', () => {
    expect(NotificationType.ERROR).toBe('error');
  });
});