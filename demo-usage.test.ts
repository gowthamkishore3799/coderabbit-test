/**
 * Tests for demo-usage.ts – demonstrateServices()
 *
 * This file was added in the PR. It creates module-level AnalyticsService and
 * NotificationService instances and exports a demonstrateServices() function
 * that exercises both services.
 *
 * Because the services are instantiated at module scope we mock the entire
 * '@coderabbit-test/shared-services' module so we can spy on every call.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock the shared-services package before any import of demo-usage.ts ──────
const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => '[]');
const mockSend = vi.fn(() => 'notification-id-1');
const mockGetAll = vi.fn(() => []);

vi.mock('@coderabbit-test/shared-services', () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(function () {
      this.track = mockTrack;
      this.exportEvents = mockExportEvents;
    }),
    NotificationService: vi.fn().mockImplementation(function () {
      this.send = mockSend;
      this.getAll = mockGetAll;
    }),
    NotificationType: {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
});

// Import AFTER mock is registered
const { demonstrateServices } = await import('./demo-usage.js');

describe('demonstrateServices()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default return values
    mockExportEvents.mockReturnValue('[]');
    mockGetAll.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls analytics.track() exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks a "user_login" event as the first analytics call', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.timestamp).toBeInstanceOf(Date);
    expect(firstCall.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
  });

  it('tracks a "page_view" event as the second analytics call', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.properties).toMatchObject({
      page: '/dashboard',
      referrer: '/login',
    });
  });

  it('calls notifications.send() exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with the expected title and message', () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[0];
    expect(type).toBe('success');
    expect(title).toBe('Welcome!');
    expect(message).toBe('You have successfully logged in.');
  });

  it('sends an INFO notification as the second send call', () => {
    demonstrateServices();
    const [type, title, message] = mockSend.mock.calls[1];
    expect(type).toBe('info');
    expect(title).toBe('New Feature');
    expect(message).toBe('Check out our new analytics dashboard!');
  });

  it('calls analytics.exportEvents() once', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll() once', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs output to console without throwing', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => demonstrateServices()).not.toThrow();
    consoleSpy.mockRestore();
  });

  it('iterates over the list returned by notifications.getAll()', () => {
    const notifications = [
      { type: 'success', title: 'Done', message: 'OK' },
      { type: 'info', title: 'Heads up', message: 'FYI' },
    ];
    mockGetAll.mockReturnValue(notifications);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    consoleSpy.mockRestore();

    // getAll was called; no error means forEach ran without throwing
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('returns void', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('can be called multiple times without error', () => {
    demonstrateServices();
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});