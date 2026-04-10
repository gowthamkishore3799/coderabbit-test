import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test via the shared-services directly to avoid module-level singleton coupling
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from '@coderabbit-test/shared-services';

describe('demonstrateServices – AnalyticsService integration', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  it('tracks a user_login event and stores it', () => {
    const event: AnalyticsEvent = {
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    };

    analytics.track(event);

    const stored = analytics.getEvents();
    expect(stored).toHaveLength(1);
    expect(stored[0].eventName).toBe('user_login');
    expect(stored[0].userId).toBe('user123');
  });

  it('tracks a page_view event and stores it', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });

    const stored = analytics.getEvents();
    expect(stored).toHaveLength(1);
    expect(stored[0].eventName).toBe('page_view');
  });

  it('accumulates multiple tracked events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('getEventsByUser returns only events for that user', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user456', timestamp: new Date() });

    const user123Events = analytics.getEventsByUser('user123');
    expect(user123Events).toHaveLength(1);
    expect(user123Events[0].eventName).toBe('user_login');
  });

  it('exportEvents returns valid JSON string of tracked events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });

    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('exportEvents returns empty array JSON when no events tracked', () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it('clearEvents removes all stored events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy, not the internal array', () => {
    analytics.track({ eventName: 'user_login', timestamp: new Date() });
    const copy1 = analytics.getEvents();
    const copy2 = analytics.getEvents();
    expect(copy1).not.toBe(copy2);
    expect(copy1).toEqual(copy2);
  });

  it('rejects an event with an empty eventName', () => {
    expect(() =>
      analytics.track({ eventName: '', userId: 'user123', timestamp: new Date() })
    ).toThrow();
  });
});

describe('demonstrateServices – NotificationService integration', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it('sends a SUCCESS notification and returns an id string', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sends an INFO notification and stores it', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
    expect(all[0].message).toBe('Check out our new analytics dashboard!');
  });

  it('stores both SUCCESS and INFO notifications as in demonstrateServices', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    const all = notifications.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });

  it('new notifications start as unread', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(1);
    expect(unread[0].read).toBe(false);
  });

  it('markAsRead marks a notification as read', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    const result = notifications.markAsRead(id);
    expect(result).toBe(true);
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('markAsRead returns false for unknown id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks all notifications as read', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'Message A');
    notifications.send(NotificationType.INFO, 'B', 'Message B');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('subscribe listener is called when a notification is sent', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.WARNING, 'Alert', 'Something happened.');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('Alert');
  });

  it('unsubscribe prevents further listener calls', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.ERROR, 'Error', 'Something failed.');
    expect(listener).not.toHaveBeenCalled();
  });

  it('clear removes all notifications', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'A msg');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('getAll returns a copy of notifications, not the internal array', () => {
    notifications.send(NotificationType.INFO, 'Info', 'Some info.');
    const copy1 = notifications.getAll();
    const copy2 = notifications.getAll();
    expect(copy1).not.toBe(copy2);
    expect(copy1).toEqual(copy2);
  });

  it('sends all four notification types without error', () => {
    expect(() => {
      notifications.send(NotificationType.INFO, 'i', 'msg');
      notifications.send(NotificationType.WARNING, 'w', 'msg');
      notifications.send(NotificationType.ERROR, 'e', 'msg');
      notifications.send(NotificationType.SUCCESS, 's', 'msg');
    }).not.toThrow();
    expect(notifications.getAll()).toHaveLength(4);
  });
});

describe('demonstrateServices – module export', () => {
  it('exports demonstrateServices as a named function', async () => {
    const mod = await import('./demo-usage');
    expect(typeof mod.demonstrateServices).toBe('function');
  });
});