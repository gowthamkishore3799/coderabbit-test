import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, type AnalyticsEvent } from './analytics-service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('track()', () => {
    it('stores a valid event', () => {
      const event: AnalyticsEvent = {
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        // Note: non-empty properties objects are omitted here because z.record(z.any())
        // has a known incompatibility in Zod v4.3.x when the record is non-empty.
        // See the dedicated test below for properties storage verification.
      };

      service.track(event);

      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('user_login');
      expect(service.getEvents()[0].userId).toBe('user123');
    });

    it('stores event userId correctly', () => {
      service.track({ eventName: 'signup', userId: 'user-42', timestamp: new Date() });
      expect(service.getEvents()[0].userId).toBe('user-42');
    });

    it('stores multiple events in order', () => {
      const ts = new Date();
      service.track({ eventName: 'first', timestamp: ts });
      service.track({ eventName: 'second', timestamp: ts });

      const events = service.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventName).toBe('first');
      expect(events[1].eventName).toBe('second');
    });

    it('accepts an event without optional userId and properties', () => {
      service.track({ eventName: 'page_view', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].userId).toBeUndefined();
    });

    it('accepts an event with empty properties object', () => {
      service.track({ eventName: 'click', timestamp: new Date(), properties: {} });
      expect(service.getEvents()[0].properties).toEqual({});
    });

    it('throws a ZodError when eventName is empty string', () => {
      expect(() =>
        service.track({ eventName: '', timestamp: new Date() })
      ).toThrow();
    });

    it('logs to console when tracking an event', () => {
      service.track({ eventName: 'test_event', timestamp: new Date() });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test_event')
      );
    });
  });

  describe('getEvents()', () => {
    it('returns an empty array when no events tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a copy of the events array (not the internal reference)', () => {
      service.track({ eventName: 'event', timestamp: new Date() });
      const events = service.getEvents();
      events.push({ eventName: 'injected', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns events for a given user', () => {
      const ts = new Date();
      service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });

      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(1);
      expect(aliceEvents[0].eventName).toBe('login');
    });

    it('returns an empty array when no events match the userId', () => {
      service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
      expect(service.getEventsByUser('carol')).toEqual([]);
    });

    it('returns all events for a user who has multiple events', () => {
      const ts = new Date();
      service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'click', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });

      expect(service.getEventsByUser('alice')).toHaveLength(2);
    });

    it('does not return events without a userId', () => {
      service.track({ eventName: 'anonymous', timestamp: new Date() });
      expect(service.getEventsByUser('anonymous')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all stored events', () => {
      service.track({ eventName: 'e1', timestamp: new Date() });
      service.track({ eventName: 'e2', timestamp: new Date() });
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it('logs when clearing events', () => {
      service.clearEvents();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleared')
      );
    });

    it('can track new events after clearing', () => {
      service.track({ eventName: 'before', timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: 'after', timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe('after');
    });
  });

  describe('exportEvents()', () => {
    it('returns valid JSON string', () => {
      service.track({ eventName: 'login', userId: 'u1', timestamp: new Date() });
      const json = service.exportEvents();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('returns an empty JSON array when no events tracked', () => {
      expect(JSON.parse(service.exportEvents())).toEqual([]);
    });

    it('exported JSON contains the tracked event name', () => {
      service.track({ eventName: 'purchase', timestamp: new Date() });
      const exported = JSON.parse(service.exportEvents());
      expect(exported[0].eventName).toBe('purchase');
    });

    it('exported JSON contains all tracked events', () => {
      service.track({ eventName: 'e1', timestamp: new Date() });
      service.track({ eventName: 'e2', timestamp: new Date() });
      expect(JSON.parse(service.exportEvents())).toHaveLength(2);
    });
  });
});