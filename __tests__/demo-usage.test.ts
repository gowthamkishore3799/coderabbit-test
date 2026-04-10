import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from '@coderabbit-test/shared-services';
import { demonstrateServices } from '../demo-usage';

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the intro banner', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('logs section headers for analytics and notifications', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => typeof c === 'string' && c.includes('Analytics Events'))).toBe(true);
    expect(calls.some((c) => typeof c === 'string' && c.includes('Notifications'))).toBe(true);
  });

  it('logs completion message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!'
    );
  });
});

describe('AnalyticsService (used by demo-usage.ts)', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks a user_login event as in demo-usage.ts', () => {
    const event: AnalyticsEvent = {
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: { browser: 'Chrome', version: '120.0.0' },
    };
    service.track(event);
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
  });

  it('tracks a page_view event as in demo-usage.ts', () => {
    service.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
    const events = service.getEvents();
    expect(events[0].eventName).toBe('page_view');
    expect(events[0].properties).toEqual({ page: '/dashboard', referrer: '/login' });
  });

  it('tracks both demo events and returns them all', () => {
    service.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: { browser: 'Chrome', version: '120.0.0' },
    });
    service.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('filters events by user ID', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'page_view', userId: 'user999', timestamp: new Date() });
    const userEvents = service.getEventsByUser('user123');
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].eventName).toBe('user_login');
  });

  it('exportEvents() returns JSON string of tracked events', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const exported = service.exportEvents();
    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('rejects an event missing eventName', () => {
    const invalid = { userId: 'user123', timestamp: new Date() } as unknown as AnalyticsEvent;
    expect(() => service.track(invalid)).toThrow();
  });

  it('rejects an event with empty eventName', () => {
    const invalid: AnalyticsEvent = { eventName: '', timestamp: new Date() };
    expect(() => service.track(invalid)).toThrow();
  });

  it('clearEvents() empties the event list', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('getEvents() returns a copy, not the internal array', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const copy = service.getEvents();
    copy.push({ eventName: 'injected', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });
});

describe('NotificationService (used by demo-usage.ts)', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a SUCCESS notification as in demo-usage.ts', () => {
    const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].message).toBe('You have successfully logged in.');
    expect(all[0].read).toBe(false);
  });

  it('sends an INFO notification as in demo-usage.ts', () => {
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('send() returns unique IDs for each notification', () => {
    const id1 = service.send(NotificationType.SUCCESS, 'A', 'msg1');
    const id2 = service.send(NotificationType.INFO, 'B', 'msg2');
    expect(id1).not.toBe(id2);
  });

  it('getAll() returns both notifications sent in demo-usage.ts', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    expect(service.getAll()).toHaveLength(2);
  });

  it('getUnread() returns only unread notifications', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'Login successful.');
    service.send(NotificationType.INFO, 'New Feature', 'Dashboard update.');
    const unread = service.getUnread();
    expect(unread).toHaveLength(2);
  });

  it('markAsRead() marks a specific notification as read', () => {
    const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'Login successful.');
    expect(service.markAsRead(id)).toBe(true);
    const all = service.getAll();
    const n = all.find((x) => x.id === id);
    expect(n?.read).toBe(true);
  });

  it('markAsRead() returns false for unknown ID', () => {
    expect(service.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead() marks all notifications as read', () => {
    service.send(NotificationType.SUCCESS, 'A', 'msg1');
    service.send(NotificationType.INFO, 'B', 'msg2');
    service.markAllAsRead();
    const unread = service.getUnread();
    expect(unread).toHaveLength(0);
  });

  it('subscribe() listener is called when notification is sent', () => {
    const received: Notification[] = [];
    service.subscribe((n) => received.push(n));
    service.send(NotificationType.WARNING, 'Heads up', 'Something happened.');
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe(NotificationType.WARNING);
  });

  it('subscribe() returns an unsubscribe function that stops future notifications', () => {
    const received: Notification[] = [];
    const unsubscribe = service.subscribe((n) => received.push(n));
    service.send(NotificationType.INFO, 'Before', 'msg1');
    unsubscribe();
    service.send(NotificationType.INFO, 'After', 'msg2');
    expect(received).toHaveLength(1);
    expect(received[0].title).toBe('Before');
  });

  it('clear() removes all notifications', () => {
    service.send(NotificationType.ERROR, 'Error', 'Something went wrong.');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('getAll() returns a copy, not the internal array', () => {
    service.send(NotificationType.INFO, 'Test', 'Testing immutability.');
    const copy = service.getAll();
    copy.splice(0, 1);
    expect(service.getAll()).toHaveLength(1);
  });

  it('notification has a timestamp set to approximately now', () => {
    const before = Date.now();
    service.send(NotificationType.INFO, 'Test', 'Timestamp check.');
    const after = Date.now();
    const n = service.getAll()[0];
    expect(n.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(n.timestamp.getTime()).toBeLessThanOrEqual(after);
  });
});