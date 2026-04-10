import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @coderabbit-test/shared-services module before importing demo-usage
const mockTrack = vi.fn();
const mockSend = vi.fn(() => 'mock-notification-id');
const mockExportEvents = vi.fn(() => '[]');
const mockGetAll = vi.fn(() => []);

vi.mock('@coderabbit-test/shared-services', () => {
  class MockAnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
  }
  class MockNotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }
  return {
    AnalyticsService: MockAnalyticsService,
    NotificationService: MockNotificationService,
    NotificationType: {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
});

// Import after mock is set up
const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('is a function that can be called without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('tracks exactly two analytics events', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks a user_login event first', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.timestamp).toBeInstanceOf(Date);
    expect(firstCall.properties).toMatchObject({
      browser: 'Chrome',
      version: '120.0.0',
    });
  });

  it('tracks a page_view event second', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.timestamp).toBeInstanceOf(Date);
    expect(secondCall.properties).toMatchObject({
      page: '/dashboard',
      referrer: '/login',
    });
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with correct title and message', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.',
    );
  });

  it('sends an INFO notification with correct title and message', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!',
    );
  });

  it('calls exportEvents to retrieve analytics data', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll to retrieve notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs section headers to the console', () => {
    demonstrateServices();
    const logCalls = consoleSpy.mock.calls.map((args) => args[0]);
    expect(logCalls).toContain('=== Demonstrating Internal Package Services ===\n');
    expect(logCalls).toContain('\n=== Analytics Events ===');
    expect(logCalls).toContain('\n=== Notifications ===');
    expect(logCalls).toContain('\n=== Service Recognition Test Complete ===');
    expect(logCalls).toContain('Internal package successfully referenced and used!');
  });

  it('returns void (undefined)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('iterates over all returned notifications and logs them', () => {
    const fakeNotifications = [
      { type: 'success', title: 'Title1', message: 'Msg1' },
      { type: 'info', title: 'Title2', message: 'Msg2' },
    ];
    mockGetAll.mockReturnValueOnce(fakeNotifications);

    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map((args) => args[0]);
    expect(logCalls).toContain('[SUCCESS] Title1: Msg1');
    expect(logCalls).toContain('[INFO] Title2: Msg2');
  });

  it('handles empty notifications list gracefully', () => {
    mockGetAll.mockReturnValueOnce([]);
    expect(() => demonstrateServices()).not.toThrow();
  });
});