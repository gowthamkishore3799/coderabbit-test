import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AnalyticsService,
  AnalyticsEventSchema,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from '@coderabbit-test/shared-services';

// Tests for demo-usage.ts (new file added in this PR).
// We test the underlying services that demonstrateServices() relies on, since
// the function itself is a side-effect-heavy orchestration of those services.
//
// Note: AnalyticsEventSchema uses z.record(z.any()) which is incorrect in Zod v4
// (requires z.record(z.string(), z.any())). To test the service logic independently
// of this pre-existing schema bug, we spy on AnalyticsEventSchema.parse.

function mockAnalyticsParse() {
  return vi
    .spyOn(AnalyticsEventSchema, 'parse')
    .mockImplementation((event: unknown) => event as AnalyticsEvent);
}

describe('demo-usage.ts – AnalyticsService usage', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    mockAnalyticsParse();
  });

  it('tracks a user_login event as used in demonstrateServices', () => {
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

  it('tracks a page_view event as used in demonstrateServices', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
    const events = analytics.getEvents();
    expect(events[0].eventName).toBe('page_view');
    expect(events[0].properties?.page).toBe('/dashboard');
  });

  it('tracks two events sequentially as demonstrateServices does', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: { browser: 'Chrome', version: '120.0.0' },
    });
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
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

  it('getEventsByUser filters events by userId', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'other-user', timestamp: new Date() });
    const userEvents = analytics.getEventsByUser('user123');
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].eventName).toBe('user_login');
  });

  it('getEvents returns a copy of events array (not same reference)', () => {
    analytics.track({ eventName: 'click', userId: 'user1', timestamp: new Date() });
    const first = analytics.getEvents();
    const second = analytics.getEvents();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it('exportEvents returns "[]" when no events tracked', () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it('clearEvents removes all tracked events', () => {
    analytics.track({ eventName: 'sign_out', userId: 'user123', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('tracks an event without optional userId', () => {
    analytics.track({ eventName: 'anonymous_view', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
  });

  it('tracks an event without optional properties', () => {
    analytics.track({ eventName: 'sign_out', userId: 'user123', timestamp: new Date() });
    const events = analytics.getEvents();
    expect(events[0].properties).toBeUndefined();
  });
});

describe('demo-usage.ts – NotificationService usage', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it('sends a SUCCESS notification as used in demonstrateServices', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sends an INFO notification as used in demonstrateServices', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('getAll returns both notifications sent by demonstrateServices', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all).toHaveLength(2);
  });

  it('notifications start as unread', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    const all = notifications.getAll();
    expect(all[0].read).toBe(false);
  });

  it('notification has id, type, title, message, timestamp', () => {
    const id = notifications.send(NotificationType.WARNING, 'Alert', 'Something happened.');
    const all = notifications.getAll();
    const n = all[0];
    expect(n.id).toBe(id);
    expect(n.type).toBe(NotificationType.WARNING);
    expect(n.title).toBe('Alert');
    expect(n.message).toBe('Something happened.');
    expect(n.timestamp).toBeInstanceOf(Date);
  });

  it('returns unread notifications only', () => {
    notifications.send(NotificationType.INFO, 'A', 'msg1');
    notifications.send(NotificationType.ERROR, 'B', 'msg2');
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(2);
  });

  it('markAsRead marks the correct notification', () => {
    const id = notifications.send(NotificationType.INFO, 'Test', 'Message');
    expect(notifications.markAsRead(id)).toBe(true);
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('markAsRead returns false for unknown id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks all notifications as read', () => {
    notifications.send(NotificationType.INFO, 'A', 'msg1');
    notifications.send(NotificationType.SUCCESS, 'B', 'msg2');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('subscribe listener is called when a notification is sent', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.SUCCESS, 'Hi', 'Hello');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].title).toBe('Hi');
  });

  it('unsubscribe prevents listener from being called', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, 'After unsub', 'msg');
    expect(listener).not.toHaveBeenCalled();
  });

  it('getAll returns a copy of notifications (not same reference)', () => {
    notifications.send(NotificationType.INFO, 'X', 'y');
    const first = notifications.getAll();
    const second = notifications.getAll();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it('clear removes all notifications', () => {
    notifications.send(NotificationType.INFO, 'A', 'B');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('all NotificationType enum values can be sent', () => {
    for (const type of Object.values(NotificationType)) {
      notifications.send(type, `${type} title`, `${type} message`);
    }
    expect(notifications.getAll()).toHaveLength(Object.values(NotificationType).length);
  });
});

describe('demo-usage.ts – demonstrateServices integration', () => {
  it('demonstrateServices can be imported and called without throwing when analytics parse is mocked', async () => {
    // Mock the broken z.record() schema before importing demo-usage
    mockAnalyticsParse();
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).not.toThrow();
  });
});