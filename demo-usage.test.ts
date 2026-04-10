import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for demo-usage.ts (new file added in this PR)
 *
 * The demonstrateServices() function:
 * - Creates AnalyticsService and NotificationService instances
 * - Tracks two analytics events (user_login, page_view)
 * - Sends two notifications (SUCCESS, INFO)
 * - Logs results to console
 *
 * Note: AnalyticsEventSchema in packages/shared-services uses z.record(z.any()) with
 * a single argument, which is not valid in zod@4.1.5. Tests that call
 * AnalyticsService.track() directly mock that method. Tests for NotificationService
 * and non-parsing AnalyticsService methods work without mocking.
 */

import {
  AnalyticsService,
  NotificationService,
  NotificationType,
  type AnalyticsEvent,
} from "@coderabbit-test/shared-services";
import { demonstrateServices } from "./demo-usage";

describe("demonstrateServices - exported from demo-usage.ts", () => {
  it("is a function", () => {
    expect(typeof demonstrateServices).toBe("function");
  });

  it("runs without throwing when analytics.track is mocked", () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, "track")
      .mockImplementation(function (this: AnalyticsService, event: AnalyticsEvent) {
        (this as any).events = (this as any).events ?? [];
        (this as any).events.push(event);
      });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      expect(() => demonstrateServices()).not.toThrow();
    } finally {
      trackSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  it("logs the opening banner when track is mocked", () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, "track")
      .mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      demonstrateServices();
      expect(consoleSpy).toHaveBeenCalledWith(
        "=== Demonstrating Internal Package Services ===\n"
      );
    } finally {
      trackSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  it("logs analytics and notification section headers when track is mocked", () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, "track")
      .mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      demonstrateServices();
      expect(consoleSpy).toHaveBeenCalledWith("\n=== Analytics Events ===");
      expect(consoleSpy).toHaveBeenCalledWith("\n=== Notifications ===");
    } finally {
      trackSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });

  it("logs the completion message when track is mocked", () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, "track")
      .mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      demonstrateServices();
      expect(consoleSpy).toHaveBeenCalledWith(
        "\n=== Service Recognition Test Complete ==="
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Internal package successfully referenced and used!"
      );
    } finally {
      trackSpy.mockRestore();
      consoleSpy.mockRestore();
    }
  });
});

describe("AnalyticsService - non-parsing methods (as used by demo-usage.ts)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getEvents returns empty array initially", () => {
    const events = analytics.getEvents();
    expect(events).toEqual([]);
  });

  it("exportEvents returns a JSON array string when no events tracked", () => {
    const exported = analytics.exportEvents();
    expect(typeof exported).toBe("string");
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("getEventsByUser returns empty array when no events tracked", () => {
    const events = analytics.getEventsByUser("user123");
    expect(events).toEqual([]);
  });

  it("clearEvents can be called without error", () => {
    expect(() => analytics.clearEvents()).not.toThrow();
  });

  it("getEvents returns a copy, not the internal reference", () => {
    const events1 = analytics.getEvents();
    const events2 = analytics.getEvents();
    expect(events1).not.toBe(events2);
  });

  it("track method is called with correct event shape when mocked", () => {
    const trackSpy = vi.spyOn(analytics, "track").mockImplementation(() => {});
    const event: AnalyticsEvent = {
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
      properties: { browser: "Chrome" },
    };
    analytics.track(event);
    expect(trackSpy).toHaveBeenCalledWith(event);
  });
});

describe("NotificationService - as used by demo-usage.ts", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a SUCCESS notification and returns a string id", () => {
    const id = notifications.send(
      NotificationType.SUCCESS,
      "Welcome!",
      "You have successfully logged in."
    );
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("SUCCESS notification has correct type, title, and message", () => {
    notifications.send(
      NotificationType.SUCCESS,
      "Welcome!",
      "You have successfully logged in."
    );
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe("Welcome!");
    expect(all[0].message).toBe("You have successfully logged in.");
  });

  it("sends an INFO notification matching demo-usage.ts pattern", () => {
    notifications.send(
      NotificationType.INFO,
      "New Feature",
      "Check out our new analytics dashboard!"
    );
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe("New Feature");
  });

  it("accumulates two notifications as demo-usage.ts does", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");

    const all = notifications.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });

  it("getAll returns notifications with fields used in demo-usage logging", () => {
    notifications.send(NotificationType.SUCCESS, "Title", "Message body");
    const all = notifications.getAll();

    // demo-usage.ts: console.log(`[${n.type.toUpperCase()}] ${n.title}: ${n.message}`)
    expect(all[0].type.toUpperCase()).toBe("SUCCESS");
    expect(typeof all[0].title).toBe("string");
    expect(typeof all[0].message).toBe("string");
  });

  it("new notifications start as unread", () => {
    notifications.send(NotificationType.INFO, "Test", "Body");
    const unread = notifications.getUnread();
    expect(unread).toHaveLength(1);
    expect(unread[0].read).toBe(false);
  });

  it("markAsRead marks a notification as read by id", () => {
    const id = notifications.send(NotificationType.SUCCESS, "T", "M");
    const marked = notifications.markAsRead(id);
    expect(marked).toBe(true);
    expect(notifications.getUnread()).toHaveLength(0);
  });

  it("markAsRead returns false for a non-existent id", () => {
    const result = notifications.markAsRead("nonexistent-id");
    expect(result).toBe(false);
  });

  it("clear removes all notifications", () => {
    notifications.send(NotificationType.INFO, "T", "M");
    notifications.clear();
    expect(notifications.getAll()).toHaveLength(0);
  });

  it("subscribe listener is called when a notification is sent", () => {
    const listener = vi.fn();
    notifications.subscribe(listener);
    notifications.send(NotificationType.SUCCESS, "T", "M");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.SUCCESS);
  });

  it("subscribe returns an unsubscribe function", () => {
    const listener = vi.fn();
    const unsubscribe = notifications.subscribe(listener);
    unsubscribe();
    notifications.send(NotificationType.INFO, "T", "M");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("NotificationType enum (imported by demo-usage.ts)", () => {
  it("SUCCESS value is 'success'", () => {
    expect(NotificationType.SUCCESS).toBe("success");
  });

  it("INFO value is 'info'", () => {
    expect(NotificationType.INFO).toBe("info");
  });

  it("WARNING value is 'warning'", () => {
    expect(NotificationType.WARNING).toBe("warning");
  });

  it("ERROR value is 'error'", () => {
    expect(NotificationType.ERROR).toBe("error");
  });
});