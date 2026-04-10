"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const analytics_service_1 = require("./analytics-service");
(0, vitest_1.describe)('AnalyticsService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        service = new analytics_service_1.AnalyticsService();
    });
    (0, vitest_1.describe)('track()', () => {
        (0, vitest_1.it)('tracks a valid event with required and userId fields', () => {
            const event = {
                eventName: 'user_login',
                userId: 'user123',
                timestamp: new Date(),
            };
            service.track(event);
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(1);
            (0, vitest_1.expect)(service.getEvents()[0].eventName).toBe('user_login');
            (0, vitest_1.expect)(service.getEvents()[0].userId).toBe('user123');
        });
        (0, vitest_1.it)('tracks an event with only required fields', () => {
            const event = {
                eventName: 'page_view',
                timestamp: new Date(),
            };
            service.track(event);
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(1);
        });
        (0, vitest_1.it)('accumulates multiple tracked events', () => {
            const ts = new Date();
            service.track({ eventName: 'event_1', timestamp: ts });
            service.track({ eventName: 'event_2', timestamp: ts });
            service.track({ eventName: 'event_3', timestamp: ts });
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(3);
        });
        (0, vitest_1.it)('throws on empty eventName (Zod validation)', () => {
            const event = { eventName: '', timestamp: new Date() };
            (0, vitest_1.expect)(() => service.track(event)).toThrow();
        });
        (0, vitest_1.it)('throws when eventName is missing', () => {
            const event = { timestamp: new Date() };
            (0, vitest_1.expect)(() => service.track(event)).toThrow();
        });
        (0, vitest_1.it)('throws when timestamp is missing', () => {
            const event = { eventName: 'test' };
            (0, vitest_1.expect)(() => service.track(event)).toThrow();
        });
        (0, vitest_1.it)('logs to console when tracking', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            service.track({ eventName: 'test_event', timestamp: new Date() });
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('test_event'));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('tracks event without optional properties field', () => {
            service.track({
                eventName: 'purchase',
                timestamp: new Date(),
            });
            const events = service.getEvents();
            (0, vitest_1.expect)(events[0].eventName).toBe('purchase');
            (0, vitest_1.expect)(events[0].properties).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getEvents()', () => {
        (0, vitest_1.it)('returns empty array when no events tracked', () => {
            (0, vitest_1.expect)(service.getEvents()).toEqual([]);
        });
        (0, vitest_1.it)('returns a copy of events (immutable)', () => {
            service.track({ eventName: 'ev', timestamp: new Date() });
            const events1 = service.getEvents();
            const events2 = service.getEvents();
            (0, vitest_1.expect)(events1).not.toBe(events2);
            (0, vitest_1.expect)(events1).toHaveLength(events2.length);
        });
        (0, vitest_1.it)('mutation of returned array does not affect internal state', () => {
            service.track({ eventName: 'ev', timestamp: new Date() });
            const events = service.getEvents();
            events.splice(0, 1);
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('getEventsByUser()', () => {
        (0, vitest_1.it)('returns only events for the specified user', () => {
            const ts = new Date();
            service.track({ eventName: 'login', userId: 'alice', timestamp: ts });
            service.track({ eventName: 'logout', userId: 'bob', timestamp: ts });
            service.track({ eventName: 'view', userId: 'alice', timestamp: ts });
            const aliceEvents = service.getEventsByUser('alice');
            (0, vitest_1.expect)(aliceEvents).toHaveLength(2);
            aliceEvents.forEach(e => (0, vitest_1.expect)(e.userId).toBe('alice'));
        });
        (0, vitest_1.it)('returns empty array when no events for user', () => {
            service.track({ eventName: 'login', userId: 'alice', timestamp: new Date() });
            (0, vitest_1.expect)(service.getEventsByUser('unknown_user')).toEqual([]);
        });
        (0, vitest_1.it)('returns empty array when no events tracked at all', () => {
            (0, vitest_1.expect)(service.getEventsByUser('alice')).toEqual([]);
        });
        (0, vitest_1.it)('does not return events without a userId', () => {
            service.track({ eventName: 'anonymous_view', timestamp: new Date() });
            (0, vitest_1.expect)(service.getEventsByUser('')).toEqual([]);
        });
    });
    (0, vitest_1.describe)('clearEvents()', () => {
        (0, vitest_1.it)('removes all tracked events', () => {
            const ts = new Date();
            service.track({ eventName: 'ev1', timestamp: ts });
            service.track({ eventName: 'ev2', timestamp: ts });
            service.clearEvents();
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(0);
        });
        (0, vitest_1.it)('allows tracking new events after clear', () => {
            service.track({ eventName: 'before', timestamp: new Date() });
            service.clearEvents();
            service.track({ eventName: 'after', timestamp: new Date() });
            (0, vitest_1.expect)(service.getEvents()).toHaveLength(1);
            (0, vitest_1.expect)(service.getEvents()[0].eventName).toBe('after');
        });
        (0, vitest_1.it)('logs to console when clearing', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            service.clearEvents();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('exportEvents()', () => {
        (0, vitest_1.it)('exports empty array as JSON string', () => {
            const exported = service.exportEvents();
            (0, vitest_1.expect)(JSON.parse(exported)).toEqual([]);
        });
        (0, vitest_1.it)('exports tracked events as valid JSON', () => {
            const ts = new Date('2024-01-01T00:00:00.000Z');
            service.track({ eventName: 'login', userId: 'user1', timestamp: ts });
            const exported = service.exportEvents();
            const parsed = JSON.parse(exported);
            (0, vitest_1.expect)(parsed).toHaveLength(1);
            (0, vitest_1.expect)(parsed[0].eventName).toBe('login');
            (0, vitest_1.expect)(parsed[0].userId).toBe('user1');
        });
        (0, vitest_1.it)('returns a string', () => {
            (0, vitest_1.expect)(typeof service.exportEvents()).toBe('string');
        });
        (0, vitest_1.it)('exports multiple events preserving order', () => {
            const ts = new Date();
            service.track({ eventName: 'first', timestamp: ts });
            service.track({ eventName: 'second', timestamp: ts });
            const parsed = JSON.parse(service.exportEvents());
            (0, vitest_1.expect)(parsed[0].eventName).toBe('first');
            (0, vitest_1.expect)(parsed[1].eventName).toBe('second');
        });
    });
});
(0, vitest_1.describe)('AnalyticsEventSchema', () => {
    (0, vitest_1.it)('accepts a valid event with required and userId fields', () => {
        const result = analytics_service_1.AnalyticsEventSchema.safeParse({
            eventName: 'test',
            userId: 'u1',
            timestamp: new Date(),
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects empty eventName', () => {
        const result = analytics_service_1.AnalyticsEventSchema.safeParse({
            eventName: '',
            timestamp: new Date(),
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects missing timestamp', () => {
        const result = analytics_service_1.AnalyticsEventSchema.safeParse({ eventName: 'test' });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('accepts event without optional fields', () => {
        const result = analytics_service_1.AnalyticsEventSchema.safeParse({
            eventName: 'bare_event',
            timestamp: new Date(),
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
});
//# sourceMappingURL=analytics-service.test.js.map