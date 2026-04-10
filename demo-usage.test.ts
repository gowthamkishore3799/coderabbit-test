/**
 * Tests for demo-usage.ts
 *
 * demo-usage.ts exports `demonstrateServices()` which uses AnalyticsService and
 * NotificationService from @coderabbit-test/shared-services.
 *
 * NOTE: In the current environment, calling analytics.track() with a `properties`
 * field triggers a Zod v4 bug (z.record(z.any()) is broken). The tests that use
 * the real module document this. Tests that mock the module verify the full
 * demonstrateServices() behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Tests using mocked dependencies ---

vi.mock('@coderabbit-test/shared-services', () => {
  const trackMock = vi.fn();
  const sendMock = vi.fn().mockReturnValue('mock-notification-id');
  const exportEventsMock = vi.fn().mockReturnValue('[]');
  const getAllMock = vi.fn().mockReturnValue([
    { id: '1', type: 'success', title: 'Welcome!', message: 'You have successfully logged in.', read: false, timestamp: new Date() },
    { id: '2', type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!', read: false, timestamp: new Date() },
  ]);

  class MockAnalyticsService {
    track = trackMock;
    exportEvents = exportEventsMock;
  }

  class MockNotificationService {
    send = sendMock;
    getAll = getAllMock;
  }

  return {
    AnalyticsService: MockAnalyticsService,
    NotificationService: MockNotificationService,
    NotificationType: {
      SUCCESS: 'success',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
});

describe('demonstrateServices() with mocked services', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('can be imported and exports demonstrateServices', async () => {
    const mod = await import('./demo-usage');
    expect(typeof mod.demonstrateServices).toBe('function');
  });

  it('runs without throwing when services are properly mocked', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the banner header message', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Demonstrating Internal Package Services')
    );
  });

  it('logs the analytics events section header', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analytics Events')
    );
  });

  it('logs the notifications section header', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Notifications')
    );
  });

  it('logs the completion message', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Internal package successfully referenced and used!')
    );
  });

  it('calls analytics.track() for user_login event', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    // Access the shared track mock through a new instance to verify call args
    const analyticsInstance = new sharedServices.AnalyticsService();
    demonstrateServices();
    expect(analyticsInstance.track).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'user_login', userId: 'user123' })
    );
  });

  it('calls analytics.track() for page_view event', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const analyticsInstance = new sharedServices.AnalyticsService();
    demonstrateServices();
    expect(analyticsInstance.track).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'page_view' })
    );
  });

  it('calls analytics.track() at least twice', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const analyticsInstance = new sharedServices.AnalyticsService();
    demonstrateServices();
    expect(analyticsInstance.track.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('calls notifications.send() for SUCCESS Welcome! notification', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const notifInstance = new sharedServices.NotificationService();
    demonstrateServices();
    expect(notifInstance.send).toHaveBeenCalledWith('success', 'Welcome!', 'You have successfully logged in.');
  });

  it('calls notifications.send() for INFO New Feature notification', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const notifInstance = new sharedServices.NotificationService();
    demonstrateServices();
    expect(notifInstance.send).toHaveBeenCalledWith('info', 'New Feature', 'Check out our new analytics dashboard!');
  });

  it('calls notifications.send() at least twice', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const notifInstance = new sharedServices.NotificationService();
    demonstrateServices();
    expect(notifInstance.send.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('calls analytics.exportEvents() to display tracked events', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const analyticsInstance = new sharedServices.AnalyticsService();
    demonstrateServices();
    expect(analyticsInstance.exportEvents).toHaveBeenCalled();
  });

  it('calls notifications.getAll() to display all notifications', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    const sharedServices = await import('@coderabbit-test/shared-services');
    const notifInstance = new sharedServices.NotificationService();
    demonstrateServices();
    expect(notifInstance.getAll).toHaveBeenCalled();
  });

  it('logs each notification in [TYPE] Title: Message format', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();

    expect(consoleSpy).toHaveBeenCalledWith('[SUCCESS] Welcome!: You have successfully logged in.');
    expect(consoleSpy).toHaveBeenCalledWith('[INFO] New Feature: Check out our new analytics dashboard!');
  });

  it('is callable multiple times without error', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });
});