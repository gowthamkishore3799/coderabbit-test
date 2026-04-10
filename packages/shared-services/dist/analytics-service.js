"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.AnalyticsEventSchema = void 0;
const zod_1 = require("zod");
exports.AnalyticsEventSchema = zod_1.z.object({
    eventName: zod_1.z.string().min(1),
    userId: zod_1.z.string().optional(),
    timestamp: zod_1.z.date(),
    properties: zod_1.z.record(zod_1.z.any()).optional(),
});
class AnalyticsService {
    constructor() {
        this.events = [];
    }
    track(event) {
        const validatedEvent = exports.AnalyticsEventSchema.parse(event);
        this.events.push(validatedEvent);
        console.log(`[Analytics] Tracked event: ${event.eventName}`);
    }
    getEvents() {
        return [...this.events];
    }
    getEventsByUser(userId) {
        return this.events.filter(event => event.userId === userId);
    }
    clearEvents() {
        this.events = [];
        console.log('[Analytics] Cleared all events');
    }
    exportEvents() {
        return JSON.stringify(this.events, null, 2);
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics-service.js.map