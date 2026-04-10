import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// demonstrateServices
// The module-level analytics/notifications instances in demo-usage.ts are created
// at import time, so we mock @coderabbit-test/shared-services before importing the module.
// ---------------------------------------------------------------------------

const mockTrack = vi.fn();
const mockExportEvents = vi.fn().mockReturnValue('[]');
const mockSend = vi.fn().mockReturnValue('mock-id');
const mockGetAll = vi.fn().mockReturnValue([]);

vi.mock('@coderabbit-test/shared-services', () => {
  class AnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
  }
  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }
  const NotificationType = { SUCCESS: 'success', INFO: 'info', WARNING: 'warning', ERROR: 'error' };
  return { AnalyticsService, NotificationService, NotificationType };
});

// Import after the mock is registered
const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue('[]');
    mockSend.mockReturnValue('mock-id');
    mockGetAll.mockReturnValue([]);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.log with the service demonstration header', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('=== Demonstrating Internal Package Services ===\n');
  });

  it('tracks exactly two analytics events', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('first tracked event is user_login with correct properties', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.properties?.browser).toBe('Chrome');
  });

  it('second tracked event is page_view with correct properties', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.properties?.page).toBe('/dashboard');
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('first notification is SUCCESS type with Welcome title', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenNthCalledWith(1, 'success', 'Welcome!', 'You have successfully logged in.');
  });

  it('second notification is INFO type with New Feature title', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenNthCalledWith(2, 'info', 'New Feature', 'Check out our new analytics dashboard!');
  });

  it('logs the analytics events section header', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('logs the notifications section header', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('logs the service recognition test complete message', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
    expect(consoleSpy).toHaveBeenCalledWith('Internal package successfully referenced and used!');
  });

  it('runs without throwing errors', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });
});
