// Tests for AnalyticsService (packages/shared-services/src/analytics-service.ts)
// Exercised by the new demo-usage.ts file added in this PR.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, type AnalyticsEvent } from './analytics-service';

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    eventName: 'test_event',
    userId: 'user123',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    properties: { key: 'value' },
    ...overrides,
  };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe('track()', () => {
    it('stores a tracked event', () => {
      service.track(makeEvent());
      expect(service.getEvents()).toHaveLength(1);
    });

    it('stores multiple events in order', () => {
      service.track(makeEvent({ eventName: 'first' }));
      service.track(makeEvent({ eventName: 'second' }));
      const events = service.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventName).toBe('first');
      expect(events[1].eventName).toBe('second');
    });

    it('stores event with correct eventName', () => {
      service.track(makeEvent({ eventName: 'user_login' }));
      expect(service.getEvents()[0].eventName).toBe('user_login');
    });

    it('stores event without optional userId', () => {
      service.track(makeEvent({ userId: undefined }));
      expect(service.getEvents()[0].userId).toBeUndefined();
    });

    it('stores event without optional properties', () => {
      service.track(makeEvent({ properties: undefined }));
      expect(service.getEvents()[0].properties).toBeUndefined();
    });

    it('stores event with empty properties object', () => {
      service.track(makeEvent({ properties: {} }));
      expect(service.getEvents()[0].properties).toEqual({});
    });

    it('logs to console when tracking an event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.track(makeEvent({ eventName: 'page_view' }));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('page_view'));
      consoleSpy.mockRestore();
    });

    it('throws for event with empty eventName (Zod min(1) validation)', () => {
      expect(() => service.track(makeEvent({ eventName: '' }))).toThrow();
    });
  });

  describe('getEvents()', () => {
    it('returns empty array when no events have been tracked', () => {
      expect(service.getEvents()).toEqual([]);
    });

    it('returns a copy of the events array (not the internal reference)', () => {
      service.track(makeEvent());
      const events = service.getEvents();
      events.push(makeEvent({ eventName: 'extra' }));
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe('getEventsByUser()', () => {
    it('returns events for a specific user', () => {
      service.track(makeEvent({ userId: 'alice' }));
      service.track(makeEvent({ userId: 'bob' }));
      service.track(makeEvent({ userId: 'alice', eventName: 'page_view' }));
      const aliceEvents = service.getEventsByUser('alice');
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every(e => e.userId === 'alice')).toBe(true);
    });

    it('returns empty array when user has no events', () => {
      service.track(makeEvent({ userId: 'alice' }));
      expect(service.getEventsByUser('unknown_user')).toEqual([]);
    });

    it('returns empty array when no events have been tracked', () => {
      expect(service.getEventsByUser('user123')).toEqual([]);
    });
  });

  describe('clearEvents()', () => {
    it('removes all tracked events', () => {
      service.track(makeEvent());
      service.track(makeEvent({ eventName: 'second' }));
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it('allows tracking new events after clearing', () => {
      service.track(makeEvent({ eventName: 'before_clear' }));
      service.clearEvents();
      service.track(makeEvent({ eventName: 'after_clear' }));
      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('after_clear');
    });

    it('logs to console when clearing events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.clearEvents();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('exportEvents()', () => {
    it('returns valid JSON string', () => {
      service.track(makeEvent({ eventName: 'user_login', userId: 'user123' }));
      const exported = service.exportEvents();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('exports empty array when no events tracked', () => {
      const exported = service.exportEvents();
      expect(JSON.parse(exported)).toEqual([]);
    });

    it('exported JSON contains event data', () => {
      service.track(makeEvent({ eventName: 'page_view', userId: 'user123' }));
      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].eventName).toBe('page_view');
      expect(parsed[0].userId).toBe('user123');
    });

    it('exported JSON is pretty-printed (contains newlines)', () => {
      service.track(makeEvent());
      const exported = service.exportEvents();
      expect(exported).toContain('\n');
    });
  });

  describe('demo-usage.ts scenario – user_login and page_view events', () => {
    it('tracks user_login event as used in demo-usage.ts', () => {
      service.track({
        eventName: 'user_login',
        userId: 'user123',
        timestamp: new Date(),
        properties: { browser: 'Chrome', version: '120.0.0' },
      });
      const events = service.getEventsByUser('user123');
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user_login');
    });

    it('tracks page_view event as used in demo-usage.ts', () => {
      service.track({
        eventName: 'page_view',
        userId: 'user123',
        timestamp: new Date(),
        properties: { page: '/dashboard', referrer: '/login' },
      });
      const events = service.getEventsByUser('user123');
      expect(events[0].eventName).toBe('page_view');
    });

    it('exportEvents after tracking multiple events returns all of them', () => {
      service.track(makeEvent({ eventName: 'user_login', userId: 'user123' }));
      service.track(makeEvent({ eventName: 'page_view', userId: 'user123' }));
      const exported = JSON.parse(service.exportEvents());
      expect(exported).toHaveLength(2);
    });
  });
});