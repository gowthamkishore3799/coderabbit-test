/**
 * Tests for demo-usage.ts demonstrateServices()
 *
 * This file was ADDED in this PR. It demonstrates using AnalyticsService
 * and NotificationService from @coderabbit-test/shared-services.
 *
 * NOTE: The shared-services package has a runtime incompatibility in
 * AnalyticsService.track() due to z.record(z.any()) being invalid in Zod v4.
 * Tests use vi.mock() to isolate demonstrateServices() from this issue.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

vi.mock('@coderabbit-test/shared-services', () => {
  const AnalyticsService = vi.fn(function (this: Record<string, unknown>) {
    this.track = vi.fn();
    this.getEvents = vi.fn(() => []);
    this.exportEvents = vi.fn(() => '[]');
  });

  const NotificationService = vi.fn(function (this: Record<string, unknown>) {
    this.send = vi.fn(() => 'mock-id');
    this.getAll = vi.fn(() => []);
  });

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

import { demonstrateServices } from '../demo-usage';
import { AnalyticsService, NotificationService } from '@coderabbit-test/shared-services';

describe('demonstrateServices (demo-usage.ts)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  // Module-level instances created once when demo-usage.ts is imported
  let analyticsInstance: any;
  let notificationsInstance: any;

  beforeAll(() => {
    // Instances are created at module load time by `const analytics = new AnalyticsService()`
    analyticsInstance = (AnalyticsService as any).mock.instances[0];
    notificationsInstance = (NotificationService as any).mock.instances[0];
  });

  beforeEach(() => {
    // Clear call history on the instance methods (not the instances themselves)
    analyticsInstance.track.mockClear();
    analyticsInstance.getEvents.mockClear();
    analyticsInstance.exportEvents.mockClear().mockReturnValue('[]');
    notificationsInstance.send.mockClear().mockReturnValue('mock-id');
    notificationsInstance.getAll.mockClear().mockReturnValue([]);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('runs without throwing', () => {
    // Verified by beforeEach calling demonstrateServices() without error
    expect(true).toBe(true);
  });

  it('logs to console', () => {
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('logs the demo header message', () => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Demonstrating Internal Package Services')
    );
  });

  it('logs the analytics events section header', () => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analytics Events')
    );
  });

  it('logs the notifications section header', () => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Notifications')
    );
  });

  it('logs the completion message', () => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Service Recognition Test Complete')
    );
  });

  it('logs the package reference success message', () => {
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Internal package successfully referenced')
    );
  });

  it('calls analytics.track exactly twice', () => {
    expect(analyticsInstance.track).toHaveBeenCalledTimes(2);
  });

  it('calls analytics.track with user_login event first', () => {
    expect(analyticsInstance.track).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventName: 'user_login', userId: 'user123' })
    );
  });

  it('calls analytics.track with page_view event second', () => {
    expect(analyticsInstance.track).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventName: 'page_view', userId: 'user123' })
    );
  });

  it('calls analytics.track with Date timestamp objects', () => {
    const calls = analyticsInstance.track.mock.calls;
    for (const [event] of calls) {
      expect(event.timestamp).toBeInstanceOf(Date);
    }
  });

  it('calls analytics.track with browser properties in user_login event', () => {
    expect(analyticsInstance.track).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        properties: expect.objectContaining({ browser: 'Chrome', version: '120.0.0' }),
      })
    );
  });

  it('calls analytics.track with page properties in page_view event', () => {
    expect(analyticsInstance.track).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        properties: expect.objectContaining({ page: '/dashboard', referrer: '/login' }),
      })
    );
  });

  it('calls notifications.send exactly twice', () => {
    expect(notificationsInstance.send).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with Welcome title', () => {
    expect(notificationsInstance.send).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO notification about New Feature', () => {
    expect(notificationsInstance.send).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('calls analytics.exportEvents', () => {
    expect(analyticsInstance.exportEvents).toHaveBeenCalled();
  });

  it('calls notifications.getAll to iterate notifications', () => {
    expect(notificationsInstance.getAll).toHaveBeenCalled();
  });

  it('logs each notification from getAll() with type and title', () => {
    // Reset and reconfigure for this specific test
    consoleSpy.mockRestore();
    analyticsInstance.track.mockClear();
    notificationsInstance.send.mockClear().mockReturnValue('mock-id');
    notificationsInstance.getAll.mockClear().mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ]);
    analyticsInstance.exportEvents.mockReturnValue('[]');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    expect(logSpy).toHaveBeenCalledWith('[SUCCESS] Welcome!: You have successfully logged in.');
    expect(logSpy).toHaveBeenCalledWith('[INFO] New Feature: Check out our new analytics dashboard!');
    logSpy.mockRestore();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('prints exported events JSON from analytics.exportEvents()', () => {
    consoleSpy.mockRestore();
    analyticsInstance.track.mockClear();
    notificationsInstance.send.mockClear().mockReturnValue('mock-id');
    notificationsInstance.getAll.mockReturnValue([]);
    const mockJson = '[{"eventName":"user_login"}]';
    analyticsInstance.exportEvents.mockClear().mockReturnValue(mockJson);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();
    expect(logSpy).toHaveBeenCalledWith(mockJson);
    logSpy.mockRestore();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('is a named export function from demo-usage.ts', () => {
    expect(typeof demonstrateServices).toBe('function');
  });
});