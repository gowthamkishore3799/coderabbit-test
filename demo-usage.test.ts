/**
 * Tests for demo-usage.ts
 *
 * Tests the demonstrateServices() function which uses AnalyticsService
 * and NotificationService from @coderabbit-test/shared-services.
 */

import { AnalyticsService, NotificationService, NotificationType } from './packages/shared-services/src/index';

// Re-implement demonstrateServices() logic under test using fresh service instances
// (The module-level instances in demo-usage.ts are not easily injectable,
//  so we test the same logic with controlled instances.)

describe('demonstrateServices logic', () => {
  let analytics: AnalyticsService;
  let notifications: NotificationService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    notifications = new NotificationService();
  });

  afterEach(() => {
    analytics.clearEvents();
    notifications.clear();
  });

  describe('AnalyticsService usage in demonstrateServices', () => {
    it('tracks user_login event with expected shape', () => {
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

    it('tracks page_view event with expected shape', () => {
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
      expect(events[0].properties).toEqual({ page: '/dashboard', referrer: '/login' });
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

      const events = analytics.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventName).toBe('user_login');
      expect(events[1].eventName).toBe('page_view');
    });

    it('exportEvents returns valid JSON string after tracking', () => {
      analytics.track({
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        properties: { browser: 'Chrome', version: '120.0.0' },
      });

      const exported = analytics.exportEvents();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].eventName).toBe('user_login');
    });

    it('getEventsByUser returns only events for the given user', () => {
      analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      analytics.track({ eventName: 'page_view', userId: 'user456', timestamp: new Date() });

      const user123Events = analytics.getEventsByUser('user123');
      expect(user123Events).toHaveLength(1);
      expect(user123Events[0].eventName).toBe('user_login');
    });
  });

  describe('NotificationService usage in demonstrateServices', () => {
    it('sends SUCCESS notification with correct fields', () => {
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
      expect(all[0].read).toBe(false);
    });

    it('sends INFO notification with correct fields', () => {
      notifications.send(
        NotificationType.INFO,
        'New Feature',
        'Check out our new analytics dashboard!'
      );

      const all = notifications.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].type).toBe(NotificationType.INFO);
      expect(all[0].title).toBe('New Feature');
      expect(all[0].message).toBe('Check out our new analytics dashboard!');
    });

    it('sends two notifications sequentially as demonstrateServices does', () => {
      notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

      const all = notifications.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].type).toBe(NotificationType.SUCCESS);
      expect(all[1].type).toBe(NotificationType.INFO);
    });

    it('all notifications start as unread', () => {
      notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
      notifications.send(NotificationType.INFO, 'Info', 'Some info.');

      const unread = notifications.getUnread();
      expect(unread).toHaveLength(2);
    });

    it('getAll returns a copy and does not expose internal array', () => {
      notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');

      const first = notifications.getAll();
      const second = notifications.getAll();

      expect(first).not.toBe(second); // Different array references
      expect(first).toEqual(second);
    });
  });

  describe('demonstrateServices integration', () => {
    it('service instances are independent between runs', () => {
      // Simulates that a new call to demonstrateServices with fresh instances
      // starts with empty state
      const freshAnalytics = new AnalyticsService();
      expect(freshAnalytics.getEvents()).toHaveLength(0);

      const freshNotifications = new NotificationService();
      expect(freshNotifications.getAll()).toHaveLength(0);
    });

    it('clearEvents resets the analytics event list', () => {
      analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      expect(analytics.getEvents()).toHaveLength(1);

      analytics.clearEvents();
      expect(analytics.getEvents()).toHaveLength(0);
    });

    it('clear resets the notification list', () => {
      notifications.send(NotificationType.SUCCESS, 'Hi', 'Hello.');
      expect(notifications.getAll()).toHaveLength(1);

      notifications.clear();
      expect(notifications.getAll()).toHaveLength(0);
    });
  });
});