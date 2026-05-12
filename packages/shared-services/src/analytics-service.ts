import { z } from 'zod';

/**
 * Represents a single analytics event recorded by the application.
 */
export interface AnalyticsEvent {
  /** The name identifying the type of event (e.g. "user_login"). */
  eventName: string;
  /** Optional identifier of the user who triggered the event. */
  userId?: string;
  /** The date and time at which the event occurred. */
  timestamp: Date;
  /** Arbitrary key-value metadata associated with the event. */
  properties?: Record<string, any>;
}

/**
 * Zod schema used to validate {@link AnalyticsEvent} objects at runtime.
 */
export const AnalyticsEventSchema = z.object({
  eventName: z.string().min(1),
  userId: z.string().optional(),
  timestamp: z.date(),
  properties: z.record(z.any()).optional(),
});

/**
 * Service for tracking, querying, and exporting in-memory analytics events.
 */
export class AnalyticsService {
  /** In-memory store of all tracked analytics events. */
  private events: AnalyticsEvent[] = [];

  /**
   * Validates and records a new analytics event.
   *
   * @param event - The analytics event to track.
   */
  track(event: AnalyticsEvent): void {
    const validatedEvent = AnalyticsEventSchema.parse(event);
    this.events.push(validatedEvent);
    console.log(`[Analytics] Tracked event: ${event.eventName}`);
  }

  /**
   * Returns a shallow copy of all recorded analytics events.
   *
   * @returns An array of {@link AnalyticsEvent} objects.
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Returns all events associated with a specific user.
   *
   * @param userId - The user identifier to filter by.
   * @returns An array of {@link AnalyticsEvent} objects for the given user.
   */
  getEventsByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  /**
   * Removes all stored analytics events from memory.
   */
  clearEvents(): void {
    this.events = [];
    console.log('[Analytics] Cleared all events');
  }

  /**
   * Serializes all stored events to a formatted JSON string.
   *
   * @returns A pretty-printed JSON representation of all events.
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}