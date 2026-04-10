import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We mock @coderabbit-test/shared-services so we can inspect calls and control
// state without requiring the package to be built (no dist/ folder).
const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => "[]");
const mockSend = vi.fn(() => "mock-id-001");
const mockGetAll = vi.fn(() => []);

vi.mock("@coderabbit-test/shared-services", () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(() => ({
      track: mockTrack,
      exportEvents: mockExportEvents,
    })),
    NotificationService: vi.fn().mockImplementation(() => ({
      send: mockSend,
      getAll: mockGetAll,
    })),
    NotificationType: {
      SUCCESS: "success",
      INFO: "info",
      WARNING: "warning",
      ERROR: "error",
    },
  };
});

// Static import – vi.mock() is hoisted before imports by Vitest, so the mock
// is active when demo-usage.ts is evaluated and its module-level singletons
// (new AnalyticsService(), new NotificationService()) are initialised.
import { demonstrateServices } from "./demo-usage";

describe("demonstrateServices", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Reset default mock implementations
    mockExportEvents.mockReturnValue("[]");
    mockGetAll.mockReturnValue([]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("is a callable function", () => {
    expect(typeof demonstrateServices).toBe("function");
  });

  it("runs without throwing", () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("calls analytics.track exactly twice", () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it("tracks a 'user_login' event first", () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe("user_login");
    expect(firstCall.userId).toBe("user123");
    expect(firstCall.properties).toMatchObject({ browser: "Chrome", version: "120.0.0" });
  });

  it("tracks a 'page_view' event second", () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
    expect(secondCall.userId).toBe("user123");
    expect(secondCall.properties).toMatchObject({ page: "/dashboard", referrer: "/login" });
  });

  it("both tracked events have a timestamp that is a Date", () => {
    demonstrateServices();
    for (const call of mockTrack.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it("calls notifications.send exactly twice", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification titled 'Welcome!'", () => {
    demonstrateServices();
    const firstSend = mockSend.mock.calls[0];
    expect(firstSend[0]).toBe("success"); // NotificationType.SUCCESS
    expect(firstSend[1]).toBe("Welcome!");
    expect(firstSend[2]).toBe("You have successfully logged in.");
  });

  it("sends an INFO notification titled 'New Feature'", () => {
    demonstrateServices();
    const secondSend = mockSend.mock.calls[1];
    expect(secondSend[0]).toBe("info"); // NotificationType.INFO
    expect(secondSend[1]).toBe("New Feature");
    expect(secondSend[2]).toBe("Check out our new analytics dashboard!");
  });

  it("calls analytics.exportEvents to print events", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls notifications.getAll to retrieve notifications for display", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("logs the header banner to the console", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "=== Demonstrating Internal Package Services ===\n"
    );
  });

  it("logs an analytics events section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Analytics Events ===");
  });

  it("logs a notifications section header", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("\n=== Notifications ===");
  });

  it("logs a completion message", () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      "\n=== Service Recognition Test Complete ==="
    );
  });

  it("logs the exported events JSON", () => {
    const jsonOutput = '[{"eventName":"user_login"}]';
    mockExportEvents.mockReturnValue(jsonOutput);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(jsonOutput);
  });

  it("iterates over all notifications from getAll and logs each one", () => {
    mockGetAll.mockReturnValue([
      { type: "success", title: "Welcome!", message: "Logged in." },
      { type: "info", title: "New Feature", message: "Check it out." },
    ]);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith("[SUCCESS] Welcome!: Logged in.");
    expect(consoleSpy).toHaveBeenCalledWith("[INFO] New Feature: Check it out.");
  });

  it("handles an empty notifications list without throwing", () => {
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });
});