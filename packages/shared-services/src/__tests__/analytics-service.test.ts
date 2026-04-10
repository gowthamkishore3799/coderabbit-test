/**
 * Tests for AnalyticsService
 *
 * The AnalyticsService is exercised by demo-usage.ts which was added in this PR.
 *
 * Run (after npm install in packages/shared-services/):
 *   node --experimental-strip-types --test packages/shared-services/src/__tests__/analytics-service.test.ts
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AnalyticsService } from "../analytics-service.js";
import type { AnalyticsEvent } from "../analytics-service.js";

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    eventName: "test_event",
    userId: "user123",
    timestamp: new Date("2024-01-01T00:00:00Z"),
    properties: { key: "value" },
    ...overrides,
  };
}

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  // -------------------------------------------------------------------------
  // track()
  // -------------------------------------------------------------------------
  describe("track()", () => {
    it("tracks a valid event without throwing", () => {
      assert.doesNotThrow(() => service.track(makeEvent()));
    });

    it("stores the tracked event so getEvents() returns it", () => {
      const event = makeEvent({ eventName: "user_login" });
      service.track(event);
      const events = service.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].eventName, "user_login");
    });

    it("tracks multiple events independently", () => {
      service.track(makeEvent({ eventName: "event_one" }));
      service.track(makeEvent({ eventName: "event_two" }));
      assert.equal(service.getEvents().length, 2);
    });

    it("tracks an event without optional userId", () => {
      const event: AnalyticsEvent = {
        eventName: "anonymous_view",
        timestamp: new Date(),
      };
      assert.doesNotThrow(() => service.track(event));
      assert.equal(service.getEvents().length, 1);
    });

    it("tracks an event without optional properties", () => {
      const event: AnalyticsEvent = {
        eventName: "minimal_event",
        userId: "u1",
        timestamp: new Date(),
      };
      assert.doesNotThrow(() => service.track(event));
    });

    it("tracks an event with arbitrary properties", () => {
      service.track(
        makeEvent({ properties: { browser: "Chrome", version: "120.0.0" } })
      );
      const events = service.getEvents();
      assert.deepEqual(events[0].properties, { browser: "Chrome", version: "120.0.0" });
    });

    it("returns a copy — mutating the returned array does not affect stored events", () => {
      service.track(makeEvent());
      const copy = service.getEvents();
      copy.push(makeEvent({ eventName: "intruder" }));
      assert.equal(service.getEvents().length, 1);
    });
  });

  // -------------------------------------------------------------------------
  // getEvents()
  // -------------------------------------------------------------------------
  describe("getEvents()", () => {
    it("returns an empty array when no events have been tracked", () => {
      assert.deepEqual(service.getEvents(), []);
    });

    it("returns all tracked events in insertion order", () => {
      service.track(makeEvent({ eventName: "first" }));
      service.track(makeEvent({ eventName: "second" }));
      const events = service.getEvents();
      assert.equal(events[0].eventName, "first");
      assert.equal(events[1].eventName, "second");
    });
  });

  // -------------------------------------------------------------------------
  // getEventsByUser()
  // -------------------------------------------------------------------------
  describe("getEventsByUser()", () => {
    it("returns only events belonging to the given userId", () => {
      service.track(makeEvent({ userId: "alice" }));
      service.track(makeEvent({ userId: "bob" }));
      service.track(makeEvent({ userId: "alice" }));

      const aliceEvents = service.getEventsByUser("alice");
      assert.equal(aliceEvents.length, 2);
      assert.ok(aliceEvents.every((e) => e.userId === "alice"));
    });

    it("returns an empty array when no events match the userId", () => {
      service.track(makeEvent({ userId: "alice" }));
      assert.deepEqual(service.getEventsByUser("nobody"), []);
    });

    it("returns an empty array when no events have been tracked", () => {
      assert.deepEqual(service.getEventsByUser("alice"), []);
    });
  });

  // -------------------------------------------------------------------------
  // clearEvents()
  // -------------------------------------------------------------------------
  describe("clearEvents()", () => {
    it("removes all tracked events", () => {
      service.track(makeEvent());
      service.track(makeEvent());
      service.clearEvents();
      assert.deepEqual(service.getEvents(), []);
    });

    it("can be called on an already-empty service without error", () => {
      assert.doesNotThrow(() => service.clearEvents());
    });

    it("allows tracking new events after clearing", () => {
      service.track(makeEvent({ eventName: "before_clear" }));
      service.clearEvents();
      service.track(makeEvent({ eventName: "after_clear" }));
      const events = service.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].eventName, "after_clear");
    });
  });

  // -------------------------------------------------------------------------
  // exportEvents()
  // -------------------------------------------------------------------------
  describe("exportEvents()", () => {
    it("returns a valid JSON string", () => {
      service.track(makeEvent({ eventName: "export_me" }));
      const exported = service.exportEvents();
      assert.doesNotThrow(() => JSON.parse(exported));
    });

    it("exported JSON contains the tracked event name", () => {
      service.track(makeEvent({ eventName: "my_event" }));
      const exported = service.exportEvents();
      assert.ok(
        exported.includes("my_event"),
        `Expected exported JSON to contain "my_event", got: ${exported}`
      );
    });

    it("returns '[]' (or equivalent) when no events have been tracked", () => {
      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);
      assert.ok(Array.isArray(parsed));
      assert.equal(parsed.length, 0);
    });

    it("exported JSON contains all tracked events", () => {
      service.track(makeEvent({ eventName: "event_a" }));
      service.track(makeEvent({ eventName: "event_b" }));
      const parsed: AnalyticsEvent[] = JSON.parse(service.exportEvents());
      assert.equal(parsed.length, 2);
    });
  });
});