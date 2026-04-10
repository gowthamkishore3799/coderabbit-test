/**
 * Tests for packages/shared-services/src/analytics-service.ts
 *
 * Run with:
 *   npx tsx --test packages/shared-services/src/analytics-service.test.ts
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AnalyticsService, AnalyticsEventSchema, type AnalyticsEvent } from "./analytics-service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    eventName: "test_event",
    userId: "user-abc",
    timestamp: new Date("2024-01-15T10:00:00Z"),
    properties: { key: "value" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AnalyticsEventSchema validation
// ---------------------------------------------------------------------------

describe("AnalyticsEventSchema", () => {
  it("accepts a valid event with all fields", () => {
    const result = AnalyticsEventSchema.safeParse(makeEvent());
    assert.equal(result.success, true);
  });

  it("accepts a valid event without optional fields (userId, properties)", () => {
    const result = AnalyticsEventSchema.safeParse({
      eventName: "login",
      timestamp: new Date(),
    });
    assert.equal(result.success, true);
  });

  it("rejects an event with empty eventName", () => {
    const result = AnalyticsEventSchema.safeParse(makeEvent({ eventName: "" }));
    assert.equal(result.success, false);
  });

  it("rejects an event with missing eventName", () => {
    const { eventName: _omit, ...rest } = makeEvent();
    const result = AnalyticsEventSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("rejects an event with missing timestamp", () => {
    const { timestamp: _omit, ...rest } = makeEvent();
    const result = AnalyticsEventSchema.safeParse(rest);
    assert.equal(result.success, false);
  });

  it("rejects an event with non-Date timestamp", () => {
    const result = AnalyticsEventSchema.safeParse(makeEvent({ timestamp: "2024-01-01" as unknown as Date }));
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService — track()
// ---------------------------------------------------------------------------

describe("AnalyticsService.track()", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it("stores a tracked event in the internal list", () => {
    service.track(makeEvent());
    assert.equal(service.getEvents().length, 1);
  });

  it("stores multiple tracked events", () => {
    service.track(makeEvent({ eventName: "login" }));
    service.track(makeEvent({ eventName: "logout" }));
    assert.equal(service.getEvents().length, 2);
  });

  it("preserves event data after tracking", () => {
    const event = makeEvent({ eventName: "purchase", userId: "buyer-1" });
    service.track(event);
    const stored = service.getEvents()[0];
    assert.equal(stored.eventName, "purchase");
    assert.equal(stored.userId, "buyer-1");
  });

  it("throws when eventName is empty (schema validation)", () => {
    assert.throws(() => service.track(makeEvent({ eventName: "" })));
  });

  it("accepts an event without userId (optional field)", () => {
    const event: AnalyticsEvent = {
      eventName: "anonymous_click",
      timestamp: new Date(),
    };
    assert.doesNotThrow(() => service.track(event));
    assert.equal(service.getEvents().length, 1);
  });

  it("accepts an event without properties (optional field)", () => {
    const event: AnalyticsEvent = {
      eventName: "page_view",
      userId: "u1",
      timestamp: new Date(),
    };
    assert.doesNotThrow(() => service.track(event));
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService — getEvents()
// ---------------------------------------------------------------------------

describe("AnalyticsService.getEvents()", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it("returns an empty array when no events tracked", () => {
    assert.deepEqual(service.getEvents(), []);
  });

  it("returns a copy — mutations do not affect internal state", () => {
    service.track(makeEvent());
    const events = service.getEvents();
    events.push(makeEvent({ eventName: "rogue" }));
    assert.equal(service.getEvents().length, 1);
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService — getEventsByUser()
// ---------------------------------------------------------------------------

describe("AnalyticsService.getEventsByUser()", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    service.track(makeEvent({ userId: "user-1", eventName: "login" }));
    service.track(makeEvent({ userId: "user-2", eventName: "signup" }));
    service.track(makeEvent({ userId: "user-1", eventName: "purchase" }));
  });

  it("returns only events for the requested user", () => {
    const events = service.getEventsByUser("user-1");
    assert.equal(events.length, 2);
    assert.ok(events.every((e) => e.userId === "user-1"));
  });

  it("returns empty array for unknown userId", () => {
    const events = service.getEventsByUser("ghost-user");
    assert.deepEqual(events, []);
  });

  it("returns correct count for user with single event", () => {
    const events = service.getEventsByUser("user-2");
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "signup");
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService — clearEvents()
// ---------------------------------------------------------------------------

describe("AnalyticsService.clearEvents()", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it("removes all events after clear", () => {
    service.track(makeEvent());
    service.track(makeEvent({ eventName: "second" }));
    service.clearEvents();
    assert.deepEqual(service.getEvents(), []);
  });

  it("is idempotent — clearing empty service is safe", () => {
    assert.doesNotThrow(() => service.clearEvents());
    assert.deepEqual(service.getEvents(), []);
  });

  it("allows tracking new events after clear", () => {
    service.track(makeEvent());
    service.clearEvents();
    service.track(makeEvent({ eventName: "post_clear" }));
    assert.equal(service.getEvents().length, 1);
    assert.equal(service.getEvents()[0].eventName, "post_clear");
  });
});

// ---------------------------------------------------------------------------
// AnalyticsService — exportEvents()
// ---------------------------------------------------------------------------

describe("AnalyticsService.exportEvents()", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  it("returns a valid JSON string", () => {
    service.track(makeEvent());
    const exported = service.exportEvents();
    assert.doesNotThrow(() => JSON.parse(exported));
  });

  it("exported JSON contains the tracked event name", () => {
    service.track(makeEvent({ eventName: "export_test" }));
    const parsed = JSON.parse(service.exportEvents());
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed[0].eventName, "export_test");
  });

  it("returns an empty JSON array when no events tracked", () => {
    const exported = service.exportEvents();
    const parsed = JSON.parse(exported);
    assert.deepEqual(parsed, []);
  });

  it("exported JSON reflects multiple events in order", () => {
    service.track(makeEvent({ eventName: "first" }));
    service.track(makeEvent({ eventName: "second" }));
    const parsed = JSON.parse(service.exportEvents());
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].eventName, "first");
    assert.equal(parsed[1].eventName, "second");
  });
});