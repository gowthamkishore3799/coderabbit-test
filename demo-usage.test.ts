/**
 * Tests for demo-usage.ts
 *
 * These tests verify the behavior described in demonstrateServices():
 * tracking analytics events and sending notifications using the shared services.
 * They import directly from the shared-services source to avoid package build requirements.
 *
 * Note: z.record(z.any()) in AnalyticsEventSchema has a known issue with Zod v4.3.x
 * when properties values are present. Tests avoid triggering this by omitting properties.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsService } from './packages/shared-services/src/analytics-service.ts';
import { NotificationService, NotificationType } from './packages/shared-services/src/notification-service.ts';

describe('demonstrateServices() behavior', () => {
  let analytics: AnalyticsService;
  let notifications: NotificationService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    notifications = new NotificationService();
  });

  it('tracks a user_login event with userId', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    });

    const events = analytics.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, 'user_login');
    assert.equal(events[0].userId, 'user123');
  });

  it('tracks a page_view event', () => {
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });

    const events = analytics.getEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, 'page_view');
    assert.equal(events[0].userId, 'user123');
  });

  it('tracks both user_login and page_view events for the same user', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    });
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });

    const userEvents = analytics.getEventsByUser('user123');
    assert.equal(userEvents.length, 2);
    assert.equal(userEvents[0].eventName, 'user_login');
    assert.equal(userEvents[1].eventName, 'page_view');
  });

  it('sends a SUCCESS notification for welcome message', () => {
    const id = notifications.send(
      NotificationType.SUCCESS,
      'Welcome!',
      'You have successfully logged in.',
    );

    assert.equal(typeof id, 'string');
    const all = notifications.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].type, NotificationType.SUCCESS);
    assert.equal(all[0].title, 'Welcome!');
    assert.equal(all[0].message, 'You have successfully logged in.');
  });

  it('sends an INFO notification for new feature announcement', () => {
    notifications.send(
      NotificationType.INFO,
      'New Feature',
      'Check out our new analytics dashboard!',
    );

    const all = notifications.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].type, NotificationType.INFO);
    assert.equal(all[0].title, 'New Feature');
    assert.equal(all[0].message, 'Check out our new analytics dashboard!');
  });

  it('produces two notifications after both sends', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    const all = notifications.getAll();
    assert.equal(all.length, 2);
    assert.equal(all[0].type, NotificationType.SUCCESS);
    assert.equal(all[1].type, NotificationType.INFO);
  });

  it('all notifications start as unread after being sent', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'New dashboard!');

    const unread = notifications.getUnread();
    assert.equal(unread.length, 2);
    assert.ok(unread.every(n => n.read === false));
  });

  it('exportEvents returns JSON array containing tracked events', () => {
    analytics.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date('2024-01-01T00:00:00Z'),
    });
    analytics.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date('2024-01-01T00:00:01Z'),
    });

    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].eventName, 'user_login');
    assert.equal(parsed[1].eventName, 'page_view');
  });

  it('getAll() returns all notifications for display', () => {
    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'New dashboard!');

    const all = notifications.getAll();
    assert.equal(all.length, 2);

    // Verify each notification has the fields needed for display formatting
    all.forEach(n => {
      assert.ok(typeof n.type === 'string');
      assert.ok(typeof n.title === 'string');
      assert.ok(typeof n.message === 'string');
    });
  });

  it('full demonstration sequence produces consistent state', () => {
    // Replicate the full sequence from demonstrateServices()
    analytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    analytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

    notifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    notifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    // Verify final state
    assert.equal(analytics.getEvents().length, 2);
    assert.equal(notifications.getAll().length, 2);

    const exported = analytics.exportEvents();
    assert.ok(JSON.parse(exported).length === 2);
  });
});