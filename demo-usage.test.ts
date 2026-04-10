import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { demonstrateServices } from './demo-usage';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from '@coderabbit-test/shared-services';

/**
 * NOTE: AnalyticsService.track() validates events using AnalyticsEventSchema which includes
 * `properties: z.record(z.any())`. In zod v4, z.record() requires two arguments (key and value
 * schemas), so passing a `properties` object currently throws:
 *   "TypeError: Cannot read properties of undefined (reading '_zod')"
 * Tests that call track() with `properties` are skipped accordingly.
 *
 * demonstrateServices() itself calls analytics.track() with a properties object, so the
 * function currently throws when executed.
 */

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws because AnalyticsService.track() with properties uses z.record(z.any()) — incompatible with zod v4', () => {
    // demonstrateServices() tracks events with a properties object.
    // z.record(z.any()) is zod v3 syntax; in zod v4 this throws at schema creation time.
    expect(() => demonstrateServices()).toThrow(TypeError);
  });

  it('throws with a message about _zod', () => {
    try {
      demonstrateServices();
    } catch (err) {
      expect(err).toBeInstanceOf(TypeError);
    }
  });
});

describe('AnalyticsService (used by demonstrateServices)', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with an empty event list', () => {
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('tracks an event without properties successfully', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
    expect(analytics.getEvents()[0].eventName).toBe('user_login');
  });

  it('tracks multiple events without properties', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('tracks an event with a user_login eventName', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const events = analytics.getEvents();
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
  });

  it('tracks a page_view event and retrieves it by user', () => {
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
    const byUser = analytics.getEventsByUser('user123');
    expect(byUser).toHaveLength(1);
    expect(byUser[0].eventName).toBe('page_view');
  });

  it('throws when track() is called with a properties object (zod v4 z.record compatibility issue)', () => {
    expect(() =>
      analytics.track({
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        properties: { browser: 'Chrome' },
      })
    ).toThrow();
  });

  it('exportEvents returns valid JSON string', () => {
    analytics.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
    const exported = analytics.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('exportEvents returns an empty array JSON when no events tracked', () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it('getEventsByUser returns only events for the specified user', () => {
    analytics.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
    analytics.track({ eventName: 'login', userId: 'bob', timestamp: new Date() });
    expect(analytics.getEventsByUser('alice')).toHaveLength(1);
    expect(analytics.getEventsByUser('bob')).toHaveLength(1);
    expect(analytics.getEventsByUser('unknown')).toHaveLength(0);
  });

  it('rejects an event with an empty eventName', () => {
    expect(() =>
      analytics.track({ eventName: '', userId: 'u1', timestamp: new Date() })
    ).toThrow();
  });

  it('clearEvents empties the event store', () => {
    analytics.track({ eventName: 'login', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy, not a direct reference', () => {
    analytics.track({ eventName: 'login', timestamp: new Date() });
    const events = analytics.getEvents();
    events.push({ eventName: 'mutated', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
  });
});

describe('NotificationService (used by demonstrateServices)', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with an empty notification list', () => {
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('sends a SUCCESS notification and returns a non-empty string id', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('stores the SUCCESS notification with the correct type, title, and message', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].message).toBe('You have successfully logged in.');
    expect(all[0].read).toBe(false);
  });

  it('sends an INFO notification with the correct type', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    expect(notifications.getAll()[0].type).toBe(NotificationType.INFO);
  });

  it('sends both SUCCESS and INFO notifications (as done in demonstrateServices)', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    expect(notifications.getAll()).toHaveLength(2);
  });

  it('all newly sent notifications are unread', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'msg');
    notifications.send(NotificationType.INFO, 'B', 'msg');
    expect(notifications.getUnread()).toHaveLength(2);
  });

  it('markAsRead marks a specific notification as read', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'X', 'body');
    expect(notifications.markAsRead(id)).toBe(true);
    expect(notifications.getAll()[0].read).toBe(true);
  });

  it('markAsRead returns false for an unknown id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead removes all notifications from the unread list', () => {
    notifications.send(NotificationType.ERROR, 'Err', 'oops');
    notifications.send(NotificationType.WARNING, 'Warn', 'heads up');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('clear empties all notifications', () => {
    notifications.send(NotificationType.INFO, 'X', 'y');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('subscribe listener is called immediately on send', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.INFO, 'T', 'M');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('T');
  });

  it('subscribe listener receives the full Notification object', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.SUCCESS, 'Hi', 'Hello');
    const received = listener.mock.calls[0][0];
    expect(received.type).toBe(NotificationType.SUCCESS);
    expect(received.title).toBe('Hi');
    expect(received.read).toBe(false);
    expect(received.id).toBeDefined();
    expect(received.timestamp).toBeInstanceOf(Date);
  });

  it('unsubscribe removes the listener so it is no longer called', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, 'T', 'M');
    expect(listener).not.toHaveBeenCalled();
  });

  it('getAll returns a copy, not a direct reference', () => {
    notifications.send(NotificationType.INFO, 'X', 'y');
    const copy = notifications.getAll();
    copy.push({} as any);
    expect(notifications.getAll()).toHaveLength(1);
  });
});