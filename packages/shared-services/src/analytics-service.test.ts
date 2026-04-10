import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService } from "./analytics-service";
import type { AnalyticsEvent } from "./analytics-service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  describe("track()", () => {
    it("stores a valid event", () => {
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

    it("stores an event without optional userId", () => {
      const event: AnalyticsEvent = {
        eventName: "page_view",
        timestamp: new Date(),
      };

      service.track(event);

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].userId).toBeUndefined();
    });

    it("stores an event without optional properties", () => {
      const event: AnalyticsEvent = {
        eventName: "click",
        userId: "u1",
        timestamp: new Date(),
      };

      service.track(event);
      const events = service.getEvents();
      expect(events[0].properties).toBeUndefined();
    });

    it("stores multiple events in order", () => {
      service.track({ eventName: "first", timestamp: new Date() });
      service.track({ eventName: "second", timestamp: new Date() });
      service.track({ eventName: "third", timestamp: new Date() });

      const events = service.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].eventName).toBe("first");
      expect(events[1].eventName).toBe("second");
      expect(events[2].eventName).toBe("third");
    });

    it("logs the event name to console", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      service.track({ eventName: "test_event", timestamp: new Date() });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("test_event"));
      consoleSpy.mockRestore();
    });

    it("throws for an event with an empty eventName (Zod validation)", () => {
      expect(() =>
        service.track({ eventName: "", timestamp: new Date() })
      ).toThrow();
    });
  });

  describe("getEvents()", () => {
    it("returns an empty array when no events have been tracked", () => {
      expect(service.getEvents()).toEqual([]);
    });

    it("returns a copy of the events array (not a reference)", () => {
      service.track({ eventName: "e1", timestamp: new Date() });
      const events1 = service.getEvents();
      const events2 = service.getEvents();
      expect(events1).not.toBe(events2);
    });
  });

  describe("getEventsByUser()", () => {
    it("returns events filtered by userId", () => {
      service.track({ eventName: "a", userId: "alice", timestamp: new Date() });
      service.track({ eventName: "b", userId: "bob", timestamp: new Date() });
      service.track({ eventName: "c", userId: "alice", timestamp: new Date() });

      const aliceEvents = service.getEventsByUser("alice");
      expect(aliceEvents).toHaveLength(2);
      expect(aliceEvents.every((e) => e.userId === "alice")).toBe(true);
    });

    it("returns an empty array when no events match the userId", () => {
      service.track({ eventName: "a", userId: "alice", timestamp: new Date() });
      expect(service.getEventsByUser("unknown")).toEqual([]);
    });

    it("does not return events without a userId", () => {
      service.track({ eventName: "anon", timestamp: new Date() });
      expect(service.getEventsByUser("anon")).toEqual([]);
    });
  });

  describe("clearEvents()", () => {
    it("removes all tracked events", () => {
      service.track({ eventName: "e1", timestamp: new Date() });
      service.track({ eventName: "e2", timestamp: new Date() });
      service.clearEvents();
      expect(service.getEvents()).toEqual([]);
    });

    it("logs when clearing events", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      service.clearEvents();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("allows tracking new events after clearing", () => {
      service.track({ eventName: "old", timestamp: new Date() });
      service.clearEvents();
      service.track({ eventName: "new", timestamp: new Date() });
      expect(service.getEvents()).toHaveLength(1);
      expect(service.getEvents()[0].eventName).toBe("new");
    });
  });

  describe("exportEvents()", () => {
    it("returns valid JSON string", () => {
      service.track({ eventName: "e1", userId: "u1", timestamp: new Date() });
      const json = service.exportEvents();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("returns an empty array JSON when no events", () => {
      const json = service.exportEvents();
      expect(JSON.parse(json)).toEqual([]);
    });

    it("includes all tracked events in the export", () => {
      service.track({ eventName: "login", userId: "u1", timestamp: new Date() });
      service.track({ eventName: "logout", userId: "u1", timestamp: new Date() });
      const parsed = JSON.parse(service.exportEvents());
      expect(parsed).toHaveLength(2);
      expect(parsed[0].eventName).toBe("login");
      expect(parsed[1].eventName).toBe("logout");
    });

    it("returns pretty-printed JSON (2-space indentation)", () => {
      service.track({ eventName: "e", timestamp: new Date() });
      const json = service.exportEvents();
      expect(json).toContain("\n");
    });
  });
});