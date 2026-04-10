import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, type AnalyticsEvent } from './analytics-service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('stores a valid event', () => {
      const event: AnalyticsEvent = {
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
      };
      service.track(event);
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('user_login');
    });

    it('stores multiple events', () => {
      service.track({ eventName: 'page_view', timestamp: new Date() });
      service.track({ eventName: 'button_click', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(2);
    });

    it('stores event with userId but no properties', () => {
      const event: AnalyticsEvent = {
        eventName: 'page_view',
        userId: 'user123',
        timestamp: new Date(),
      };
      service.track(event);
      const stored = service.getEvents()[0];
      expect(stored.userId).toBe('user123');
    });

    it('stores event without optional userId', () => {
      const event: AnalyticsEvent = {
        eventName: 'anonymous_visit',
        timestamp: new Date(),
      };
      service.track(event);
      expect(service.getEvents()[0].userId).toBeUndefined();
    });

    it('stores event without optional properties', () => {
      service.track({ eventName: 'login', timestamp: new Date(), userId: 'u1' });
      expect(service.getEvents()[0].properties).toBeUndefined();
    });

    it('throws when eventName is empty', () => {
      expect(() =>
        service.track({ eventName: '', timestamp: new Date() })
      ).toThrow();
    });

    it('throws when timestamp is not a Date', () => {
      expect(() =>
        service.track({ eventName: 'test', timestamp: 'not-a-date' as unknown as Date })
      ).toThrow();
    });

    it('logs to console when tracking an event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.track({ eventName: 'test_event', timestamp: new Date() });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test_event'));
      consoleSpy.mockRestore();
    });
  });

  describe('getEvents()', () => {
    it('returns an empty array initially', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a copy, not the internal array', () => {
      service.track({ eventName: 'event1', timestamp: new Date() });
      const events = service.getEvents();
      events.push({ eventName: 'injected', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    beforeEach(() => {
      service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
      service.track({ eventName: 'logout', userId: 'alice', timestamp: new Date() });
      service.track({ eventName: 'login', userId: 'bob', timestamp: new Date() });
    });

    it('returns only events for the specified user', () => {
      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every(e => e.userId === 'alice')).toBe(true);
    });

    it('returns an empty array for a user with no events', () => {
      const events = service.getEventsByUser('charlie');
      expect(events).toEqual([]);
    });

    it('returns correct events for a user with single event', () => {
      const bobEvents = service.getEventsByUser('bob');
      expect(bobEvents).toHaveLength(1);
      expect(bobEvents[0].eventName).toBe('login');
    });
  });

  describe('clearEvents()', () => {
    it('removes all stored events', () => {
      service.track({ eventName: 'e1', timestamp: new Date() });
      service.track({ eventName: 'e2', timestamp: new Date() });
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it('allows tracking new events after clearing', () => {
      service.track({ eventName: 'old', timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: 'new', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('new');
    });
  });

  describe('exportEvents()', () => {
    it('returns a JSON string of all events', () => {
      const ts = new Date('2024-01-01T00:00:00.000Z');
      service.track({ eventName: 'test', userId: 'u1', timestamp: ts });
      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].eventName).toBe('test');
    });

    it('returns "[]" when no events exist', () => {
      const exported = service.exportEvents();
      expect(JSON.parse(exported)).toEqual([]);
    });

    it('produces valid JSON with multiple events', () => {
      service.track({ eventName: 'e1', timestamp: new Date() });
      service.track({ eventName: 'e2', timestamp: new Date() });
      expect(() => JSON.parse(service.exportEvents())).not.toThrow();
      expect(JSON.parse(service.exportEvents())).toHaveLength(2);
    });
  });
});