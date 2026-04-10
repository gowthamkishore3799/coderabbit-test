import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from '@coderabbit-test/shared-services';

// demonstrateServices uses module-level singletons so we test the
// underlying services (which it exercises) and the exported function directly.
import { demonstrateServices } from './demo-usage';

describe('demo-usage.ts – demonstrateServices()', () => {
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

  it('logs the header banner', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n',
    );
  });

  it('logs the analytics section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('logs the notifications section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('logs the completion banner', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '\n=== Service Recognition Test Complete ===',
    );
  });

  it('logs the success message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!',
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

  it('starts with no events', () => {
    expect(service.getEvents()).toHaveLength(0);
  });

  it('tracks a valid event and stores it', () => {
    const event: AnalyticsEvent = {
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
      properties: { browser: 'Chrome' },
    };
    service.track(event);
    expect(service.getEvents()).toHaveLength(1);
    expect(service.getEvents()[0].eventName).toBe('user_login');
  });

  it('tracks multiple events independently', () => {
    service.track({ eventName: 'user_login', timestamp: new Date() });
    service.track({ eventName: 'page_view', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('filters events by userId', () => {
    service.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'login', userId: 'user456', timestamp: new Date() });
    const events = service.getEventsByUser('user123');
    expect(events).toHaveLength(1);
    expect(events[0].userId).toBe('user123');
  });

  it('returns empty array when no events match userId', () => {
    service.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    expect(service.getEventsByUser('unknown')).toHaveLength(0);
  });

  it('clears all events', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy (mutation does not affect internal state)', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    const events = service.getEvents();
    events.pop();
    expect(service.getEvents()).toHaveLength(1);
  });

  it('exportEvents returns valid JSON string', () => {
    service.track({ eventName: 'page_view', timestamp: new Date() });
    const json = service.exportEvents();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('page_view');
  });

  it('rejects an event with empty eventName', () => {
    expect(() =>
      service.track({ eventName: '', timestamp: new Date() }),
    ).toThrow();
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

  it('starts with no notifications', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('send() returns a non-empty string id', () => {
    const id = service.send(NotificationType.SUCCESS, 'Title', 'Message');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('stores the sent notification', () => {
    service.send(NotificationType.INFO, 'Hello', 'World');
    expect(service.getAll()).toHaveLength(1);
  });

  it('sent notification has correct type, title, and message', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You are in.');
    const notifications = service.getAll();
    expect(notifications[0].type).toBe(NotificationType.SUCCESS);
    expect(notifications[0].title).toBe('Welcome!');
    expect(notifications[0].message).toBe('You are in.');
  });

  it('new notification is unread by default', () => {
    service.send(NotificationType.INFO, 'Test', 'Msg');
    expect(service.getAll()[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    service.send(NotificationType.INFO, 'A', 'Msg');
    service.send(NotificationType.WARNING, 'B', 'Msg');
    expect(service.getUnread()).toHaveLength(2);
  });

  it('markAsRead marks the notification as read', () => {
    const id = service.send(NotificationType.ERROR, 'Err', 'Details');
    const marked = service.markAsRead(id);
    expect(marked).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
    expect(service.getUnread()).toHaveLength(0);
  });

  it('markAsRead returns false for unknown id', () => {
    const result = service.markAsRead('nonexistent-id');
    expect(result).toBe(false);
  });

  it('markAllAsRead marks all notifications as read', () => {
    service.send(NotificationType.INFO, 'A', 'Msg');
    service.send(NotificationType.SUCCESS, 'B', 'Msg');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });

  it('clear() removes all notifications', () => {
    service.send(NotificationType.INFO, 'A', 'Msg');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('getAll returns a copy (mutation does not affect internal state)', () => {
    service.send(NotificationType.INFO, 'A', 'Msg');
    const all = service.getAll();
    all.pop();
    expect(service.getAll()).toHaveLength(1);
  });

  it('subscribe listener is called on send', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, 'Test', 'Msg');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].title).toBe('Test');
  });

  it('unsubscribe removes the listener', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.send(NotificationType.WARNING, 'No call', 'Should not fire');
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports all NotificationType values', () => {
    for (const type of Object.values(NotificationType)) {
      service.send(type, 'Title', 'Body');
    }
    expect(service.getAll()).toHaveLength(Object.values(NotificationType).length);
  });

  // Boundary / regression case
  it('two sends produce two distinct ids', () => {
    const id1 = service.send(NotificationType.INFO, 'A', 'Msg');
    const id2 = service.send(NotificationType.INFO, 'B', 'Msg');
    expect(id1).not.toBe(id2);
  });
});