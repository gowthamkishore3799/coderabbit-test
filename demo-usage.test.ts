import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted so these mocks are available inside the vi.mock factory (which is hoisted to top of file)
const mocks = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn(() => JSON.stringify([])),
  mockGetEvents: vi.fn(() => []),
  mockGetEventsByUser: vi.fn(() => []),
  mockClearEvents: vi.fn(),
  mockSend: vi.fn(() => 'mock-notification-id'),
  mockGetAll: vi.fn(() => [] as any[]),
  mockGetUnread: vi.fn(() => []),
  mockMarkAsRead: vi.fn(() => true),
  mockMarkAllAsRead: vi.fn(),
  mockSubscribe: vi.fn(() => () => {}),
  mockClear: vi.fn(),
}));

// Mock the shared-services package since it cannot be built (pre-existing TS error in package)
vi.mock('@coderabbit-test/shared-services', () => {
  function AnalyticsService(this: any) {}
  AnalyticsService.prototype.track = mocks.mockTrack;
  AnalyticsService.prototype.exportEvents = mocks.mockExportEvents;
  AnalyticsService.prototype.getEvents = mocks.mockGetEvents;
  AnalyticsService.prototype.getEventsByUser = mocks.mockGetEventsByUser;
  AnalyticsService.prototype.clearEvents = mocks.mockClearEvents;

  function NotificationService(this: any) {}
  NotificationService.prototype.send = mocks.mockSend;
  NotificationService.prototype.getAll = mocks.mockGetAll;
  NotificationService.prototype.getUnread = mocks.mockGetUnread;
  NotificationService.prototype.markAsRead = mocks.mockMarkAsRead;
  NotificationService.prototype.markAllAsRead = mocks.mockMarkAllAsRead;
  NotificationService.prototype.subscribe = mocks.mockSubscribe;
  NotificationService.prototype.clear = mocks.mockClear;

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

import { demonstrateServices } from './demo-usage';

const { mockTrack, mockExportEvents, mockSend, mockGetAll } = mocks;

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockReturnValue([]);
    mockExportEvents.mockReturnValue(JSON.stringify([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks analytics events twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks user_login event with correct shape', () => {
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

  it('tracks page_view event with correct shape', () => {
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

  it('sends notifications twice', () => {
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

  it('sends an INFO notification with correct title and message', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('exports analytics events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('retrieves all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('iterates over all returned notifications and logs them', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    mockGetAll.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ]);
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SUCCESS] Welcome!: You have successfully logged in.'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[INFO] New Feature: Check out our new analytics dashboard!'
    );
  });

  it('logs service demonstration header message', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('logs completion messages', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '\n=== Service Recognition Test Complete ==='
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!'
    );
  });

  it('sends SUCCESS notification before INFO notification', () => {
    demonstrateServices();
    const firstNotif = mockSend.mock.calls[0][0];
    const secondNotif = mockSend.mock.calls[1][0];
    expect(firstNotif).toBe('success');
    expect(secondNotif).toBe('info');
  });

  it('tracks user_login before page_view', () => {
    demonstrateServices();
    expect(mockTrack.mock.calls[0][0].eventName).toBe('user_login');
    expect(mockTrack.mock.calls[1][0].eventName).toBe('page_view');
  });

  it('handles empty notifications list without errors', () => {
    mockGetAll.mockReturnValue([]);
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('returns void (no return value)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });
});