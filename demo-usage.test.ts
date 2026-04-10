import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock functions so they are defined before vi.mock() is hoisted ──────
const { mockTrack, mockGetEvents, mockExportEvents, mockSend, mockGetAll } =
  vi.hoisted(() => ({
    mockTrack: vi.fn(),
    mockGetEvents: vi.fn(() => [] as unknown[]),
    mockExportEvents: vi.fn(() => "[]"),
    mockSend: vi.fn((_type: string, _title: string, _message: string) => "mock-id-001"),
    mockGetAll: vi.fn(() => [] as unknown[]),
  }));

// ── Mock @coderabbit-test/shared-services ─────────────────────────────────────
// The shared-services package has no compiled dist/ yet (source-only) so we
// mock the entire module.  The mock closely mirrors the real implementation
// visible in packages/shared-services/src/.

vi.mock("@coderabbit-test/shared-services", () => {
  class AnalyticsService {
    track = mockTrack;
    getEvents = mockGetEvents;
    exportEvents = mockExportEvents;
  }

  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }

  const NotificationType = {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
  } as const;

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import AFTER the mock is registered so the module gets the mocked version.
import { demonstrateServices } from "./demo-usage";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("demonstrateServices (demo-usage.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue("[]");
    mockGetAll.mockReturnValue([]);
  });

  it("is a function exported by demo-usage.ts", () => {
    expect(typeof demonstrateServices).toBe("function");
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
  });

  it("tracks a 'page_view' event second", () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe("page_view");
    expect(secondCall.userId).toBe("user123");
  });

  it("user_login event has browser and version in properties", () => {
    demonstrateServices();
    const event = mockTrack.mock.calls[0][0];
    expect(event.properties?.browser).toBe("Chrome");
    expect(event.properties?.version).toBe("120.0.0");
  });

  it("page_view event has page and referrer in properties", () => {
    demonstrateServices();
    const event = mockTrack.mock.calls[1][0];
    expect(event.properties?.page).toBe("/dashboard");
    expect(event.properties?.referrer).toBe("/login");
  });

  it("each tracked event has a timestamp that is a Date", () => {
    demonstrateServices();
    for (const [event] of mockTrack.mock.calls) {
      expect(event.timestamp).toBeInstanceOf(Date);
    }
  });

  it("calls notifications.send exactly twice", () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends a SUCCESS notification with 'Welcome!' as title", () => {
    demonstrateServices();
    const successCall = mockSend.mock.calls.find(([type]) => type === "success");
    expect(successCall).toBeDefined();
    expect(successCall![1]).toBe("Welcome!");
    expect(successCall![2]).toBe("You have successfully logged in.");
  });

  it("sends an INFO notification with 'New Feature' as title", () => {
    demonstrateServices();
    const infoCall = mockSend.mock.calls.find(([type]) => type === "info");
    expect(infoCall).toBeDefined();
    expect(infoCall![1]).toBe("New Feature");
    expect(infoCall![2]).toBe("Check out our new analytics dashboard!");
  });

  it("calls analytics.exportEvents to log analytics data", () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it("calls notifications.getAll to retrieve and log notifications", () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("iterates over all returned notifications and logs them", () => {
    const fakeNotifications = [
      { type: "success", title: "Hi", message: "Hello" },
      { type: "info", title: "FYI", message: "Info here" },
    ];
    mockGetAll.mockReturnValue(fakeNotifications);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const loggedStrings = logSpy.mock.calls
      .flatMap((args) => args)
      .filter((v) => typeof v === "string");
    const combined = loggedStrings.join("\n");
    expect(combined).toContain("[SUCCESS] Hi: Hello");
    expect(combined).toContain("[INFO] FYI: Info here");
    logSpy.mockRestore();
  });

  it("returns void (undefined)", () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it("does not throw when services return empty data", () => {
    mockExportEvents.mockReturnValue("[]");
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it("logs a header banner to console.log", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const messages = logSpy.mock.calls.flatMap((args) => args).filter((v) => typeof v === "string");
    expect(messages.some((m) => m.includes("Demonstrating Internal Package Services"))).toBe(true);
    logSpy.mockRestore();
  });

  it("logs a completion message", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const messages = logSpy.mock.calls.flatMap((args) => args).filter((v) => typeof v === "string");
    expect(messages.some((m) => m.includes("Service Recognition Test Complete"))).toBe(true);
    logSpy.mockRestore();
  });

  it("logs the export data returned by exportEvents", () => {
    mockExportEvents.mockReturnValue('[{"eventName":"test"}]');
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    demonstrateServices();
    const messages = logSpy.mock.calls.flatMap((args) => args).filter((v) => typeof v === "string");
    expect(messages.some((m) => m.includes('{"eventName":"test"}'))).toBe(true);
    logSpy.mockRestore();
  });
});