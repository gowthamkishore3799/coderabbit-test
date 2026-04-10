import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from '@coderabbit-test/shared-services';
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('calls console.log with header message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('=== Demonstrating Internal Package Services ===\n');
  });

  it('logs analytics events section', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('logs notifications section', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('logs completion message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
    expect(consoleSpy).toHaveBeenCalledWith('Internal package successfully referenced and used!');
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });
});

describe('AnalyticsService (used in demo-usage.ts)', () => {
  let analytics: AnalyticsService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    analytics = new AnalyticsService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('tracks a user_login event as in demonstrateServices', () => {
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

  it('tracks a page_view event as in demonstrateServices', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
    const events = analytics.getEvents();
    expect(events[0].eventName).toBe('page_view');
    expect(events[0].properties).toEqual({ page: '/dashboard', referrer: '/login' });
  });

  it('tracks multiple events', () => {
    analytics.track({ eventName: 'event_1', timestamp: new Date() });
    analytics.track({ eventName: 'event_2', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('getEventsByUser returns only events for that user', () => {
    analytics.track({ eventName: 'a', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'b', userId: 'other', timestamp: new Date() });
    analytics.track({ eventName: 'c', userId: 'user123', timestamp: new Date() });
    const userEvents = analytics.getEventsByUser('user123');
    expect(userEvents).toHaveLength(2);
    expect(userEvents.every(e => e.userId === 'user123')).toBe(true);
  });

  it('getEventsByUser returns empty array for unknown user', () => {
    analytics.track({ eventName: 'a', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEventsByUser('nonexistent')).toEqual([]);
  });

  it('exportEvents returns valid JSON string', () => {
    analytics.track({ eventName: 'test', userId: 'u1', timestamp: new Date() });
    const exported = analytics.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('test');
  });

  it('exportEvents returns empty array JSON when no events tracked', () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it('clearEvents empties the event list', () => {
    analytics.track({ eventName: 'event_1', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy, not the internal array', () => {
    analytics.track({ eventName: 'test', timestamp: new Date() });
    const events = analytics.getEvents();
    events.push({ eventName: 'fake', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(1);
  });

  it('rejects event with empty eventName', () => {
    expect(() =>
      analytics.track({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });

  it('accepts event without optional userId and properties', () => {
    expect(() =>
      analytics.track({ eventName: 'minimal', timestamp: new Date() })
    ).not.toThrow();
  });
});

describe('NotificationService (used in demo-usage.ts)', () => {
  let notifications: NotificationService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    notifications = new NotificationService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('sends a SUCCESS notification as in demonstrateServices', () => {
    const id = notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].message).toBe('You have successfully logged in.');
    expect(all[0].read).toBe(false);
  });

  it('sends an INFO notification as in demonstrateServices', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('sends two notifications and getAll returns both', () => {
    notifications.send(NotificationType.SUCCESS, 'A', 'msg1');
    notifications.send(NotificationType.INFO, 'B', 'msg2');
    expect(notifications.getAll()).toHaveLength(2);
  });

  it('getAll returns a copy, not the internal array', () => {
    notifications.send(NotificationType.INFO, 'T', 'msg');
    const all = notifications.getAll();
    all.push({ id: 'fake', type: NotificationType.ERROR, title: 'X', message: 'X', timestamp: new Date(), read: false });
    expect(notifications.getAll()).toHaveLength(1);
  });

  it('getUnread returns only unread notifications', () => {
    notifications.send(NotificationType.INFO, 'A', 'msgA');
    notifications.send(NotificationType.WARNING, 'B', 'msgB');
    expect(notifications.getUnread()).toHaveLength(2);
  });

  it('markAsRead marks a notification as read', () => {
    const id = notifications.send(NotificationType.INFO, 'T', 'msg');
    expect(notifications.markAsRead(id)).toBe(true);
    expect(notifications.getUnread()).toHaveLength(0);
    expect(notifications.getAll()[0].read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks all notifications as read', () => {
    notifications.send(NotificationType.INFO, 'A', 'msgA');
    notifications.send(NotificationType.SUCCESS, 'B', 'msgB');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
    expect(notifications.getAll().every(n => n.read)).toBe(true);
  });

  it('subscribe listener is called on send', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.ERROR, 'Err', 'Something went wrong');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.ERROR);
  });

  it('unsubscribe removes the listener', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, 'T', 'msg');
    expect(listener).not.toHaveBeenCalled();
  });

  it('clear empties all notifications', () => {
    notifications.send(NotificationType.INFO, 'A', 'msgA');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('each sent notification has a unique id', () => {
    const id1 = notifications.send(NotificationType.INFO, 'A', 'msgA');
    const id2 = notifications.send(NotificationType.INFO, 'B', 'msgB');
    expect(id1).not.toBe(id2);
  });

  it('notification timestamp is a Date', () => {
    notifications.send(NotificationType.WARNING, 'W', 'msg');
    expect(notifications.getAll()[0].timestamp).toBeInstanceOf(Date);
  });
});