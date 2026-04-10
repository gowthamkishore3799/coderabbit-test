import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for demo-usage.ts (newly added file in this PR).
 *
 * demo-usage.ts creates module-level AnalyticsService and NotificationService instances
 * and exports demonstrateServices() which calls track, send, exportEvents, and getAll.
 *
 * @coderabbit-test/shared-services is mocked so tests are self-contained.
 */

const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => '[]');
const mockSend = vi.fn(() => 'notif-id-1');
const mockGetAll = vi.fn(() => []);

vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
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

// Import after mock is set up
const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue('[]');
    mockSend.mockReturnValue('notif-id-1');
    mockGetAll.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a function', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks a user_login event as the first call', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.timestamp).toBeInstanceOf(Date);
    expect(firstCall.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
  });

  it('tracks a page_view event as the second call', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.timestamp).toBeInstanceOf(Date);
    expect(secondCall.properties).toMatchObject({ page: '/dashboard', referrer: '/login' });
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with correct title and message', () => {
    demonstrateServices();
    const successCall = mockSend.mock.calls[0];
    expect(successCall[0]).toBe('success');
    expect(successCall[1]).toBe('Welcome!');
    expect(successCall[2]).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification with correct title and message', () => {
    demonstrateServices();
    const infoCall = mockSend.mock.calls[1];
    expect(infoCall[0]).toBe('info');
    expect(infoCall[1]).toBe('New Feature');
    expect(infoCall[2]).toBe('Check out our new analytics dashboard!');
  });

  it('calls analytics.exportEvents to retrieve events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll to retrieve all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs notification entries for each returned notification', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAll.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'Logged in.' },
      { type: 'info', title: 'New Feature', message: 'Dashboard available.' },
    ]);

    demonstrateServices();

    const loggedMessages = consoleSpy.mock.calls.map(c => c[0]);
    expect(loggedMessages.some(m => typeof m === 'string' && m.includes('[SUCCESS]'))).toBe(true);
    expect(loggedMessages.some(m => typeof m === 'string' && m.includes('[INFO]'))).toBe(true);
  });

  it('returns void (undefined)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('can be called multiple times without throwing', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });

  it('uses the return value of notifications.send (notification id)', () => {
    // demonstrateServices stores the first send return value in notificationId
    // The function currently does not return it but we verify send was called
    mockSend.mockReturnValueOnce('test-id-abc').mockReturnValueOnce('test-id-xyz');
    expect(() => demonstrateServices()).not.toThrow();
    expect(mockSend.mock.results[0].value).toBe('test-id-abc');
  });
});