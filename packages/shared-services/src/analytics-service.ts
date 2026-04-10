import { z } from 'zod';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
}

export const AnalyticsEventSchema = z.object({
  eventName: z.string().min(1),
  userId: z.string().optional(),
  timestamp: z.date(),
  properties: z.record(z.string(), z.any()).optional(),
});

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  track(event: AnalyticsEvent): void {
    const validatedEvent = AnalyticsEventSchema.parse(event);
    this.events.push(validatedEvent);
    console.log(`[Analytics] Tracked event: ${event.eventName}`);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getEventsByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  clearEvents(): void {
    this.events = [];
    console.log('[Analytics] Cleared all events');
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}