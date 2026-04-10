import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mock the internal shared-services package ----
// The compiled dist has a runtime Zod version conflict so we mock
// the module to test demonstrateServices() in isolation.
// vi.hoisted() ensures these mocks are available inside the vi.mock() factory.

const { mockTrack, mockSend, mockExportEvents, mockGetAll } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockSend: vi.fn().mockReturnValue('mock-notification-id'),
  mockExportEvents: vi.fn().mockReturnValue('[]'),
  mockGetAll: vi.fn().mockReturnValue([
    { id: '1', type: 'success', title: 'Welcome!', message: 'Logged in.', timestamp: new Date(), read: false },
    { id: '2', type: 'info', title: 'New Feature', message: 'Check out analytics!', timestamp: new Date(), read: false },
  ]),
}));

vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = { SUCCESS: 'success', INFO: 'info', WARNING: 'warning', ERROR: 'error' };

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

// Import AFTER the vi.mock() hoisting resolves
const { demonstrateServices } = await import('./demo-usage');

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.clearAllMocks();
  // Restore return values that clearAllMocks resets
  mockExportEvents.mockReturnValue('[]');
  mockSend.mockReturnValue('mock-notification-id');
  mockGetAll.mockReturnValue([
    { id: '1', type: 'success', title: 'Welcome!', message: 'Logged in.', timestamp: new Date(), read: false },
    { id: '2', type: 'info', title: 'New Feature', message: 'Check out analytics!', timestamp: new Date(), read: false },
  ]);
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe('demonstrateServices', () => {
  it('is a named export function', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('returns undefined (void function)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('logs the introductory banner', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat() as string[];
    expect(calls.some(c => String(c).includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs the analytics events section header', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat() as string[];
    expect(calls.some(c => String(c).includes('Analytics Events'))).toBe(true);
  });

  it('logs the notifications section header', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat() as string[];
    expect(calls.some(c => String(c).includes('Notifications'))).toBe(true);
  });

  it('logs the completion message', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat() as string[];
    expect(calls.some(c => String(c).includes('Service Recognition Test Complete'))).toBe(true);
    expect(calls.some(c => String(c).includes('Internal package successfully referenced and used!'))).toBe(true);
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('calls analytics.track with a user_login event', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
  });

  it('calls analytics.track with a page_view event', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.properties?.page).toBe('/dashboard');
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification titled "Welcome!"', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith('success', 'Welcome!', expect.any(String));
  });

  it('sends an INFO notification titled "New Feature"', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith('info', 'New Feature', expect.any(String));
  });

  it('calls analytics.exportEvents to print events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll to list all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('emits more than one console.log call', () => {
    demonstrateServices();
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(1);
  });

  it('can be called multiple times without error', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });
});