/**
 * Tests for demo-usage.ts (new file added in PR)
 *
 * demonstrateServices() is the only export. It creates instances of AnalyticsService
 * and NotificationService (from @coderabbit-test/shared-services) at module level, then
 * exercises them in demonstrateServices().
 *
 * We mock the shared-services package so tests run without a compiled dist/ build.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted ensures these mocks are available when vi.mock() factory runs (it gets hoisted)
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  exportEvents: vi.fn().mockReturnValue('[]'),
  getEvents: vi.fn().mockReturnValue([]),
  send: vi.fn().mockReturnValue('mock-notification-id'),
  getAll: vi.fn().mockReturnValue([]),
}));

vi.mock('@coderabbit-test/shared-services', () => {
  class AnalyticsService {
    track = mocks.track;
    exportEvents = mocks.exportEvents;
    getEvents = mocks.getEvents;
  }

  class NotificationService {
    send = mocks.send;
    getAll = mocks.getAll;
  }

  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  };

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import after mock setup
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices (demo-usage.ts)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Restore default return values after clearing
    mocks.exportEvents.mockReturnValue('[]');
    mocks.send.mockReturnValue('mock-notification-id');
    mocks.getAll.mockReturnValue([]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('executes without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('calls analytics.track() exactly twice', () => {
    demonstrateServices();
    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it('tracks a "user_login" event first', () => {
    demonstrateServices();
    const firstCall = mocks.track.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
  });

  it('tracks a "page_view" event second', () => {
    demonstrateServices();
    const secondCall = mocks.track.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
  });

  it('user_login event includes browser and version properties', () => {
    demonstrateServices();
    const firstCall = mocks.track.mock.calls[0][0];
    expect(firstCall.properties).toMatchObject({
      browser: 'Chrome',
      version: '120.0.0',
    });
  });

  it('page_view event includes page and referrer properties', () => {
    demonstrateServices();
    const secondCall = mocks.track.mock.calls[1][0];
    expect(secondCall.properties).toMatchObject({
      page: '/dashboard',
      referrer: '/login',
    });
  });

  it('each tracked event has a Date timestamp', () => {
    demonstrateServices();
    for (const call of mocks.track.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it('calls notifications.send() exactly twice', () => {
    demonstrateServices();
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with "Welcome!" title', () => {
    demonstrateServices();
    expect(mocks.send).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO notification with "New Feature" title', () => {
    demonstrateServices();
    expect(mocks.send).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('calls analytics.exportEvents() to log analytics data', () => {
    demonstrateServices();
    expect(mocks.exportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll() to list notifications', () => {
    demonstrateServices();
    expect(mocks.getAll).toHaveBeenCalledTimes(1);
  });

  it('logs the analytics events export result to console', () => {
    const exportedJson = JSON.stringify([{ eventName: 'test' }]);
    mocks.exportEvents.mockReturnValue(exportedJson);
    demonstrateServices();
    const logCalls = consoleSpy.mock.calls.map(c => c[0]);
    expect(logCalls.some(msg => msg === exportedJson)).toBe(true);
  });

  it('iterates over all notifications returned by getAll() and logs each', () => {
    mocks.getAll.mockReturnValue([
      { type: 'success', title: 'A', message: 'B' },
      { type: 'info', title: 'C', message: 'D' },
    ]);
    demonstrateServices();
    const logMessages = consoleSpy.mock.calls.map(c => String(c[0]));
    expect(logMessages.some(m => m.includes('[SUCCESS] A: B'))).toBe(true);
    expect(logMessages.some(m => m.includes('[INFO] C: D'))).toBe(true);
  });

  it('prints a service recognition completion message', () => {
    demonstrateServices();
    const logMessages = consoleSpy.mock.calls.map(c => String(c[0]));
    expect(logMessages.some(m => m.includes('Internal package successfully referenced'))).toBe(true);
  });

  it('notification type is uppercased in the output log', () => {
    mocks.getAll.mockReturnValue([
      { type: 'warning', title: 'Watch out', message: 'Something is off' },
    ]);
    demonstrateServices();
    const logMessages = consoleSpy.mock.calls.map(c => String(c[0]));
    expect(logMessages.some(m => m.includes('[WARNING]'))).toBe(true);
  });

  it('handles an empty notifications list without errors', () => {
    mocks.getAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('notification log format includes type, title, and message', () => {
    mocks.getAll.mockReturnValue([
      { type: 'error', title: 'Critical', message: 'Server down' },
    ]);
    demonstrateServices();
    const logMessages = consoleSpy.mock.calls.map(c => String(c[0]));
    const formatted = logMessages.find(m => m.includes('[ERROR]'));
    expect(formatted).toMatch(/\[ERROR\] Critical: Server down/);
  });
});