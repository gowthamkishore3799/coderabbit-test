// Tests for demo-usage.ts
// Verifies demonstrateServices() function behavior: analytics event tracking and notification sending

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { demonstrateServices } from "./demo-usage";
import {
  AnalyticsService,
  NotificationService,
  NotificationType,
} from "@coderabbit-test/shared-services";

describe("demonstrateServices()", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("runs without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs the demonstration header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Demonstrating Internal Package Services")
    );
  });

  it("logs analytics events section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Analytics Events"));
  });

  it("logs notifications section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Notifications"));
  });

  it("logs the completion message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Service Recognition Test Complete")
    );
  });

  it("logs confirmation that internal package was used", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Internal package successfully referenced and used!")
    );
  });
});

describe("AnalyticsService integration (as used in demo-usage.ts)", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks user_login event as used in demonstrateServices", () => {
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date(),
      properties: {
        browser: "Chrome",
        version: "120.0.0",
      },
    });

    const events = analytics.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("user_login");
    expect(events[0].userId).toBe("user123");
    expect(events[0].properties?.browser).toBe("Chrome");
    expect(events[0].properties?.version).toBe("120.0.0");
  });

  it("tracks page_view event as used in demonstrateServices", () => {
    analytics.track({
      eventName: "page_view",
      userId: "user123",
      timestamp: new Date(),
      properties: {
        page: "/dashboard",
        referrer: "/login",
      },
    });

    const events = analytics.getEvents();
    expect(events[0].eventName).toBe("page_view");
    expect(events[0].properties?.page).toBe("/dashboard");
    expect(events[0].properties?.referrer).toBe("/login");
  });

  it("tracks both events used in demonstrateServices", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    analytics.track({ eventName: "page_view", userId: "user123", timestamp: new Date() });

    expect(analytics.getEvents()).toHaveLength(2);
  });

  it("exportEvents returns valid JSON containing tracked events", () => {
    analytics.track({
      eventName: "user_login",
      userId: "user123",
      timestamp: new Date("2024-01-01T00:00:00.000Z"),
    });

    const exported = analytics.exportEvents();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe("user_login");
  });

  it("getEventsByUser retrieves only the specified user's events", () => {
    analytics.track({ eventName: "user_login", userId: "user123", timestamp: new Date() });
    analytics.track({ eventName: "page_view", userId: "user123", timestamp: new Date() });
    analytics.track({ eventName: "other_event", userId: "other_user", timestamp: new Date() });

    const userEvents = analytics.getEventsByUser("user123");
    expect(userEvents).toHaveLength(2);
  });
});

describe("NotificationService integration (as used in demo-usage.ts)", () => {
  let notifications: NotificationService;

  beforeEach(() => {
    notifications = new NotificationService();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends SUCCESS notification as used in demonstrateServices", () => {
    const id = notifications.send(
      NotificationType.SUCCESS,
      "Welcome!",
      "You have successfully logged in."
    );

    expect(typeof id).toBe("string");
    const all = notifications.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[0].title).toBe("Welcome!");
    expect(all[0].message).toBe("You have successfully logged in.");
  });

  it("sends INFO notification as used in demonstrateServices", () => {
    notifications.send(
      NotificationType.INFO,
      "New Feature",
      "Check out our new analytics dashboard!"
    );

    const all = notifications.getAll();
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe("New Feature");
    expect(all[0].message).toBe("Check out our new analytics dashboard!");
  });

  it("both notifications from demonstrateServices are stored and retrievable", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "You have successfully logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Check out our new analytics dashboard!");

    const all = notifications.getAll();
    expect(all).toHaveLength(2);
  });

  it("getAll returns notifications with correct type values for console output in demonstrateServices", () => {
    notifications.send(NotificationType.SUCCESS, "Welcome!", "Logged in.");
    notifications.send(NotificationType.INFO, "New Feature", "Dashboard update.");

    const all = notifications.getAll();
    all.forEach((n) => {
      // The demo-usage.ts uses n.type.toUpperCase() - verify type is a lowercase string
      expect(typeof n.type).toBe("string");
      expect(n.type).toBe(n.type.toLowerCase());
    });
  });

  it("notifications are created with read=false (unread) initially", () => {
    notifications.send(NotificationType.SUCCESS, "T", "M");
    const all = notifications.getAll();
    expect(all[0].read).toBe(false);
  });

  it("notifications have valid id, title, message, and timestamp fields", () => {
    const id = notifications.send(NotificationType.SUCCESS, "Welcome!", "Message");
    const all = notifications.getAll();
    const notification = all[0];

    expect(notification.id).toBe(id);
    expect(notification.title).toBe("Welcome!");
    expect(notification.message).toBe("Message");
    expect(notification.timestamp).toBeInstanceOf(Date);
  });
});