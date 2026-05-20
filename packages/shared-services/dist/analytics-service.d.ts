import { z } from 'zod';
export interface AnalyticsEvent {
    eventName: string;
    userId?: string;
    timestamp: Date;
    properties?: Record<string, any>;
}
export declare const AnalyticsEventSchema: z.ZodObject<{
    eventName: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare class AnalyticsService {
    private events;
    track(event: AnalyticsEvent): void;
    getEvents(): AnalyticsEvent[];
    getEventsByUser(userId: string): AnalyticsEvent[];
    clearEvents(): void;
    exportEvents(): string;
}
//# sourceMappingURL=analytics-service.d.ts.map