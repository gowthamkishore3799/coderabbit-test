import { z } from 'zod';

/**
 * Represents a single analytics event with a name, optional user ID,
 * timestamp, and optional additional properties.
 */
export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
}

/**
 * Zod schema for runtime validation of AnalyticsEvent objects.
 * Requires a non-empty eventName and a valid Date timestamp;
 * userId and properties are optional.
 */
export const AnalyticsEventSchema = z.object({
  eventName: z.string().min(1),
  userId: z.string().optional(),
  timestamp: z.date(),
  properties: z.record(z.any()).optional(),
});

/**
 * In-memory analytics service for tracking, retrieving, and exporting analytics events.
 */
export class AnalyticsService {
  /** Internal array storing all tracked analytics events. */
  private events: AnalyticsEvent[] = [];

  /**
   * Validates and records an analytics event.
   *
   * @param event - The analytics event to track.
   */
  track(event: AnalyticsEvent): void {
    const validatedEvent = AnalyticsEventSchema.parse(event);
    this.events.push(validatedEvent);
    console.log(`[Analytics] Tracked event: ${event.eventName}`);
  }

  /**
   * Returns a shallow copy of all tracked analytics events.
   *
   * @returns An array of all stored AnalyticsEvent objects.
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Returns all analytics events associated with a specific user.
   *
   * @param userId - The user ID to filter events by.
   * @returns An array of AnalyticsEvent objects matching the given userId.
   */
  getEventsByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  /**
   * Clears all stored analytics events and logs the action.
   */
  clearEvents(): void {
    this.events = [];
    console.log('[Analytics] Cleared all events');
  }

  /**
   * Serializes all tracked events to a pretty-printed JSON string.
   *
   * @returns A JSON string representation of all stored analytics events.
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}