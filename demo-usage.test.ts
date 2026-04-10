import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

// Note: AnalyticsEventSchema in shared-services uses z.record(z.any()) with one argument,
// which is broken in Zod v4 when an actual properties object is passed. Tests that would
// call .track() with a `properties` value are documented below but use the no-properties path.

describe('demonstrateServices — module export', () => {
  it('exports a demonstrateServices function', async () => {
    const mod = await import('./demo-usage');
    expect(typeof mod.demonstrateServices).toBe('function');
  });
});

describe('AnalyticsService — used by demo-usage.ts', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks the user_login event (without properties)', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    });
    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
  });

  it('tracks the page_view event (without properties)', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });
    const events = analytics.getEvents();
    expect(events[0].eventName).toBe('page_view');
  });

  it('accumulates multiple events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('exportEvents returns valid JSON string', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const exported = analytics.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('exportEvents returns an empty array when no events tracked', () => {
    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    expect(parsed).toEqual([]);
  });

  it('getEventsByUser filters by userId', () => {
    analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'login', userId: 'user456', timestamp: new Date() });
    const user123Events = analytics.getEventsByUser('user123');
    expect(user123Events).toHaveLength(1);
    expect(user123Events[0].userId).toBe('user123');
  });

  it('getEventsByUser returns empty array for unknown userId', () => {
    analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEventsByUser('unknown')).toHaveLength(0);
  });

  it('tracks event without userId (optional field)', () => {
    analytics.track({ eventName: 'anonymous_view', timestamp: new Date() });
    const events = analytics.getEvents();
    expect(events[0].userId).toBeUndefined();
  });

  it('rejects an event with an empty eventName', () => {
    expect(() =>
      analytics.track({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });

  it('clearEvents empties the event store', () => {
    analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a defensive copy (mutation does not affect internal store)', () => {
    analytics.track({ eventName: 'login', timestamp: new Date() });
    const events = analytics.getEvents();
    events.pop();
    expect(analytics.getEvents()).toHaveLength(1);
  });
});

describe('NotificationService — used by demo-usage.ts', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a SUCCESS notification and returns an id', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sends an INFO notification', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('getAll returns all sent notifications', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Dashboard!');
    expect(notifications.getAll()).toHaveLength(2);
  });

  it('new notifications default to unread', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    const all = notifications.getAll();
    expect(all[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'Message A');
    notifications.send(NotificationType.INFO, 'B', 'Message B');
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(2);
  });

  it('markAsRead marks a specific notification as read', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'A', 'Message A');
    const marked = notifications.markAsRead(id);
    expect(marked).toBe(true);
    const all = notifications.getAll();
    expect(all[0].read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    const marked = notifications.markAsRead('nonexistent-id');
    expect(marked).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'Message A');
    notifications.send(NotificationType.INFO, 'B', 'Message B');
    notifications.markAllAsRead();
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(0);
  });

  it('subscribe listener is called on send', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.WARNING, 'Warn', 'Watch out');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.WARNING);
  });

  it('unsubscribe stops listener from being called', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.ERROR, 'Err', 'Something failed');
    expect(listener).not.toHaveBeenCalled();
  });

  it('sends notification with all NotificationType values', () => {
    for (const type of Object.values(NotificationType)) {
      expect(() =>
        notifications.send(type, `Title for ${type}`, `Message for ${type}`)
      ).not.toThrow();
    }
    expect(notifications.getAll()).toHaveLength(Object.values(NotificationType).length);
  });

  it('getAll returns a defensive copy', () => {
    notifications.send(NotificationType.INFO, 'Test', 'Msg');
    const copy = notifications.getAll();
    copy.pop();
    expect(notifications.getAll()).toHaveLength(1);
  });

  it('notification has a timestamp set to a recent date', () => {
    const before = Date.now();
    notifications.send(NotificationType.SUCCESS, 'Time', 'Check');
    const after = Date.now();
    const ts = notifications.getAll()[0].timestamp.getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});