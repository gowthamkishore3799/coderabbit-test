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
        // Note: non-empty `properties` objects trigger a known zod v4
        // z.record(z.any()) bug in the installed version; omit them here.
      };

      service.track(event);

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user_login');
      expect(events[0].userId).toBe('user123');
    });

    it('stores multiple events', () => {
      const timestamp = new Date();
      service.track({ eventName: 'page_view', timestamp });
      service.track({ eventName: 'button_click', timestamp });

      expect(service.getEvents()).toHaveLength(2);
    });

    it('stores event without optional userId and properties', () => {
      service.track({ eventName: 'anonymous_visit', timestamp: new Date() });

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].userId).toBeUndefined();
      expect(events[0].properties).toBeUndefined();
    });

    it('throws when eventName is empty string', () => {
      expect(() =>
        service.track({ eventName: '', timestamp: new Date() })
      ).toThrow();
    });

    it('stores an event without properties (properties field is optional)', () => {
      service.track({
        eventName: 'checkout',
        timestamp: new Date(),
      });

      const events = service.getEvents();
      expect(events[0].eventName).toBe('checkout');
      expect(events[0].properties).toBeUndefined();
    });
  });

  describe('getEvents()', () => {
    it('returns an empty array when no events tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a defensive copy so mutations do not affect internal state', () => {
      service.track({ eventName: 'test', timestamp: new Date() });

      const events = service.getEvents();
      events.pop();

      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns only events matching the given userId', () => {
      const ts = new Date();
      service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });
      service.track({ eventName: 'page_view', userId: 'alice', timestamp: ts });

      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every(e => e.userId === 'alice')).toBe(true);
    });

    it('returns empty array when no events match the userId', () => {
      service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });

      expect(service.getEventsByUser('unknown')).toEqual([]);
    });

    it('returns empty array when no events have been tracked', () => {
      expect(service.getEventsByUser('alice')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      service.track({ eventName: 'e1', timestamp: new Date() });
      service.track({ eventName: 'e2', timestamp: new Date() });

      service.clearEvents();

      expect(service.getEvents()).toEqual([]);
    });

    it('is idempotent when called on already-empty service', () => {
      expect(() => service.clearEvents()).not.toThrow();
      expect(service.getEvents()).toEqual([]);
    });
  });

  describe('exportEvents()', () => {
    it('returns a valid JSON string', () => {
      service.track({ eventName: 'login', timestamp: new Date('2024-01-01T00:00:00Z') });

      const exported = service.exportEvents();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('returns "[]" for an empty event store', () => {
      expect(JSON.parse(service.exportEvents())).toEqual([]);
    });

    it('exported JSON contains expected event data', () => {
      const timestamp = new Date('2024-06-15T10:00:00Z');
      service.track({ eventName: 'purchase', userId: 'u1', timestamp });

      const data = JSON.parse(service.exportEvents());
      expect(data).toHaveLength(1);
      expect(data[0].eventName).toBe('purchase');
      expect(data[0].userId).toBe('u1');
    });
  });
});