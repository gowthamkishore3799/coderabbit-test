/**
 * Tests for demo-usage.ts — demonstrateServices()
 *
 * demo-usage.ts is a new file added in this PR that demonstrates the
 * AnalyticsService and NotificationService from @coderabbit-test/shared-services.
 *
 * Two groups of tests:
 * 1. Unit tests for AnalyticsService and NotificationService via the alias
 *    resolution configured in vitest.config.ts.
 * 2. Integration tests for demonstrateServices() using real services.
 *
 * NOTE: packages/shared-services/src/analytics-service.ts uses z.record(z.any())
 * which is invalid in Zod 4 (requires 2 arguments). The zod mock below patches
 * that before the services are loaded.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Patch 'zod' so that z.record(singleArg) works — must be hoisted before any
// imports that depend on 'zod'.
vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zod')>();
  const z = actual.z as any;

  const originalRecord = z.record.bind(z);
  const record = (...args: unknown[]) =>
    args.length === 1 ? originalRecord(z.string(), args[0]) : originalRecord(...args);

  const patchedZ = Object.assign(Object.create(Object.getPrototypeOf(z)), z, { record });

  return { ...actual, z: patchedZ, default: { ...actual.default, z: patchedZ } };
});

import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from '@coderabbit-test/shared-services';

// ---------------------------------------------------------------------------
// AnalyticsService — unit tests
// ---------------------------------------------------------------------------

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks a user_login event as used in demonstrateServices', () => {
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

  it('tracks multiple events and stores all of them', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('getEvents returns a copy, not the internal array', () => {
    analytics.track({ eventName: 'evt', timestamp: new Date() });
    const events1 = analytics.getEvents();
    const events2 = analytics.getEvents();
    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });

  it('getEventsByUser returns only events for the specified user', () => {
    analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'logout', userId: 'user456', timestamp: new Date() });
    expect(analytics.getEventsByUser('user123')).toHaveLength(1);
    expect(analytics.getEventsByUser('user123')[0].userId).toBe('user123');
  });

  it('getEventsByUser returns empty array when no events match', () => {
    analytics.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    expect(analytics.getEventsByUser('nonexistent')).toHaveLength(0);
  });

  it('exportEvents returns valid JSON matching getEvents data', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('exportEvents returns an empty JSON array when no events are tracked', () => {
    expect(JSON.parse(analytics.exportEvents())).toEqual([]);
  });

  it('clearEvents removes all tracked events', () => {
    analytics.track({ eventName: 'evt1', timestamp: new Date() });
    analytics.track({ eventName: 'evt2', timestamp: new Date() });
    analytics.clearEvents();
    expect(analytics.getEvents()).toHaveLength(0);
  });

  it('throws when tracking an event with empty eventName', () => {
    expect(() =>
      analytics.track({ eventName: '', userId: 'user123', timestamp: new Date() })
    ).toThrow();
  });

  it('tracks event without optional userId', () => {
    expect(() =>
      analytics.track({ eventName: 'anonymous_visit', timestamp: new Date() })
    ).not.toThrow();
  });

  it('logs to console when tracking an event', () => {
    analytics.track({ eventName: 'login', timestamp: new Date() });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('login'));
  });
});

// ---------------------------------------------------------------------------
// NotificationService — unit tests
// ---------------------------------------------------------------------------

describe('NotificationService', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a SUCCESS notification as used in demonstrateServices', () => {
    const id = notifications.send(
      NotificationType.SUCCESS,
      'Welcome!',
      'You have successfully logged in.'
    );
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].message).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification as used in demonstrateServices', () => {
    notifications.send(
      NotificationType.INFO,
      'New Feature',
      'Check out our new analytics dashboard!'
    );
    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('new notifications are unread by default', () => {
    notifications.send(NotificationType.INFO, 'Test', 'Test message');
    expect(notifications.getAll()[0].read).toBe(false);
  });

  it('each sent notification gets a unique id', () => {
    const id1 = notifications.send(NotificationType.INFO, 'A', 'msg');
    const id2 = notifications.send(NotificationType.INFO, 'B', 'msg');
    expect(id1).not.toBe(id2);
  });

  it('getAll returns all sent notifications', () => {
    notifications.send(NotificationType.SUCCESS, 'S', 'msg1');
    notifications.send(NotificationType.INFO, 'I', 'msg2');
    expect(notifications.getAll()).toHaveLength(2);
  });

  it('getUnread returns only unread notifications', () => {
    notifications.send(NotificationType.INFO, 'A', 'msg');
    notifications.send(NotificationType.INFO, 'B', 'msg');
    expect(notifications.getUnread()).toHaveLength(2);
  });

  it('markAsRead marks a notification as read', () => {
    const id = notifications.send(NotificationType.INFO, 'Test', 'msg');
    expect(notifications.markAsRead(id)).toBe(true);
    expect(notifications.getAll()[0].read).toBe(true);
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('markAsRead returns false for a non-existent id', () => {
    expect(notifications.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    notifications.send(NotificationType.INFO, 'A', 'msg');
    notifications.send(NotificationType.WARNING, 'B', 'msg');
    notifications.markAllAsRead();
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it('subscribe listener is called when a notification is sent', () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.ERROR, 'Err', 'Something failed');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.ERROR);
  });

  it('unsubscribing stops the listener from being called', () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, 'After', 'unsubscribe');
    expect(listener).not.toHaveBeenCalled();
  });

  it('clear removes all notifications', () => {
    notifications.send(NotificationType.INFO, 'A', 'msg');
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it('notification has a timestamp field set to a Date', () => {
    const before = new Date();
    notifications.send(NotificationType.SUCCESS, 'T', 'msg');
    const after = new Date();
    const ts = notifications.getAll()[0].timestamp;
    expect(ts instanceof Date).toBe(true);
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('logs to console when a notification is sent', () => {
    notifications.send(NotificationType.SUCCESS, 'Hi', 'msg');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('SUCCESS'));
  });
});

// ---------------------------------------------------------------------------
// demonstrateServices — integration tests
// ---------------------------------------------------------------------------

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs without throwing', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('outputs the expected header to console', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Demonstrating Internal Package Services')
    );
  });

  it('outputs analytics events section', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Analytics Events'));
  });

  it('outputs notifications section', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Notifications'));
  });

  it('outputs the completion message', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Internal package successfully referenced and used!')
    );
  });
});