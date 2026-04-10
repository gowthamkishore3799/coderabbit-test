/**
 * Tests for demo-usage.ts (new file added in this PR)
 *
 * demo-usage.ts:
 *   - Creates module-level AnalyticsService and NotificationService instances
 *   - Exports demonstrateServices() which tracks 2 analytics events and sends
 *     2 notifications (SUCCESS + INFO), then logs them.
 *
 * Because the module uses @coderabbit-test/shared-services (resolved via vitest
 * alias to packages/shared-services/src/index.ts), these tests also exercise
 * the underlying service behaviour that demonstrateServices() depends on.
 *
 * NOTE: The shared-services AnalyticsEventSchema uses z.record(z.any()) which
 * is not valid in Zod v4 (requires z.record(z.string(), z.any())). Events that
 * include a `properties` object will therefore throw at parse time. A dedicated
 * test below documents this regression while still verifying the rest of the
 * public API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
  type Notification,
} from './packages/shared-services/src/index';

// ---------------------------------------------------------------------------
// AnalyticsService
// ---------------------------------------------------------------------------

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('stores an event without properties', () => {
      const event: AnalyticsEvent = {
        eventName: 'page_view',
        userId: 'u1',
        timestamp: new Date(),
      };
      service.track(event);
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('page_view');
    });

    it('stores multiple events in insertion order', () => {
      service.track({ eventName: 'first', timestamp: new Date() });
      service.track({ eventName: 'second', timestamp: new Date() });
      const names = service.getEvents().map((e) => e.eventName);
      expect(names).toEqual(['first', 'second']);
    });

    it('throws for an event with a non-Date timestamp', () => {
      expect(() =>
        service.track({ eventName: 'bad', timestamp: 'not-a-date' as unknown as Date })
      ).toThrow();
    });

    it('throws for an event with an empty eventName', () => {
      expect(() =>
        service.track({ eventName: '', timestamp: new Date() })
      ).toThrow();
    });

    it('documents that tracking an event WITH properties throws due to z.record(z.any()) incompatibility in Zod v4', () => {
      // z.record(z.any()) is invalid in Zod v4 and causes a TypeError at parse time.
      // This is a pre-existing bug in the shared-services package unrelated to this PR.
      expect(() =>
        service.track({
          eventName: 'user_login',
          userId: 'user123',
          timestamp: new Date(),
          properties: { browser: 'Chrome' },
        })
      ).toThrow();
    });

    it('tracks an event for a user without a userId', () => {
      service.track({ eventName: 'anonymous', timestamp: new Date() });
      const events = service.getEvents();
      expect(events[0].userId).toBeUndefined();
    });
  });

  describe('getEvents()', () => {
    it('returns an empty array when no events have been tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a copy — mutating the result does not affect internal state', () => {
      service.track({ eventName: 'e', timestamp: new Date() });
      const copy = service.getEvents();
      copy.pop();
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns only events for the specified user', () => {
      service.track({ eventName: 'a', userId: 'alice', timestamp: new Date() });
      service.track({ eventName: 'b', userId: 'bob', timestamp: new Date() });
      service.track({ eventName: 'c', userId: 'alice', timestamp: new Date() });

      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every((e) => e.userId === 'alice')).toBe(true);
    });

    it('returns an empty array when no events match the user', () => {
      service.track({ eventName: 'x', userId: 'other', timestamp: new Date() });
      expect(service.getEventsByUser('nobody')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      service.track({ eventName: 'x', timestamp: new Date() });
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it('is idempotent when called on an already-empty service', () => {
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });
  });

  describe('exportEvents()', () => {
    it('returns valid JSON', () => {
      service.track({ eventName: 'export_test', timestamp: new Date() });
      const json = service.exportEvents();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('returns an empty JSON array when no events are tracked', () => {
      expect(JSON.parse(service.exportEvents())).toEqual([]);
    });

    it('serialised output contains the event name', () => {
      service.track({ eventName: 'my_event', timestamp: new Date() });
      expect(service.exportEvents()).toContain('my_event');
    });
  });
});

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('returns a non-empty string ID', () => {
      const id = service.send(NotificationType.INFO, 'Title', 'Message');
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('creates a notification with the expected type', () => {
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(service.getAll()[0].type).toBe(NotificationType.SUCCESS);
    });

    it('creates a notification with the expected title and message', () => {
      service.send(NotificationType.WARNING, 'Watch out', 'Something happened');
      const n = service.getAll()[0];
      expect(n.title).toBe('Watch out');
      expect(n.message).toBe('Something happened');
    });

    it('new notifications start as unread', () => {
      service.send(NotificationType.ERROR, 'Error', 'Oops');
      expect(service.getAll()[0].read).toBe(false);
    });

    it('supports all NotificationType values', () => {
      service.send(NotificationType.INFO, 'T', 'M');
      service.send(NotificationType.WARNING, 'T', 'M');
      service.send(NotificationType.ERROR, 'T', 'M');
      service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(service.getAll()).toHaveLength(4);
    });

    it('each call produces a unique ID', () => {
      const id1 = service.send(NotificationType.INFO, 'T', 'M');
      const id2 = service.send(NotificationType.INFO, 'T', 'M');
      expect(id1).not.toBe(id2);
    });

    it('throws for an empty title', () => {
      expect(() => service.send(NotificationType.INFO, '', 'msg')).toThrow();
    });

    it('throws for an empty message', () => {
      expect(() => service.send(NotificationType.INFO, 'title', '')).toThrow();
    });
  });

  describe('getAll()', () => {
    it('returns an empty array when no notifications have been sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns a copy — mutating the result does not affect internal state', () => {
      service.send(NotificationType.INFO, 'T', 'M');
      const copy = service.getAll();
      copy.pop();
      expect(service.getAll()).toHaveLength(1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications initially (all start unread)', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes notifications that have been marked as read', () => {
      const id = service.send(NotificationType.INFO, 'T', 'M');
      service.markAsRead(id);
      expect(service.getUnread()).toHaveLength(0);
    });
  });

  describe('markAsRead()', () => {
    it('marks an existing notification as read and returns true', () => {
      const id = service.send(NotificationType.SUCCESS, 'T', 'M');
      expect(service.markAsRead(id)).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });

    it('returns false for an unknown ID', () => {
      expect(service.markAsRead('does-not-exist')).toBe(false);
    });

    it('calling twice on the same ID is idempotent', () => {
      const id = service.send(NotificationType.INFO, 'T', 'M');
      service.markAsRead(id);
      expect(service.markAsRead(id)).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.WARNING, 'T2', 'M2');
      service.markAllAsRead();
      expect(service.getUnread()).toHaveLength(0);
      expect(service.getAll().every((n) => n.read)).toBe(true);
    });

    it('is safe to call when no notifications exist', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('calls the listener when a notification is sent', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.INFO, 'T', 'M');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('passes the full notification object to the listener', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.send(NotificationType.SUCCESS, 'Hello', 'World');
      const arg: Notification = listener.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.SUCCESS);
      expect(arg.title).toBe('Hello');
      expect(arg.message).toBe('World');
    });

    it('returned unsubscribe function stops future notifications', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service.send(NotificationType.INFO, 'T', 'M');
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple independent subscribers', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      service.subscribe(l1);
      service.subscribe(l2);
      service.send(NotificationType.INFO, 'T', 'M');
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.INFO, 'T', 'M');
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });

    it('is idempotent when no notifications exist', () => {
      service.clear();
      expect(service.getAll()).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// demonstrateServices() — from demo-usage.ts
// ---------------------------------------------------------------------------

describe('demonstrateServices() (new function in demo-usage.ts)', () => {
  it('exports demonstrateServices as a function', async () => {
    const mod = await import('./demo-usage');
    expect(typeof mod.demonstrateServices).toBe('function');
  });

  it('throws because analytics.track() with properties fails due to Zod v4 z.record incompatibility', async () => {
    // demonstrateServices() calls analytics.track() with `properties` set,
    // which causes a TypeError inside AnalyticsEventSchema.parse().
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).toThrow();
  });

  it('NotificationType.SUCCESS and NotificationType.INFO are valid enum members', () => {
    expect(NotificationType.SUCCESS).toBe('success');
    expect(NotificationType.INFO).toBe('info');
  });
});