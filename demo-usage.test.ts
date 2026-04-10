import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the shared-services package to avoid needing a built dist
const mockTrack = vi.fn();
const mockSend = vi.fn().mockReturnValue('mock-notification-id');
const mockExportEvents = vi.fn().mockReturnValue('[]');
const mockGetAll = vi.fn().mockReturnValue([]);

vi.mock('@coderabbit-test/shared-services', () => {
  function AnalyticsService() {}
  AnalyticsService.prototype.track = mockTrack;
  AnalyticsService.prototype.exportEvents = mockExportEvents;
  AnalyticsService.prototype.getEvents = vi.fn().mockReturnValue([]);
  AnalyticsService.prototype.getEventsByUser = vi.fn().mockReturnValue([]);
  AnalyticsService.prototype.clearEvents = vi.fn();

  function NotificationService() {}
  NotificationService.prototype.send = mockSend;
  NotificationService.prototype.getAll = mockGetAll;
  NotificationService.prototype.getUnread = vi.fn().mockReturnValue([]);
  NotificationService.prototype.markAsRead = vi.fn().mockReturnValue(true);
  NotificationService.prototype.markAllAsRead = vi.fn();
  NotificationService.prototype.subscribe = vi.fn().mockReturnValue(() => {});
  NotificationService.prototype.clear = vi.fn();

  return {
    AnalyticsService,
    NotificationService,
    NotificationType: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      SUCCESS: 'success',
    },
  };
});

// Import AFTER mocking
const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices (demo-usage.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockReturnValue('mock-notification-id');
    mockExportEvents.mockReturnValue('[]');
    mockGetAll.mockReturnValue([]);
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks a user_login event first', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.properties.browser).toBe('Chrome');
    expect(firstCall.properties.version).toBe('120.0.0');
  });

  it('tracks a page_view event second', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.properties.page).toBe('/dashboard');
    expect(secondCall.properties.referrer).toBe('/login');
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with correct title and message', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO notification about New Feature', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('calls analytics.exportEvents once', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll once', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('analytics events include a timestamp Date object', () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    for (const [event] of calls) {
      expect(event.timestamp).toBeInstanceOf(Date);
    }
  });

  it('does not throw when executed', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('iterates over all returned notifications from getAll', () => {
    const mockNotifications = [
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ];
    mockGetAll.mockReturnValue(mockNotifications);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map(c => c[0]);
    expect(logCalls.some(s => typeof s === 'string' && s.includes('SUCCESS'))).toBe(true);
    expect(logCalls.some(s => typeof s === 'string' && s.includes('INFO'))).toBe(true);
    consoleSpy.mockRestore();
  });

  it('exports demonstrateServices as a named export', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('user_login event properties contain browser and version', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.properties).toHaveProperty('browser', 'Chrome');
    expect(firstCall.properties).toHaveProperty('version', '120.0.0');
  });

  it('page_view event properties contain page and referrer', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.properties).toHaveProperty('page', '/dashboard');
    expect(secondCall.properties).toHaveProperty('referrer', '/login');
  });
});