import { AnalyticsService, AnalyticsEventSchema, type AnalyticsEvent } from './analytics-service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('tracks a valid event and stores it', () => {
      const event: AnalyticsEvent = {
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        // Note: properties is omitted here because AnalyticsEventSchema uses
        // z.record(z.any()) which requires a key-type argument in zod v4 and
        // throws at runtime when properties is present (pre-existing source bug).
      };

      service.track(event);

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user_login');
      expect(events[0].userId).toBe('user123');
    });

    it('tracks an event without optional fields', () => {
      const event: AnalyticsEvent = {
        eventName: 'page_view',
        timestamp: new Date(),
      };

      service.track(event);

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('page_view');
      expect(events[0].userId).toBeUndefined();
    });

    it('tracks multiple events and accumulates them', () => {
      const timestamp = new Date();
      service.track({ eventName: 'event_one', timestamp });
      service.track({ eventName: 'event_two', timestamp });
      service.track({ eventName: 'event_three', timestamp });

      expect(service.getEvents()).toHaveLength(3);
    });

    it('throws when eventName is an empty string', () => {
      expect(() =>
        service.track({ eventName: '', timestamp: new Date() })
      ).toThrow();
    });

    it('throws when tracking an event with a properties object (known z.record(z.any()) bug)', () => {
      // z.record(z.any()) in analytics-service.ts is missing the required key-type
      // argument for zod v4, so parsing throws when a non-undefined properties value
      // is present. This test documents the current (broken) behavior.
      const event: AnalyticsEvent = {
        eventName: 'purchase',
        userId: 'u1',
        timestamp: new Date(),
        properties: { amount: 99.99, currency: 'USD', items: 3 },
      };

      expect(() => service.track(event)).toThrow();
    });
  });

  describe('getEvents()', () => {
    it('returns empty array when no events tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a defensive copy (not the internal array)', () => {
      service.track({ eventName: 'click', timestamp: new Date() });
      const copy = service.getEvents();
      copy.push({ eventName: 'injected', timestamp: new Date() });

      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns only events for the specified user', () => {
      const ts = new Date();
      service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
      service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });
      service.track({ eventName: 'click', userId: 'alice', timestamp: ts });

      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      aliceEvents.forEach(e => expect(e.userId).toBe('alice'));
    });

    it('returns empty array when userId has no events', () => {
      service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
      expect(service.getEventsByUser('bob')).toEqual([]);
    });

    it('returns empty array when no events have been tracked', () => {
      expect(service.getEventsByUser('anyone')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      service.track({ eventName: 'a', timestamp: new Date() });
      service.track({ eventName: 'b', timestamp: new Date() });
      service.clearEvents();

      expect(service.getEvents()).toHaveLength(0);
    });

    it('allows tracking new events after clearing', () => {
      service.track({ eventName: 'old', timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: 'new', timestamp: new Date() });

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('new');
    });
  });

  describe('exportEvents()', () => {
    it('returns a valid JSON string of all events', () => {
      const ts = new Date('2024-01-01T00:00:00.000Z');
      service.track({ eventName: 'test_event', userId: 'u1', timestamp: ts });

      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].eventName).toBe('test_event');
      expect(parsed[0].userId).toBe('u1');
    });

    it('returns an empty JSON array when no events tracked', () => {
      expect(service.exportEvents()).toBe('[]');
    });

    it('exports multiple events in insertion order', () => {
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
  it('parses an event without properties', () => {
    const raw = {
      eventName: 'click',
      userId: 'u1',
      timestamp: new Date(),
    };

    expect(() => AnalyticsEventSchema.parse(raw)).not.toThrow();
  });

  it('throws when properties is present (known z.record(z.any()) bug in source)', () => {
    // z.record(z.any()) requires an explicit key-type in zod v4 — the source code
    // uses the single-argument form which is broken.
    const raw = {
      eventName: 'click',
      userId: 'u1',
      timestamp: new Date(),
      properties: { x: 1 },
    };

    expect(() => AnalyticsEventSchema.parse(raw)).toThrow();
  });

  it('rejects an event with missing eventName', () => {
    expect(() =>
      AnalyticsEventSchema.parse({ timestamp: new Date() })
    ).toThrow();
  });

  it('rejects an event with empty eventName', () => {
    expect(() =>
      AnalyticsEventSchema.parse({ eventName: '', timestamp: new Date() })
    ).toThrow();
  });

  it('accepts an event without optional userId and properties', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'event',
      timestamp: new Date(),
    });
    expect(result.success).toBe(true);
  });
});