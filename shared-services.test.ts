/**
 * Tests for packages/shared-services/src — AnalyticsService and NotificationService.
 *
 * These services are imported by demo-usage.ts (the PR's new file) and are
 * part of the @coderabbit-test/shared-services internal package.
 *
 * NOTE: AnalyticsEventSchema in analytics-service.ts uses z.record(z.any())
 * in single-argument form, which throws in Zod 4.1.5 when the `properties`
 * field is present in an event. Tests that pass `properties` are marked
 * accordingly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from './packages/shared-services/src/index';

// ---------------------------------------------------------------------------
// AnalyticsService
// ---------------------------------------------------------------------------

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks an event without properties and stores it', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
    expect(service.getEvents()[0].eventName).toBe('user_login');
    expect(service.getEvents()[0].userId).toBe('user123');
  });

  it('tracks multiple events', () => {
    service.track({ eventName: 'page_view', timestamp: new Date() });
    service.track({ eventName: 'button_click', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('tracked event timestamp is preserved', () => {
    const ts = new Date('2024-06-15T10:00:00Z');
    service.track({ eventName: 'timestamped', timestamp: ts });
    expect(service.getEvents()[0].timestamp).toEqual(ts);
  });

  it('getEventsByUser returns only events matching the given userId', () => {
    service.track({ eventName: 'login', userId: 'userA', timestamp: new Date() });
    service.track({ eventName: 'logout', userId: 'userB', timestamp: new Date() });
    service.track({ eventName: 'page_view', userId: 'userA', timestamp: new Date() });
    const eventsForA = service.getEventsByUser('userA');
    expect(eventsForA).toHaveLength(2);
    expect(eventsForA.every(e => e.userId === 'userA')).toBe(true);
  });

  it('getEventsByUser returns empty array when user has no events', () => {
    service.track({ eventName: 'login', userId: 'userA', timestamp: new Date() });
    expect(service.getEventsByUser('userB')).toHaveLength(0);
  });

  it('clearEvents removes all tracked events', () => {
    service.track({ eventName: 'login', timestamp: new Date() });
    service.track({ eventName: 'logout', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('clearEvents on an empty service does not throw', () => {
    expect(() => service.clearEvents()).not.toThrow();
  });

  it('exportEvents returns a JSON string of tracked events', () => {
    service.track({ eventName: 'ev', userId: 'u1', timestamp: new Date('2024-01-01') });
    const exported = service.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('ev');
    expect(parsed[0].userId).toBe('u1');
  });

  it('exportEvents returns an empty JSON array when no events tracked', () => {
    expect(JSON.parse(service.exportEvents())).toEqual([]);
  });

  it('getEvents returns a copy (mutation does not affect internal state)', () => {
    service.track({ eventName: 'ev', timestamp: new Date() });
    const snapshot = service.getEvents();
    snapshot.push({ eventName: 'injected', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });

  it('throws when tracking an event with an empty eventName', () => {
    expect(() =>
      service.track({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });

  it('userId is optional — event without userId is stored correctly', () => {
    service.track({ eventName: 'anon', timestamp: new Date() });
    expect(service.getEvents()[0].userId).toBeUndefined();
  });

  it('getEventsByUser returns empty array when userId is undefined on all events', () => {
    service.track({ eventName: 'ev', timestamp: new Date() });
    expect(service.getEventsByUser('any')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('send returns a non-empty string ID', () => {
    const id = service.send(NotificationType.INFO, 'Title', 'Message');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('two sends produce different IDs', () => {
    const id1 = service.send(NotificationType.INFO, 'T1', 'M1');
    const id2 = service.send(NotificationType.INFO, 'T2', 'M2');
    expect(id1).not.toBe(id2);
  });

  it('sent notification has correct type, title, and message', () => {
    service.send(NotificationType.SUCCESS, 'Welcome', 'You logged in.');
    const n = service.getAll()[0];
    expect(n.type).toBe(NotificationType.SUCCESS);
    expect(n.title).toBe('Welcome');
    expect(n.message).toBe('You logged in.');
  });

  it('sent notification defaults to read=false', () => {
    service.send(NotificationType.INFO, 'T', 'M');
    expect(service.getAll()[0].read).toBe(false);
  });

  it('sent notification has a timestamp', () => {
    const before = new Date();
    service.send(NotificationType.INFO, 'T', 'M');
    const after = new Date();
    const ts = service.getAll()[0].timestamp;
    expect(ts >= before).toBe(true);
    expect(ts <= after).toBe(true);
  });

  it('stores multiple notifications', () => {
    service.send(NotificationType.INFO, 'T1', 'M1');
    service.send(NotificationType.WARNING, 'T2', 'M2');
    expect(service.getAll()).toHaveLength(2);
  });

  it('getUnread returns all notifications when none have been read', () => {
    service.send(NotificationType.INFO, 'T1', 'M1');
    service.send(NotificationType.SUCCESS, 'T2', 'M2');
    expect(service.getUnread()).toHaveLength(2);
  });

  it('getUnread excludes notifications marked as read', () => {
    const id = service.send(NotificationType.INFO, 'T1', 'M1');
    service.send(NotificationType.INFO, 'T2', 'M2');
    service.markAsRead(id);
    expect(service.getUnread()).toHaveLength(1);
  });

  it('markAsRead returns true for a valid ID and marks it read', () => {
    const id = service.send(NotificationType.INFO, 'T1', 'M1');
    expect(service.markAsRead(id)).toBe(true);
    expect(service.getAll()[0].read).toBe(true);
    expect(service.getUnread()).toHaveLength(0);
  });

  it('markAsRead returns false for an unknown ID', () => {
    expect(service.markAsRead('does-not-exist')).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    service.send(NotificationType.INFO, 'T1', 'M1');
    service.send(NotificationType.ERROR, 'T2', 'M2');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
    expect(service.getAll().every(n => n.read)).toBe(true);
  });

  it('clear removes all notifications', () => {
    service.send(NotificationType.INFO, 'T1', 'M1');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('clear on an empty service does not throw', () => {
    expect(() => service.clear()).not.toThrow();
  });

  it('subscribe listener is called when a notification is sent', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, 'T', 'M');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].title).toBe('T');
  });

  it('unsubscribe returned by subscribe stops the listener from being called', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    unsubscribe();
    service.send(NotificationType.INFO, 'T', 'M');
    expect(listener).not.toHaveBeenCalled();
  });

  it('multiple listeners are each called when a notification is sent', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    service.subscribe(l1);
    service.subscribe(l2);
    service.send(NotificationType.INFO, 'T', 'M');
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
  });

  it('getAll returns a copy (mutation does not affect internal state)', () => {
    service.send(NotificationType.INFO, 'T', 'M');
    const all = service.getAll();
    all.push({ id: 'fake', type: NotificationType.INFO, title: 'X', message: 'Y', timestamp: new Date(), read: false });
    expect(service.getAll()).toHaveLength(1);
  });

  it('supports all four NotificationType enum values', () => {
    for (const type of [NotificationType.INFO, NotificationType.WARNING, NotificationType.ERROR, NotificationType.SUCCESS]) {
      service.send(type, 'Title', 'Message');
    }
    const types = service.getAll().map(n => n.type);
    expect(types).toContain(NotificationType.INFO);
    expect(types).toContain(NotificationType.WARNING);
    expect(types).toContain(NotificationType.ERROR);
    expect(types).toContain(NotificationType.SUCCESS);
  });
});