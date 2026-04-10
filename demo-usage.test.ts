import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available when vi.mock factory runs (which is hoisted)
const { mockTrack, mockExportEvents, mockSend, mockGetAll } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn(() => '[]'),
  mockSend: vi.fn(() => 'mock-notification-id'),
  mockGetAll: vi.fn(() => [] as unknown[]),
}));

// Mock the @coderabbit-test/shared-services package entirely.
vi.mock('@coderabbit-test/shared-services', () => {
  function AnalyticsService(this: Record<string, unknown>) {
    this['track'] = mockTrack;
    this['exportEvents'] = mockExportEvents;
  }
  function NotificationService(this: Record<string, unknown>) {
    this['send'] = mockSend;
    this['getAll'] = mockGetAll;
  }
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

const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue('[]');
    mockGetAll.mockReturnValue([]);
  });

  it('is exported as a function', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('first tracked event is user_login for user123', () => {
    demonstrateServices();
    const firstArg = mockTrack.mock.calls[0][0] as Record<string, unknown>;
    expect(firstArg['eventName']).toBe('user_login');
    expect(firstArg['userId']).toBe('user123');
    expect(firstArg['properties']).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
  });

  it('second tracked event is page_view for user123', () => {
    demonstrateServices();
    const secondArg = mockTrack.mock.calls[1][0] as Record<string, unknown>;
    expect(secondArg['eventName']).toBe('page_view');
    expect(secondArg['userId']).toBe('user123');
    expect(secondArg['properties']).toMatchObject({ page: '/dashboard', referrer: '/login' });
  });

  it('each tracked event carries a Date timestamp', () => {
    demonstrateServices();
    for (const args of mockTrack.mock.calls) {
      expect((args[0] as Record<string, unknown>)['timestamp']).toBeInstanceOf(Date);
    }
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification titled "Welcome!"', () => {
    demonstrateServices();
    const sendCalls = mockSend.mock.calls as [string, string, string][];
    const welcomeCall = sendCalls.find((c) => c[1] === 'Welcome!');
    expect(welcomeCall).toBeDefined();
    expect(welcomeCall![0]).toBe('success');
    expect(welcomeCall![2]).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification titled "New Feature"', () => {
    demonstrateServices();
    const sendCalls = mockSend.mock.calls as [string, string, string][];
    const infoCall = sendCalls.find((c) => c[1] === 'New Feature');
    expect(infoCall).toBeDefined();
    expect(infoCall![0]).toBe('info');
    expect(infoCall![2]).toBe('Check out our new analytics dashboard!');
  });

  it('calls analytics.exportEvents once to print events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll once to print notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the notification list is empty', () => {
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('does not throw when the notification list has items', () => {
    mockGetAll.mockReturnValue([
      { id: '1', type: 'success', title: 'Hi', message: 'Hello', timestamp: new Date(), read: false },
    ]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('returns undefined (the function has no explicit return)', () => {
    expect(demonstrateServices()).toBeUndefined();
  });

  it('logs the introductory banner to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    const messages = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('Demonstrating Internal Package Services'))).toBe(true);
    consoleSpy.mockRestore();
  });

  it('logs the analytics section header', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    const messages = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('Analytics Events'))).toBe(true);
    consoleSpy.mockRestore();
  });

  it('logs the notifications section header', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    const messages = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('Notifications'))).toBe(true);
    consoleSpy.mockRestore();
  });
});