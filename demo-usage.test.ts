import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

/**
 * Tests for demo-usage.ts
 *
 * demonstrateServices() is a side-effectful function that uses module-level
 * AnalyticsService and NotificationService instances. We test the same service
 * interactions the function performs, verifying the behavior of the code that
 * was added in this PR.
 */

describe('demo-usage: AnalyticsService interactions', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  it('tracks a user_login event with correct properties', () => {
    const event = {
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: {
        browser: 'Chrome',
        version: '120.0.0',
      },
    };

    analytics.track(event);

    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
    expect(events[0].properties).toEqual({ browser: 'Chrome', version: '120.0.0' });
  });

  it('tracks a page_view event with correct properties', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: {
        page: '/dashboard',
        referrer: '/login',
      },
    });

    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('page_view');
    expect(events[0].properties?.page).toBe('/dashboard');
    expect(events[0].properties?.referrer).toBe('/login');
  });

  it('tracks multiple events and returns them all via getEvents()', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

    expect(analytics.getEvents()).toHaveLength(2);
  });

  it('exportEvents() returns a valid JSON string of all tracked events', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].eventName).toBe('user_login');
    expect(parsed[1].eventName).toBe('page_view');
  });

  it('exportEvents() returns an empty JSON array when no events tracked', () => {
    const exported = analytics.exportEvents();
    expect(JSON.parse(exported)).toEqual([]);
  });

  it('getEvents() returns a copy, not a reference to the internal array', () => {
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });

    const events1 = analytics.getEvents();
    const events2 = analytics.getEvents();

    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });
});

describe('demo-usage: NotificationService interactions', () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
  });

  it('send() with SUCCESS type stores a notification and returns an id string', () => {
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

  it('send() with INFO type stores a notification correctly', () => {
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
    expect(all[0].message).toBe('Check out our new analytics dashboard!');
  });

  it('getAll() returns all sent notifications', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    const all = notifications.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });

  it('each notification has a unique id', () => {
    const id1 = notifications.send(NotificationType.SUCCESS, 'A', 'msg1');
    const id2 = notifications.send(NotificationType.INFO, 'B', 'msg2');

    expect(id1).not.toBe(id2);
  });

  it('getAll() returns a copy, not a reference to the internal array', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');

    const arr1 = notifications.getAll();
    const arr2 = notifications.getAll();

    expect(arr1).not.toBe(arr2);
    expect(arr1).toEqual(arr2);
  });
});

describe('demo-usage: demonstrateServices() integration', () => {
  it('demonstrateServices() runs without throwing', async () => {
    // Suppress console output for the test
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const { demonstrateServices } = await import('./demo-usage');
      expect(() => demonstrateServices()).not.toThrow();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});