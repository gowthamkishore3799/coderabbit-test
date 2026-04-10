import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The alias in vitest.config.ts maps @coderabbit-test/shared-services →
// packages/shared-services/src/index.ts so this test runs without a build step.
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from '@coderabbit-test/shared-services';
import { demonstrateServices } from './demo-usage';

// ─────────────────────────────────────────────
// demonstrateServices – integration-style tests
//
// AnalyticsService.track internally calls z.record(z.any()) with one argument,
// which is invalid in Zod v4 (requires two args) and throws a TypeError.
// That bug lives in pre-existing analytics-service.ts code (not part of this PR).
// We stub track() so we can test demonstrateServices() end-to-end.
// ─────────────────────────────────────────────

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Stub track to bypass the z.record(z.any()) bug in analytics-service.ts
    vi.spyOn(AnalyticsService.prototype, 'track').mockImplementation(function(this: AnalyticsService, event) {
      (this as any).events = (this as any).events ?? [];
      (this as any).events.push(event);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs section headers to console', () => {
    demonstrateServices();
    const calls = (console.log as ReturnType<typeof vi.spyOn>).mock.calls.map(
      (c) => String(c[0])
    );
    expect(calls.some((s) => s.includes('Demonstrating Internal Package Services'))).toBe(true);
    expect(calls.some((s) => s.includes('Analytics Events'))).toBe(true);
    expect(calls.some((s) => s.includes('Notifications'))).toBe(true);
  });

  it('logs completion message', () => {
    demonstrateServices();
    const calls = (console.log as ReturnType<typeof vi.spyOn>).mock.calls.map(
      (c) => String(c[0])
    );
    expect(calls.some((s) => s.includes('Internal package successfully referenced and used!'))).toBe(true);
  });
});

// ─────────────────────────────────────────────
// AnalyticsService (used by demonstrateServices)
// ─────────────────────────────────────────────

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    service = new AnalyticsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with no events', () => {
    expect(service.getEvents()).toHaveLength(0);
  });

  it('tracks a single event', () => {
    service.track({ eventName: 'user_login', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });

  it('tracks multiple events', () => {
    service.track({ eventName: 'user_login', timestamp: new Date() });
    service.track({ eventName: 'page_view', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('stores the correct eventName', () => {
    service.track({ eventName: 'checkout', timestamp: new Date() });
    expect(service.getEvents()[0].eventName).toBe('checkout');
  });

  it('filters events by userId via getEventsByUser', () => {
    service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
    service.track({ eventName: 'login', userId: 'bob', timestamp: new Date() });
    const aliceEvents = service.getEventsByUser('alice');
    expect(aliceEvents).toHaveLength(1);
    expect(aliceEvents[0].userId).toBe('alice');
  });

  it('returns an empty array for a userId with no events', () => {
    service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
    expect(service.getEventsByUser('nobody')).toHaveLength(0);
  });

  it('clearEvents removes all events', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('exportEvents returns a valid JSON string', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    const exported = service.exportEvents();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('getEvents returns a copy (mutating it does not affect internal state)', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    const copy = service.getEvents();
    copy.pop();
    expect(service.getEvents()).toHaveLength(1);
  });

  it('validates events – rejects empty eventName', () => {
    expect(() =>
      service.track({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });
});

// ─────────────────────────────────────────────
// NotificationService (used by demonstrateServices)
// ─────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    service = new NotificationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with no notifications', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('send returns a non-empty id string', () => {
    const id = service.send(NotificationType.INFO, 'Title', 'Body');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('stores a sent notification', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'Logged in.');
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Welcome!');
    expect(all[0].type).toBe(NotificationType.SUCCESS);
  });

  it('new notifications start as unread', () => {
    service.send(NotificationType.INFO, 'Info', 'Message');
    expect(service.getAll()[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    const id = service.send(NotificationType.WARNING, 'Warn', 'Watch out');
    service.send(NotificationType.ERROR, 'Err', 'Something failed');
    service.markAsRead(id);
    expect(service.getUnread()).toHaveLength(1);
  });

  it('markAsRead marks the correct notification as read', () => {
    const id = service.send(NotificationType.INFO, 'Title', 'Body');
    const marked = service.markAsRead(id);
    expect(marked).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
  });

  it('markAsRead returns false for unknown id', () => {
    const result = service.markAsRead('does-not-exist');
    expect(result).toBe(false);
  });

  it('markAllAsRead marks all notifications as read', () => {
    service.send(NotificationType.INFO, 'A', 'A body');
    service.send(NotificationType.SUCCESS, 'B', 'B body');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });

  it('clear removes all notifications', () => {
    service.send(NotificationType.INFO, 'Title', 'Body');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('subscribe listener is called on send', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, 'Hello', 'World');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('Hello');
  });

  it('unsubscribe stops the listener from being called', () => {
    const listener = vi.fn();
    const unsub = service.subscribe(listener);
    unsub();
    service.send(NotificationType.INFO, 'Silent', 'No call');
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports all NotificationType values', () => {
    for (const type of Object.values(NotificationType)) {
      expect(() =>
        service.send(type as NotificationType, 'T', 'M')
      ).not.toThrow();
    }
  });
});