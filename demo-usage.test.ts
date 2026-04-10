/**
 * Tests for demo-usage.ts (newly added in this PR)
 *
 * demo-usage.ts adds a demonstrateServices() function that uses
 * AnalyticsService and NotificationService from @coderabbit-test/shared-services.
 *
 * NOTE: AnalyticsService uses z.record(z.any()) which requires two arguments
 * in zod v4.1.5. This means AnalyticsService.track() throws at runtime.
 * Tests here cover the exported function shape and the NotificationService
 * which is unaffected by the zod issue.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationService, NotificationType } from "./packages/shared-services/src/notification-service";

describe("demo-usage.ts - exports and structure", () => {
  it("exports demonstrateServices as a named function", async () => {
    const mod = await import("./demo-usage");
    expect(typeof mod.demonstrateServices).toBe("function");
  });
});

describe("NotificationService (used by demo-usage.ts)", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("sends a SUCCESS notification and returns an id string", () => {
    const id = service.send(NotificationType.SUCCESS, "Welcome!", "You logged in.");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("sends an INFO notification", () => {
    const id = service.send(NotificationType.INFO, "New Feature", "Check the dashboard.");
    expect(typeof id).toBe("string");
  });

  it("getAll returns all sent notifications", () => {
    service.send(NotificationType.SUCCESS, "Title1", "Msg1");
    service.send(NotificationType.INFO, "Title2", "Msg2");
    const all = service.getAll();
    expect(all).toHaveLength(2);
  });

  it("notifications have the expected shape", () => {
    service.send(NotificationType.SUCCESS, "Welcome!", "You logged in.");
    const notifications = service.getAll();
    const n = notifications[0];
    expect(n).toHaveProperty("id");
    expect(n).toHaveProperty("type", NotificationType.SUCCESS);
    expect(n).toHaveProperty("title", "Welcome!");
    expect(n).toHaveProperty("message", "You logged in.");
    expect(n).toHaveProperty("timestamp");
    expect(n).toHaveProperty("read", false);
    expect(n.timestamp).toBeInstanceOf(Date);
  });

  it("getUnread returns only unread notifications", () => {
    service.send(NotificationType.SUCCESS, "A", "B");
    service.send(NotificationType.WARNING, "C", "D");
    expect(service.getUnread()).toHaveLength(2);
  });

  it("markAsRead marks the notification as read", () => {
    const id = service.send(NotificationType.INFO, "Test", "Msg");
    const marked = service.markAsRead(id);
    expect(marked).toBe(true);
    expect(service.getUnread()).toHaveLength(0);
  });

  it("markAsRead returns false for unknown id", () => {
    expect(service.markAsRead("nonexistent-id")).toBe(false);
  });

  it("markAllAsRead marks all notifications as read", () => {
    service.send(NotificationType.SUCCESS, "A", "B");
    service.send(NotificationType.ERROR, "C", "D");
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
    expect(service.getAll().every(n => n.read)).toBe(true);
  });

  it("subscribe listener is called on send", () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.INFO, "Test", "Msg");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("subscribe returns an unsubscribe function", () => {
    const listener = vi.fn();
    const unsub = service.subscribe(listener);
    unsub();
    service.send(NotificationType.INFO, "Test", "Msg");
    expect(listener).not.toHaveBeenCalled();
  });

  it("clear removes all notifications", () => {
    service.send(NotificationType.SUCCESS, "A", "B");
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it("getAll returns a copy, not the internal array", () => {
    service.send(NotificationType.INFO, "A", "B");
    const copy = service.getAll();
    copy.push({ id: "x", type: NotificationType.ERROR, title: "X", message: "Y", timestamp: new Date(), read: false });
    expect(service.getAll()).toHaveLength(1);
  });

  // Edge case: sending with all NotificationType variants
  it.each([
    [NotificationType.INFO, "info"],
    [NotificationType.WARNING, "warning"],
    [NotificationType.ERROR, "error"],
    [NotificationType.SUCCESS, "success"],
  ])("sends notification of type %s", (type, expectedValue) => {
    const id = service.send(type, "Title", "Message");
    const notifications = service.getAll();
    const n = notifications.find(x => x.id === id);
    expect(n?.type).toBe(expectedValue);
  });
});