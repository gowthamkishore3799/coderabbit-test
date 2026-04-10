/**
 * Tests for demo-usage.ts — new file added in this PR.
 *
 * demonstrateServices() creates module-level AnalyticsService and
 * NotificationService instances, then calls them.  We mock the
 * @coderabbit-test/shared-services module so the tests work without
 * requiring the package's compiled dist artefacts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mock for @coderabbit-test/shared-services
// ---------------------------------------------------------------------------

const mockTrack = vi.fn();
const mockExportEvents = vi.fn().mockReturnValue('[]');
const mockGetAllNotifications = vi.fn().mockReturnValue([]);
const mockSend = vi.fn().mockReturnValue('notif-id-123');

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
    getAll = mockGetAllNotifications;
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import AFTER mocks are registered
const { demonstrateServices } = await import('./demo-usage');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('demonstrateServices()', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Re-configure return values after clearing
    mockExportEvents.mockReturnValue(JSON.stringify([{ eventName: 'user_login' }], null, 2));
    mockGetAllNotifications.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ]);
    mockSend.mockReturnValue('notif-id-abc');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('tracks the user_login analytics event', () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    const loginCall = calls.find(([event]: [{ eventName: string }]) => event.eventName === 'user_login');
    expect(loginCall).toBeDefined();
  });

  it('includes userId and properties on the user_login event', () => {
    demonstrateServices();
    const [loginEvent] = mockTrack.mock.calls.find(
      ([e]: [{ eventName: string }]) => e.eventName === 'user_login'
    ) ?? [];
    expect(loginEvent.userId).toBe('user123');
    expect(loginEvent.properties).toMatchObject({ browser: 'Chrome' });
  });

  it('tracks the page_view analytics event', () => {
    demonstrateServices();
    const calls = mockTrack.mock.calls;
    const pageViewCall = calls.find(([e]: [{ eventName: string }]) => e.eventName === 'page_view');
    expect(pageViewCall).toBeDefined();
  });

  it('tracks exactly two analytics events', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification for Welcome!', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith('success', 'Welcome!', 'You have successfully logged in.');
  });

  it('sends an INFO notification for New Feature', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith('info', 'New Feature', 'Check out our new analytics dashboard!');
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('calls exportEvents() to retrieve analytics output', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll() to retrieve all notifications', () => {
    demonstrateServices();
    expect(mockGetAllNotifications).toHaveBeenCalledTimes(1);
  });

  it('logs the service demonstration header to the console', () => {
    demonstrateServices();
    const loggedMessages: string[] = consoleSpy.mock.calls.map(([msg]) => String(msg));
    expect(loggedMessages.some((m) => m.includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs the completion message to the console', () => {
    demonstrateServices();
    const loggedMessages: string[] = consoleSpy.mock.calls.map(([msg]) => String(msg));
    expect(loggedMessages.some((m) => m.includes('Service Recognition Test Complete'))).toBe(true);
  });

  it('passes a Date instance as the timestamp for user_login', () => {
    demonstrateServices();
    const [loginEvent] = mockTrack.mock.calls[0];
    expect(loginEvent.timestamp).toBeInstanceOf(Date);
  });

  it('passes a Date instance as the timestamp for page_view', () => {
    demonstrateServices();
    const [pageViewEvent] = mockTrack.mock.calls[1];
    expect(pageViewEvent.timestamp).toBeInstanceOf(Date);
  });

  it('iterates over returned notifications and logs each one', () => {
    demonstrateServices();
    const logged: string[] = consoleSpy.mock.calls.map(([msg]) => String(msg));
    // Should log at least one formatted notification entry
    expect(logged.some((m) => m.includes('[SUCCESS]') || m.includes('[INFO]'))).toBe(true);
  });
});