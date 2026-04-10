import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @coderabbit-test/shared-services before importing demo-usage.ts
// ---------------------------------------------------------------------------
const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => '[]');
const mockSend = vi.fn(() => 'notif-id-123');
const mockGetAll = vi.fn(() => []);

vi.mock('@coderabbit-test/shared-services', () => {
  return {
    AnalyticsService: vi.fn(() => ({
      track: mockTrack,
      exportEvents: mockExportEvents,
    })),
    NotificationService: vi.fn(() => ({
      send: mockSend,
      getAll: mockGetAll,
    })),
    NotificationType: {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
});

// Import after mocks are registered
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices (demo-usage.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default stub for getAll so forEach does not fail
    mockGetAll.mockReturnValue([]);
  });

  it('is a function', () => {
    expect(typeof demonstrateServices).toBe('function');
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
  });

  it('tracks a page_view event second', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
  });

  it('user_login event includes browser and version properties', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.properties).toMatchObject({
      browser: 'Chrome',
      version: '120.0.0',
    });
  });

  it('page_view event includes page and referrer properties', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.properties).toMatchObject({
      page: '/dashboard',
      referrer: '/login',
    });
  });

  it('analytics events include a timestamp that is a Date instance', () => {
    demonstrateServices();
    const loginEvent = mockTrack.mock.calls[0][0];
    const pageViewEvent = mockTrack.mock.calls[1][0];
    expect(loginEvent.timestamp).toBeInstanceOf(Date);
    expect(pageViewEvent.timestamp).toBeInstanceOf(Date);
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

  it('sends an INFO notification about the new feature', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!',
    );
  });

  it('calls exportEvents to retrieve tracked analytics', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll to retrieve all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('iterates over all returned notifications and logs each', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAll.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'Logged in.' },
      { type: 'info', title: 'Feature', message: 'New feature.' },
    ]);
    demonstrateServices();
    // Verify the function iterated without throwing
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns void (undefined)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('does not throw when notifications list is empty', () => {
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('does not throw when exportEvents returns an empty array string', () => {
    mockExportEvents.mockReturnValue('[]');
    expect(() => demonstrateServices()).not.toThrow();
  });
});