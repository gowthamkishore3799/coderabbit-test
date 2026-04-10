import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for demo-usage.ts — the new file added in this PR.
 *
 * demo-usage.ts imports AnalyticsService and NotificationService from
 * @coderabbit-test/shared-services. Those services internally call
 * zod.parse() with a z.record(z.any()) schema that is broken in the
 * installed zod 4.x build. We therefore mock the entire shared-services
 * module so that the logic in demonstrateServices() can be exercised
 * independently of the service internals.
 */

// ---------------------------------------------------------------------------
// Mock @coderabbit-test/shared-services
// ---------------------------------------------------------------------------
const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => JSON.stringify([
  { eventName: 'user_login', userId: 'user123' },
  { eventName: 'page_view',  userId: 'user123' },
]));
const mockGetAll = vi.fn(() => [
  { type: 'success', title: 'Welcome!',     message: 'You have successfully logged in.' },
  { type: 'info',    title: 'New Feature',  message: 'Check out our new analytics dashboard!' },
]);
const mockSend = vi.fn(() => 'mock-id-123');

vi.mock('@coderabbit-test/shared-services', () => {
  return {
    AnalyticsService: class {
      track = mockTrack;
      exportEvents = mockExportEvents;
    },
    NotificationService: class {
      send = mockSend;
      getAll = mockGetAll;
    },
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

// ---------------------------------------------------------------------------
// demonstrateServices() — new function added in this PR
// ---------------------------------------------------------------------------
describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockTrack.mockClear();
    mockSend.mockClear();
    mockExportEvents.mockClear();
    mockGetAll.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the header banner', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('logs analytics events section header', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('logs notifications section header', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('logs completion messages', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
    expect(console.log).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!'
    );
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('first track call is for user_login event', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.properties.browser).toBe('Chrome');
  });

  it('second track call is for page_view event', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.properties.page).toBe('/dashboard');
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('first notification is a SUCCESS type with Welcome! title', () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[0];
    expect(type).toBe('success');
    expect(title).toBe('Welcome!');
    expect(message).toBe('You have successfully logged in.');
  });

  it('second notification is an INFO type about new feature', () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[1];
    expect(type).toBe('info');
    expect(title).toBe('New Feature');
    expect(message).toContain('analytics dashboard');
  });

  it('calls analytics.exportEvents to display events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll to display notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs each notification in [TYPE] TITLE: MESSAGE format', () => {
    demonstrateServices();
    expect(console.log).toHaveBeenCalledWith('[SUCCESS] Welcome!: You have successfully logged in.');
    expect(console.log).toHaveBeenCalledWith('[INFO] New Feature: Check out our new analytics dashboard!');
  });

  it('track calls include a timestamp Date object', () => {
    demonstrateServices();
    for (const call of mockTrack.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it('re-invoking produces independent calls each time', () => {
    demonstrateServices();
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});