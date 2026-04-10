/**
 * Tests for AnalyticsService and NotificationService from
 * @coderabbit-test/shared-services as used in demo-usage.ts.
 *
 * These tests import the actual implementations to verify runtime behavior.
 * Note: AnalyticsService.track() fails when events include a `properties`
 * field (z.record(z.any()) Zod 4.1.5 incompatibility) – that case is tested
 * separately.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

describe('AnalyticsService (used by demo-usage.ts)', () => {
  let service: AnalyticsService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AnalyticsService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should start with no events', () => {
    expect(service.getEvents()).toHaveLength(0);
  });

  it('should track an event and store it', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
    expect(service.getEvents()[0].eventName).toBe('user_login');
  });

  it('should track multiple events in order', () => {
    service.track({ eventName: 'event_a', userId: 'u1', timestamp: new Date() });
    service.track({ eventName: 'event_b', userId: 'u1', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
    expect(service.getEvents()[0].eventName).toBe('event_a');
    expect(service.getEvents()[1].eventName).toBe('event_b');
  });

  it('should track an event with no userId (optional field)', () => {
    service.track({ eventName: 'anonymous_event', timestamp: new Date() });
    expect(service.getEvents()[0].userId).toBeUndefined();
  });

  it('should filter events by userId', () => {
    service.track({ eventName: 'a', userId: 'user1', timestamp: new Date() });
    service.track({ eventName: 'b', userId: 'user2', timestamp: new Date() });
    const user1Events = service.getEventsByUser('user1');
    expect(user1Events).toHaveLength(1);
    expect(user1Events[0].eventName).toBe('a');
  });

  it('should return empty array for an unknown userId', () => {
    service.track({ eventName: 'a', userId: 'user1', timestamp: new Date() });
    expect(service.getEventsByUser('nobody')).toHaveLength(0);
  });

  it('should export events as a valid JSON string', () => {
    service.track({ eventName: 'click', userId: 'u1', timestamp: new Date() });
    const exported = service.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('click');
  });

  it('should export an empty array when no events tracked', () => {
    expect(JSON.parse(service.exportEvents())).toEqual([]);
  });

  it('should clear all events', () => {
    service.track({ eventName: 'a', userId: 'u1', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('should throw when eventName is empty', () => {
    expect(() =>
      service.track({ eventName: '', userId: 'u1', timestamp: new Date() })
    ).toThrow();
  });

  it('should return a defensive copy from getEvents()', () => {
    service.track({ eventName: 'a', userId: 'u1', timestamp: new Date() });
    const events = service.getEvents();
    events.push({ eventName: 'injected', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });
});

describe('NotificationService (used by demo-usage.ts)', () => {
  let service: NotificationService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new NotificationService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should send a notification and return a string id', () => {
    const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should store sent notifications', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(service.getAll()).toHaveLength(1);
    expect(service.getAll()[0].type).toBe(NotificationType.SUCCESS);
    expect(service.getAll()[0].title).toBe('Welcome!');
  });

  it('should support NotificationType.SUCCESS (value: "success")', () => {
    service.send(NotificationType.SUCCESS, 'Done', 'Success.');
    expect(service.getAll()[0].type).toBe('success');
  });

  it('should support NotificationType.INFO (value: "info")', () => {
    service.send(NotificationType.INFO, 'Info', 'FYI.');
    expect(service.getAll()[0].type).toBe('info');
  });

  it('should support NotificationType.WARNING (value: "warning")', () => {
    service.send(NotificationType.WARNING, 'Warn', 'Watch out.');
    expect(service.getAll()[0].type).toBe('warning');
  });

  it('should support NotificationType.ERROR (value: "error")', () => {
    service.send(NotificationType.ERROR, 'Error', 'Something failed.');
    expect(service.getAll()[0].type).toBe('error');
  });

  it('should mark notifications as unread by default', () => {
    service.send(NotificationType.INFO, 'Test', 'msg');
    expect(service.getAll()[0].read).toBe(false);
    expect(service.getUnread()).toHaveLength(1);
  });

  it('should mark a specific notification as read', () => {
    const id = service.send(NotificationType.WARNING, 'Warn', 'Msg');
    expect(service.markAsRead(id)).toBe(true);
    expect(service.getUnread()).toHaveLength(0);
    expect(service.getAll()[0].read).toBe(true);
  });

  it('should return false for a non-existent id', () => {
    expect(service.markAsRead('nonexistent-id')).toBe(false);
  });

  it('should mark all notifications as read', () => {
    service.send(NotificationType.INFO, 'A', 'msg1');
    service.send(NotificationType.ERROR, 'B', 'msg2');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
    expect(service.getAll().every(n => n.read)).toBe(true);
  });

  it('should notify listeners on send', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.SUCCESS, 'Title', 'Body');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('Title');
  });

  it('should stop calling listener after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.send(NotificationType.INFO, 'Title', 'Body');
    expect(listener).not.toHaveBeenCalled();
  });

  it('should clear all notifications', () => {
    service.send(NotificationType.INFO, 'X', 'Y');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('should return empty unread list initially', () => {
    expect(service.getUnread()).toHaveLength(0);
  });

  it('should return a defensive copy from getAll()', () => {
    service.send(NotificationType.INFO, 'A', 'B');
    const all = service.getAll();
    all.pop();
    expect(service.getAll()).toHaveLength(1);
  });

  it('should mirror the two-notification pattern from demo-usage.ts', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });
});