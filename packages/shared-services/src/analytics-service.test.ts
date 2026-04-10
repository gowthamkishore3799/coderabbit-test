import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsService, AnalyticsEventSchema } from './analytics-service.ts';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('tracks a valid event with userId and timestamp', () => {
      const timestamp = new Date();
      service.track({
        eventName: 'user_login',
        userId: 'user123',
        timestamp,
      });

      const events = service.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].eventName, 'user_login');
      assert.equal(events[0].userId, 'user123');
      assert.deepEqual(events[0].timestamp, timestamp);
    });

    it('tracks an event without optional userId and properties', () => {
      service.track({ eventName: 'page_view', timestamp: new Date() });

      const events = service.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].eventName, 'page_view');
      assert.equal(events[0].userId, undefined);
      assert.equal(events[0].properties, undefined);
    });

    it('tracks multiple events in order', () => {
      service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
      service.track({ eventName: 'page_view', userId: 'user123', timestamp: new Date() });

      const events = service.getEvents();
      assert.equal(events.length, 2);
      assert.equal(events[0].eventName, 'user_login');
      assert.equal(events[1].eventName, 'page_view');
    });

    it('throws when eventName is empty string', () => {
      assert.throws(() => {
        service.track({ eventName: '', timestamp: new Date() });
      });
    });

    it('returns a copy of events (immutability)', () => {
      service.track({ eventName: 'test_event', timestamp: new Date() });
      const events1 = service.getEvents();
      events1.push({ eventName: 'injected', timestamp: new Date() });

      const events2 = service.getEvents();
      assert.equal(events2.length, 1);
    });
  });

  describe('getEvents()', () => {
    it('returns empty array when no events tracked', () => {
      assert.deepEqual(service.getEvents(), []);
    });

    it('returns all tracked events', () => {
      service.track({ eventName: 'evt1', timestamp: new Date() });
      service.track({ eventName: 'evt2', timestamp: new Date() });
      assert.equal(service.getEvents().length, 2);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns events for a specific user', () => {
      service.track({ eventName: 'login', userId: 'user1', timestamp: new Date() });
      service.track({ eventName: 'logout', userId: 'user2', timestamp: new Date() });
      service.track({ eventName: 'purchase', userId: 'user1', timestamp: new Date() });

      const user1Events = service.getEventsByUser('user1');
      assert.equal(user1Events.length, 2);
      assert.ok(user1Events.every(e => e.userId === 'user1'));
    });

    it('returns empty array when no events match the user', () => {
      service.track({ eventName: 'login', userId: 'user1', timestamp: new Date() });
      const result = service.getEventsByUser('nonexistent');
      assert.deepEqual(result, []);
    });

    it('returns empty array when no events have been tracked', () => {
      assert.deepEqual(service.getEventsByUser('user1'), []);
    });

    it('does not return events without a userId when filtering by user', () => {
      service.track({ eventName: 'anonymous_visit', timestamp: new Date() });
      assert.deepEqual(service.getEventsByUser('user1'), []);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      service.track({ eventName: 'evt1', timestamp: new Date() });
      service.track({ eventName: 'evt2', timestamp: new Date() });
      service.clearEvents();
      assert.deepEqual(service.getEvents(), []);
    });

    it('can track new events after clearing', () => {
      service.track({ eventName: 'before_clear', timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: 'after_clear', timestamp: new Date() });

      const events = service.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].eventName, 'after_clear');
    });

    it('clearing empty service does not throw', () => {
      assert.doesNotThrow(() => service.clearEvents());
    });
  });

  describe('exportEvents()', () => {
    it('returns a valid JSON string of events', () => {
      const timestamp = new Date('2024-01-01T00:00:00.000Z');
      service.track({ eventName: 'user_login', userId: 'user123', timestamp });

      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      assert.ok(Array.isArray(parsed));
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].eventName, 'user_login');
      assert.equal(parsed[0].userId, 'user123');
    });

    it('returns an empty array JSON string when no events tracked', () => {
      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      assert.deepEqual(parsed, []);
    });

    it('returns a formatted (indented) JSON string', () => {
      service.track({ eventName: 'test', timestamp: new Date() });
      const exported = service.exportEvents();
      assert.ok(exported.includes('\n'), 'exportEvents should return indented JSON');
    });

    it('exported JSON contains userId and eventName when set', () => {
      service.track({
        eventName: 'page_view',
        userId: 'user123',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      });

      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      assert.equal(parsed[0].eventName, 'page_view');
      assert.equal(parsed[0].userId, 'user123');
    });
  });
});

describe('AnalyticsEventSchema', () => {
  it('parses a valid event without properties', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'test_event',
      userId: 'user1',
      timestamp: new Date(),
    });
    assert.ok(result.success);
  });

  it('rejects an event with an empty eventName', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: '',
      timestamp: new Date(),
    });
    assert.ok(!result.success);
  });

  it('requires timestamp to be a Date object', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'test',
      timestamp: '2024-01-01',
    });
    assert.ok(!result.success);
  });

  it('allows optional userId and properties', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: 'minimal_event',
      timestamp: new Date(),
    });
    assert.ok(result.success);
    if (result.success) {
      assert.equal(result.data.userId, undefined);
      assert.equal(result.data.properties, undefined);
    }
  });
});