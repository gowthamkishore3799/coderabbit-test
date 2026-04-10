import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock @coderabbit-test/shared-services ───────────────────────────────────
// demo-usage.ts creates module-level service instances, so we mock the module
// before it is first imported.

const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => JSON.stringify([]));
const mockSend = vi.fn(() => "notification-id-1");
const mockGetAll = vi.fn(() => []);

vi.mock("@coderabbit-test/shared-services", () => {
  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  };

  class AnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
  }

  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import after the mock is registered so the module-level instances use mocks.
import { demonstrateServices } from "./demo-usage";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("demonstrateServices", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
    // Re-initialise return values after clearAllMocks resets them.
    mockExportEvents.mockReturnValue(JSON.stringify([]));
    mockSend.mockReturnValue("notification-id-1");
    mockGetAll.mockReturnValue([]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("executes without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("tracks exactly two analytics events", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks a user_login event as the first call", () => {
    demonstrateServices();
    const firstCallArg = mockTrack.mock.calls[0][0];
    expect(firstCallArg.eventName).toBe("user_login");
    expect(firstCallArg.userId).toBe("user123");
  });

  it("tracks a page_view event as the second call", () => {
    demonstrateServices();
    const secondCallArg = mockTrack.mock.calls[1][0];
    expect(secondCallArg.eventName).toBe("page_view");
    expect(secondCallArg.userId).toBe("user123");
  });

  it("tracks events with a Date timestamp", () => {
    demonstrateServices();
    mockTrack.mock.calls.forEach(([event]) => {
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  it("sends exactly two notifications", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with title 'Welcome!'", () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[0];
    expect(type).toBe("success");
    expect(title).toBe("Welcome!");
    expect(message).toBe("You have successfully logged in.");
  });

  it("sends an INFO notification about the new feature", () => {
    demonstrateServices();
    const [type, title] = mockSend.mock.calls[1];
    expect(type).toBe("info");
    expect(title).toBe("New Feature");
  });

  it("calls exportEvents once", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls getAll once to retrieve all notifications", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("logs the exported events JSON string to console", () => {
    const fakeExport = JSON.stringify([{ eventName: "test" }]);
    mockExportEvents.mockReturnValue(fakeExport);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(fakeExport);
  });

  it("logs each notification using its type, title, and message", () => {
    mockGetAll.mockReturnValue([
      {
        type: "success",
        title: "Welcome!",
        message: "You have successfully logged in.",
      },
    ]);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[SUCCESS] Welcome!: You have successfully logged in."
    );
  });

  it("logs the introductory banner", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs the completion message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Internal package successfully referenced and used!"
    );
  });

  it("can be called multiple times without throwing", () => {
    mockSend.mockReturnValue("id");
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
    // Each call tracks 2 events and sends 2 notifications.
    expect(mockTrack).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});