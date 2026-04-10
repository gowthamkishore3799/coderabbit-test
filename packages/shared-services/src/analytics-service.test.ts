// Tests for analytics-service.ts
// These are tested as part of coverage for demo-usage.ts which depends on AnalyticsService

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService, type AnalyticsEvent } from "./analytics-service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe("track()", () => {
    it("tracks a valid event", () => {
      const event: AnalyticsEvent = {
        eventName: "user_login",
        userId: "user123",
        timestamp: new Date(),
        properties: { browser: "Chrome" },
      };

      service.track(event);
      const events = service.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe("user_login");
      expect(events[0].userId).toBe("user123");
    });

    it("tracks an event without optional userId", () => {
      const event: AnalyticsEvent = {
        eventName: "page_view",
        timestamp: new Date(),
      };

      service.track(event);
      expect(service.getEvents()).toHaveLength(1);
    });

    it("tracks an event without optional properties", () => {
      const event: AnalyticsEvent = {
        eventName: "button_click",
        userId: "user456",
        timestamp: new Date(),
      };

      service.track(event);
      const events = service.getEvents();
      expect(events[0].properties).toBeUndefined();
    });

    it("tracks multiple events accumulating them", () => {
      const ts = new Date();
      service.track({ eventName: "event_one", timestamp: ts });
      service.track({ eventName: "event_two", timestamp: ts });
      service.track({ eventName: "event_three", timestamp: ts });

      expect(service.getEvents()).toHaveLength(3);
    });

    it("logs the tracked event to console", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      service.track({ eventName: "test_event", timestamp: new Date() });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("test_event"));
      consoleSpy.mockRestore();
    });

    it("throws on invalid event (empty eventName)", () => {
      expect(() =>
        service.track({ eventName: "", timestamp: new Date() })
      ).toThrow();
    });
  });

  describe("getEvents()", () => {
    it("returns empty array initially", () => {
      expect(service.getEvents()).toEqual([]);
    });

    it("returns a copy of events (not a reference)", () => {
      service.track({ eventName: "event_a", timestamp: new Date() });
      const events1 = service.getEvents();
      const events2 = service.getEvents();
      expect(events1).not.toBe(events2);
    });

    it("does not allow external mutation of tracked events", () => {
      service.track({ eventName: "immutable_event", timestamp: new Date() });
      const events = service.getEvents();
      events.pop();
      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe("getEventsByUser()", () => {
    beforeEach(() => {
      service.track({ eventName: "login", userId: "alice", timestamp: new Date() });
      service.track({ eventName: "view", userId: "bob", timestamp: new Date() });
      service.track({ eventName: "logout", userId: "alice", timestamp: new Date() });
    });

    it("returns only events for the specified user", () => {
      const aliceEvents = service.getEventsByUser("alice");
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every((e) => e.userId === "alice")).toBe(true);
    });

    it("returns empty array for unknown user", () => {
      const events = service.getEventsByUser("unknown-user");
      expect(events).toEqual([]);
    });

    it("returns events for user with single event", () => {
      const bobEvents = service.getEventsByUser("bob");
      expect(bobEvents).toHaveLength(1);
      expect(bobEvents[0].eventName).toBe("view");
    });
  });

  describe("clearEvents()", () => {
    it("removes all tracked events", () => {
      service.track({ eventName: "event_1", timestamp: new Date() });
      service.track({ eventName: "event_2", timestamp: new Date() });
      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
    });

    it("allows tracking new events after clearing", () => {
      service.track({ eventName: "old_event", timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: "new_event", timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe("new_event");
    });
  });

  describe("exportEvents()", () => {
    it("returns an empty JSON array string when no events", () => {
      const exported = service.exportEvents();
      expect(JSON.parse(exported)).toEqual([]);
    });

    it("returns a valid JSON string of tracked events", () => {
      service.track({
        eventName: "user_login",
        userId: "user123",
        timestamp: new Date("2024-01-01T00:00:00.000Z"),
        properties: { browser: "Chrome", version: "120.0.0" },
      });

      const exported = service.exportEvents();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].eventName).toBe("user_login");
      expect(parsed[0].userId).toBe("user123");
      expect(parsed[0].properties.browser).toBe("Chrome");
    });

    it("returns JSON that includes all tracked events", () => {
      service.track({ eventName: "event_a", userId: "u1", timestamp: new Date() });
      service.track({ eventName: "event_b", userId: "u2", timestamp: new Date() });

      const parsed = JSON.parse(service.exportEvents());
      expect(parsed).toHaveLength(2);
      expect(parsed.map((e: AnalyticsEvent) => e.eventName)).toEqual(["event_a", "event_b"]);
    });

    it("produces formatted JSON (pretty-printed with indentation)", () => {
      service.track({ eventName: "test", timestamp: new Date() });
      const exported = service.exportEvents();
      expect(exported).toContain("\n");
    });
  });
});