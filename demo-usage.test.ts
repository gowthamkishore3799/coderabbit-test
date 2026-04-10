import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('executes without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the service header', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('logs the completion message', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(
      '=== Service Recognition Test Complete ==='
    );
    expect(console.log).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!'
    );
  });
});

describe('AnalyticsService (used in demo-usage.ts)', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it('tracks a user_login event and stores it', () => {
    service.track({
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: { browser: 'Chrome' },
    });
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
  });

  it('tracks a page_view event and stores it', () => {
    service.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
      properties: { page: '/dashboard', referrer: '/login' },
    });
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('page_view');
    expect(events[0].properties?.page).toBe('/dashboard');
  });

  it('tracks multiple events', () => {
    service.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
    service.track({ eventName: 'page_view', userId: 'u1', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('getEventsByUser returns only events for that user', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'user_login', userId: 'other_user', timestamp: new Date() });

    const userEvents = service.getEventsByUser('user123');
    expect(userEvents).toHaveLength(2);
    expect(userEvents.every(e => e.userId === 'user123')).toBe(true);
  });

  it('exportEvents returns valid JSON string of tracked events', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

    const exported = service.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('exportEvents returns empty array JSON when no events tracked', () => {
    const exported = service.exportEvents();
    const parsed = JSON.parse(exported);
    expect(parsed).toEqual([]);
  });

  it('getEvents returns a copy (not the internal array)', () => {
    service.track({ eventName: 'e1', timestamp: new Date() });
    const events1 = service.getEvents();
    events1.push({ eventName: 'mutated', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });

  it('clearEvents empties the event store', () => {
    service.track({ eventName: 'user_login', userId: 'u1', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('rejects an event with empty eventName', () => {
    expect(() =>
      service.track({ eventName: '', userId: 'u1', timestamp: new Date() })
    ).toThrow();
  });
});

describe('NotificationService (used in demo-usage.ts)', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('sends a SUCCESS notification and returns an id', () => {
    const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'You have logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sends an INFO notification and stores it', () => {
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
    expect(all[0].message).toBe('Check out our new analytics dashboard!');
  });

  it('sends multiple notifications and getAll returns all of them', () => {
    service.send(NotificationType.SUCCESS, 'Title 1', 'Msg 1');
    service.send(NotificationType.INFO, 'Title 2', 'Msg 2');
    expect(service.getAll()).toHaveLength(2);
  });

  it('newly sent notifications are unread', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You logged in.');
    const all = service.getAll();
    expect(all[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    service.send(NotificationType.SUCCESS, 'T1', 'M1');
    service.send(NotificationType.INFO, 'T2', 'M2');
    const unread = service.getUnread();
    expect(unread).toHaveLength(2);
  });

  it('markAsRead marks the correct notification as read', () => {
    const id = service.send(NotificationType.SUCCESS, 'T1', 'M1');
    const result = service.markAsRead(id);
    expect(result).toBe(true);
    const notification = service.getAll().find(n => n.id === id);
    expect(notification?.read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    const result = service.markAsRead('non-existent-id');
    expect(result).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    service.send(NotificationType.SUCCESS, 'T1', 'M1');
    service.send(NotificationType.INFO, 'T2', 'M2');
    service.markAllAsRead();
    const unread = service.getUnread();
    expect(unread).toHaveLength(0);
  });

  it('getAll returns a copy (not the internal array)', () => {
    service.send(NotificationType.INFO, 'T', 'M');
    const all = service.getAll();
    all.push({} as any);
    expect(service.getAll()).toHaveLength(1);
  });

  it('subscribe listener is called when notification is sent', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.WARNING, 'Alert', 'Something happened');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('Alert');
  });

  it('unsubscribing removes the listener', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.send(NotificationType.INFO, 'T', 'M');
    expect(listener).not.toHaveBeenCalled();
  });

  it('clear removes all notifications', () => {
    service.send(NotificationType.SUCCESS, 'T1', 'M1');
    service.send(NotificationType.ERROR, 'T2', 'M2');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('notifications each have a unique id', () => {
    const id1 = service.send(NotificationType.SUCCESS, 'T1', 'M1');
    const id2 = service.send(NotificationType.INFO, 'T2', 'M2');
    expect(id1).not.toBe(id2);
  });
});