import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, AnalyticsEventSchema, type AnalyticsEvent } from './analytics-service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('tracks a valid event with required and userId fields', () => {
      const event: AnalyticsEvent = {
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
      };
      service.track(event);
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('user_login');
      expect(service.getEvents()[0].userId).toBe('user123');
    });

    it('tracks an event with only required fields', () => {
      const event: AnalyticsEvent = {
        eventName: 'page_view',
        timestamp: new Date(),
      };
      service.track(event);
      expect(service.getEvents()).toHaveLength(1);
    });

    it('accumulates multiple tracked events', () => {
      const ts = new Date();
      service.track({ eventName: 'event_1', timestamp: ts });
      service.track({ eventName: 'event_2', timestamp: ts });
      service.track({ eventName: 'event_3', timestamp: ts });
      expect(service.getEvents()).toHaveLength(3);
    });

    it('throws on empty eventName (Zod validation)', () => {
      const event = { eventName: '', timestamp: new Date() } as AnalyticsEvent;
      expect(() => service.track(event)).toThrow();
    });

    it('throws when eventName is missing', () => {
      const event = { timestamp: new Date() } as unknown as AnalyticsEvent;
      expect(() => service.track(event)).toThrow();
    });

    it('throws when timestamp is missing', () => {
      const event = { eventName: 'test' } as unknown as AnalyticsEvent;
      expect(() => service.track(event)).toThrow();
    });

    it('logs to console when tracking', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.track({ eventName: 'test_event', timestamp: new Date() });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test_event'));
      consoleSpy.mockRestore();
    });

    it('tracks event without optional properties field', () => {
      service.track({
        eventName: 'purchase',
        timestamp: new Date(),
      });
      const events = service.getEvents();
      expect(events[0].eventName).toBe('purchase');
      expect(events[0].properties).toBeUndefined();
    });
  });

  describe('getEvents()', () => {
    it('returns empty array when no events tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a copy of events (immutable)', () => {
      service.track({ eventName: 'ev', timestamp: new Date() });
      const events1 = service.getEvents();
      const events2 = service.getEvents();
      expect(events1).not.toBe(events2);
      expect(events1).toHaveLength(events2.length);
    });

    it('mutation of returned array does not affect internal state', () => {
      service.track({ eventName: 'ev', timestamp: new Date() });
      const events = service.getEvents();
      events.splice(0, 1);
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns only events for the specified user', () => {
      const ts = new Date();
      service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });
      service.track({ eventName: 'view', userId: 'alice', timestamp: ts });

      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      aliceEvents.forEach(e => expect(e.userId).toBe('alice'));
    });

    it('returns empty array when no events for user', () => {
      service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
      expect(service.getEventsByUser('unknown_user')).toEqual([]);
    });

    it('returns empty array when no events tracked at all', () => {
      expect(service.getEventsByUser('alice')).toEqual([]);
    });

    it('does not return events without a userId', () => {
      service.track({ eventName: 'anonymous_view', timestamp: new Date() });
      expect(service.getEventsByUser('')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      const ts = new Date();
      service.track({ eventName: 'ev1', timestamp: ts });
      service.track({ eventName: 'ev2', timestamp: ts });
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it('allows tracking new events after clear', () => {
      service.track({ eventName: 'before', timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: 'after', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('after');
    });

    it('logs to console when clearing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.clearEvents();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('exportEvents()', () => {
    it('exports empty array as JSON string', () => {
      const exported = service.exportEvents();
      expect(JSON.parse(exported)).toEqual([]);
    });

    it('exports tracked events as valid JSON', () => {
      const ts = new Date('2024-01-01T00:00:00.000Z');
      service.track({ eventName: 'login', userId: 'user1', timestamp: ts });
      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].eventName).toBe('login');
      expect(parsed[0].userId).toBe('user1');
    });

    it('returns a string', () => {
      expect(typeof service.exportEvents()).toBe('string');
    });

    it('exports multiple events preserving order', () => {
      const ts = new Date();
      service.track({ eventName: 'first', timestamp: ts });
      service.track({ eventName: 'second', timestamp: ts });
      const parsed = JSON.parse(service.exportEvents());
      expect(parsed[0].eventName).toBe('first');
      expect(parsed[1].eventName).toBe('second');
    });
  });
});

describe('AnalyticsEventSchema', () => {
  it('accepts a valid event with required and userId fields', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'test',
      userId: 'u1',
      timestamp: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty eventName', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: '',
      timestamp: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing timestamp', () => {
    const result = AnalyticsEventSchema.safeParse({ eventName: 'test' });
    expect(result.success).toBe(false);
  });

  it('accepts event without optional fields', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'bare_event',
      timestamp: new Date(),
    });
    expect(result.success).toBe(true);
  });
});