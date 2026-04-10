/**
 * Tests for demo-usage.ts – demonstrateServices.
 *
 * PR change: new file added that wires up AnalyticsService and NotificationService
 * from @coderabbit-test/shared-services and exposes a demonstrateServices() function.
 *
 * Because @coderabbit-test/shared-services is a local workspace package that requires
 * compiled dist/ artefacts, the module is fully mocked so tests are self-contained.
 *
 * vi.hoisted() is used to create mock fn references that survive the vi.mock() hoisting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these mock functions are created BEFORE vi.mock hoists the factory.
const { mockTrack, mockExportEvents, mockGetEvents, mockSend, mockGetAll } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockExportEvents: vi.fn(() => '[]'),
  mockGetEvents: vi.fn(() => []),
  mockSend: vi.fn(() => 'mock-notification-id'),
  mockGetAll: vi.fn(() => [] as any[]),
}));

vi.mock('@coderabbit-test/shared-services', () => {
  class AnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
    getEvents = mockGetEvents;
  }

  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }

  return {
    AnalyticsService,
    NotificationService,
    NotificationType: {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
});

// Import AFTER mocking so the module uses our mocked classes
import { demonstrateServices } from './demo-usage';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue('[]');
    mockGetAll.mockReturnValue([]);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('is exported as a named export', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('does not throw when called', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('tracks exactly two analytics events', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks the user_login event with userId user123 as first event', () => {
    demonstrateServices();
    const firstArg = mockTrack.mock.calls[0][0] as Record<string, unknown>;
    expect(firstArg.eventName).toBe('user_login');
    expect(firstArg.userId).toBe('user123');
  });

  it('includes browser and version properties in the user_login event', () => {
    demonstrateServices();
    const firstArg = mockTrack.mock.calls[0][0] as { properties: Record<string, string> };
    expect(firstArg.properties?.browser).toBe('Chrome');
    expect(firstArg.properties?.version).toBe('120.0.0');
  });

  it('tracks the page_view event with userId user123 as second event', () => {
    demonstrateServices();
    const secondArg = mockTrack.mock.calls[1][0] as Record<string, unknown>;
    expect(secondArg.eventName).toBe('page_view');
    expect(secondArg.userId).toBe('user123');
  });

  it('includes page and referrer properties in the page_view event', () => {
    demonstrateServices();
    const secondArg = mockTrack.mock.calls[1][0] as { properties: Record<string, string> };
    expect(secondArg.properties?.page).toBe('/dashboard');
    expect(secondArg.properties?.referrer).toBe('/login');
  });

  it('every tracked event carries a timestamp that is a Date instance', () => {
    demonstrateServices();
    for (const call of mockTrack.mock.calls) {
      expect((call[0] as Record<string, unknown>).timestamp).toBeInstanceOf(Date);
    }
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification first with correct title and message', () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[0];
    expect(type).toBe('success');
    expect(title).toBe('Welcome!');
    expect(message).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification second with "New Feature" title', () => {
    demonstrateServices();
    const [type, title] = mockSend.mock.calls[1];
    expect(type).toBe('info');
    expect(title).toBe('New Feature');
  });

  it('calls exportEvents once to print the analytics summary', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll once to retrieve notifications for display', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs the opening banner to the console', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    const logged = logSpy.mock.calls.map(c => c[0]);
    expect(logged.some(msg => typeof msg === 'string' && msg.includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs [TYPE] title: message for each notification returned by getAll', () => {
    const fakeNotifications = [
      { type: 'success', title: 'Done', message: 'Task complete' },
      { type: 'info', title: 'Update', message: 'New version available' },
    ];
    mockGetAll.mockReturnValue(fakeNotifications);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    demonstrateServices();

    const logged = logSpy.mock.calls.map(c => c[0]);
    expect(logged.some(msg => typeof msg === 'string' && msg.includes('[SUCCESS] Done: Task complete'))).toBe(true);
    expect(logged.some(msg => typeof msg === 'string' && msg.includes('[INFO] Update: New version available'))).toBe(true);
  });

  it('does not access getEvents – only track and exportEvents are used for analytics', () => {
    demonstrateServices();
    expect(mockGetEvents).not.toHaveBeenCalled();
  });
});