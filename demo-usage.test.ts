import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the shared-services module before importing demo-usage.ts
// This avoids needing the compiled dist/ output of the package.
vi.mock("@coderabbit-test/shared-services", () => {
  const mockEvents: unknown[] = [];
  const mockNotifications: unknown[] = [];

  const AnalyticsService = vi.fn().mockImplementation(() => ({
    track: vi.fn((event: unknown) => {
      mockEvents.push(event);
    }),
    getEvents: vi.fn(() => [...mockEvents]),
    exportEvents: vi.fn(() => JSON.stringify(mockEvents, null, 2)),
    clearEvents: vi.fn(() => {
      mockEvents.length = 0;
    }),
  }));

  const NotificationService = vi.fn().mockImplementation(() => ({
    send: vi.fn((_type: unknown, title: unknown, message: unknown) => {
      const id = Math.random().toString(36).substr(2, 9);
      mockNotifications.push({ id, type: _type, title, message, read: false });
      return id;
    }),
    getAll: vi.fn(() => [...mockNotifications]),
    getUnread: vi.fn(() => mockNotifications.filter((n: unknown) => !(n as { read: boolean }).read)),
    markAsRead: vi.fn(),
    clear: vi.fn(() => {
      mockNotifications.length = 0;
    }),
  }));

  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  };

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import after mock setup
const { demonstrateServices } = await import("./demo-usage");

describe("demonstrateServices()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs introductory header to console", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Demonstrating Internal Package Services")
    );
    consoleSpy.mockRestore();
  });

  it("logs the analytics events section header", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Analytics Events"));
    consoleSpy.mockRestore();
  });

  it("logs the notifications section header", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Notifications"));
    consoleSpy.mockRestore();
  });

  it("logs the completion message", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Service Recognition Test Complete")
    );
    consoleSpy.mockRestore();
  });

  it("calls analytics.track for the user_login event", async () => {
    const { AnalyticsService } = await import("@coderabbit-test/shared-services");
    const mockInstance = (AnalyticsService as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    if (mockInstance) {
      demonstrateServices();
      expect(mockInstance.track).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: "user_login" })
      );
    }
  });

  it("calls analytics.track for the page_view event", async () => {
    const { AnalyticsService } = await import("@coderabbit-test/shared-services");
    const mockInstance = (AnalyticsService as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    if (mockInstance) {
      demonstrateServices();
      expect(mockInstance.track).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: "page_view" })
      );
    }
  });

  it("calls notifications.send for the SUCCESS welcome notification", async () => {
    const { NotificationService, NotificationType } = await import(
      "@coderabbit-test/shared-services"
    );
    const mockInstance = (NotificationService as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    if (mockInstance) {
      demonstrateServices();
      expect(mockInstance.send).toHaveBeenCalledWith(
        NotificationType.SUCCESS,
        "Welcome!",
        expect.any(String)
      );
    }
  });

  it("calls notifications.send for the INFO new feature notification", async () => {
    const { NotificationService, NotificationType } = await import(
      "@coderabbit-test/shared-services"
    );
    const mockInstance = (NotificationService as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    if (mockInstance) {
      demonstrateServices();
      expect(mockInstance.send).toHaveBeenCalledWith(
        NotificationType.INFO,
        "New Feature",
        expect.any(String)
      );
    }
  });

  it("can be called multiple times without errors", () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });
});