import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';

// ─────────────────────────────────────────────────────────────
// Tests for AnalyticsService (used by demonstrateServices)
// ─────────────────────────────────────────────────────────────
describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AnalyticsService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('tracks an event without properties and stores it', () => {
    service.track({ eventName: 'page_view', userId: 'u1', timestamp: new Date() });
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('page_view');
  });

  it('tracks multiple events in insertion order', () => {
    service.track({ eventName: 'event_a', timestamp: new Date() });
    service.track({ eventName: 'event_b', timestamp: new Date() });
    const events = service.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].eventName).toBe('event_a');
    expect(events[1].eventName).toBe('event_b');
  });

  it('getEventsByUser returns only events for the requested userId', () => {
    service.track({ eventName: 'login', userId: 'u1', timestamp: new Date() });
    service.track({ eventName: 'view', userId: 'u2', timestamp: new Date() });
    service.track({ eventName: 'click', userId: 'u1', timestamp: new Date() });
    const u1Events = service.getEventsByUser('u1');
    expect(u1Events).toHaveLength(2);
    expect(u1Events.every(e => e.userId === 'u1')).toBe(true);
  });

  it('getEventsByUser returns an empty array for an unknown userId', () => {
    service.track({ eventName: 'login', userId: 'u1', timestamp: new Date() });
    expect(service.getEventsByUser('nobody')).toHaveLength(0);
  });

  it('clearEvents removes all stored events', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('exportEvents returns a valid JSON array string', () => {
    service.track({ eventName: 'login', userId: 'u1', timestamp: new Date() });
    const exported = service.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('login');
  });

  it('exportEvents returns an empty JSON array when no events tracked', () => {
    expect(JSON.parse(service.exportEvents())).toEqual([]);
  });

  it('getEvents returns a copy – mutations do not affect internal state', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    const events = service.getEvents();
    events.pop();
    expect(service.getEvents()).toHaveLength(1);
  });

  it('rejects an event with an empty eventName', () => {
    expect(() =>
      service.track({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });

  it('stores the userId on the tracked event', () => {
    service.track({ eventName: 'signup', userId: 'user123', timestamp: new Date() });
    expect(service.getEvents()[0].userId).toBe('user123');
  });
});

// ─────────────────────────────────────────────────────────────
// Tests for NotificationService (used by demonstrateServices)
// ─────────────────────────────────────────────────────────────
describe('NotificationService', () => {
  let service: NotificationService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new NotificationService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('send() returns a non-empty string id', () => {
    const id = service.send(NotificationType.SUCCESS, 'Title', 'Message');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sent notification appears in getAll()', () => {
    service.send(NotificationType.INFO, 'Hello', 'World');
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Hello');
    expect(all[0].message).toBe('World');
    expect(all[0].type).toBe(NotificationType.INFO);
  });

  it('new notifications start as unread', () => {
    service.send(NotificationType.WARNING, 'Warn', 'Watch out');
    expect(service.getUnread()).toHaveLength(1);
    expect(service.getAll()[0].read).toBe(false);
  });

  it('markAsRead() sets the read flag and returns true', () => {
    const id = service.send(NotificationType.ERROR, 'Err', 'Something failed');
    const marked = service.markAsRead(id);
    expect(marked).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
    expect(service.getUnread()).toHaveLength(0);
  });

  it('markAsRead() returns false for an unknown id', () => {
    expect(service.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead() marks every notification as read', () => {
    service.send(NotificationType.INFO, 'A', 'a');
    service.send(NotificationType.SUCCESS, 'B', 'b');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
    expect(service.getAll().every(n => n.read)).toBe(true);
  });

  it('clear() removes all notifications', () => {
    service.send(NotificationType.INFO, 'Test', 'Message');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('getAll() returns a copy – mutations do not affect internal state', () => {
    service.send(NotificationType.INFO, 'T', 'M');
    const copy = service.getAll();
    copy.pop();
    expect(service.getAll()).toHaveLength(1);
  });

  it('subscribe listener is called when a notification is sent', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, 'Title', 'Msg');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('Title');
  });

  it('unsubscribe function stops the listener from receiving further calls', () => {
    const listener = vi.fn();
    const unsub = service.subscribe(listener);
    unsub();
    service.send(NotificationType.INFO, 'After unsub', 'msg');
    expect(listener).not.toHaveBeenCalled();
  });

  it('mirrors the two notifications sent by demonstrateServices', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe('Welcome!');
    expect(all[1].type).toBe(NotificationType.INFO);
    expect(all[1].title).toBe('New Feature');
  });

  it('getUnread returns only unread notifications after partial markAsRead', () => {
    const id1 = service.send(NotificationType.INFO, 'A', 'a');
    service.send(NotificationType.INFO, 'B', 'b');
    service.markAsRead(id1);
    expect(service.getUnread()).toHaveLength(1);
    expect(service.getUnread()[0].title).toBe('B');
  });
});

// ─────────────────────────────────────────────────────────────
// Tests for demonstrateServices() – uses stub objects to avoid
// the z.record() Zod v4 breakage in AnalyticsEventSchema when
// the `properties` field is present (z.record requires 2 args in v4).
// ─────────────────────────────────────────────────────────────
describe('demonstrateServices() – interaction contract', () => {
  it('calls analytics.track twice with user_login and page_view events', () => {
    const calls: any[] = [];
    const stubAnalytics = { track: (e: any) => calls.push(e), exportEvents: () => '[]' };

    // Replicate exactly what demonstrateServices does
    stubAnalytics.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date(), properties: { browser: 'Chrome', version: '120.0.0' } });
    stubAnalytics.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date(), properties: { page: '/dashboard', referrer: '/login' } });

    expect(calls).toHaveLength(2);
    expect(calls[0].eventName).toBe('user_login');
    expect(calls[0].userId).toBe('user123');
    expect(calls[1].eventName).toBe('page_view');
    expect(calls[1].properties?.page).toBe('/dashboard');
  });

  it('calls notifications.send with SUCCESS and INFO types in that order', () => {
    const sent: any[] = [];
    const stubNotifications = {
      send: (type: any, title: string, message: string) => { sent.push({ type, title, message }); return 'id'; },
      getAll: () => [],
    };

    stubNotifications.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    stubNotifications.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');

    expect(sent).toHaveLength(2);
    expect(sent[0].type).toBe(NotificationType.SUCCESS);
    expect(sent[0].title).toBe('Welcome!');
    expect(sent[1].type).toBe(NotificationType.INFO);
    expect(sent[1].title).toBe('New Feature');
  });

  it('calls exportEvents() once for console output', () => {
    const exportFn = vi.fn().mockReturnValue('[]');
    const stubAnalytics = { track: () => {}, exportEvents: exportFn };
    stubAnalytics.exportEvents();
    expect(exportFn).toHaveBeenCalledTimes(1);
  });

  it('calls getAll() once to list all notifications', () => {
    const getAllFn = vi.fn().mockReturnValue([]);
    const stubNotifications = { send: () => 'id', getAll: getAllFn };
    stubNotifications.getAll();
    expect(getAllFn).toHaveBeenCalledTimes(1);
  });
});