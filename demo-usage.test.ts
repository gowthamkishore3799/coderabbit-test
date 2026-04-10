/**
 * Tests for demo-usage.ts
 *
 * This file mocks @coderabbit-test/shared-services to test the
 * demonstrateServices() function in isolation.
 *
 * NOTE: AnalyticsService.track() throws when events include a `properties`
 * field because z.record(z.any()) is incompatible in Zod 4.1.5. The mock
 * bypasses this so we can verify the demonstrateServices() control flow.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const trackMock = vi.fn();
const sendMock = vi.fn().mockReturnValue('mock-id');
const exportMock = vi.fn().mockReturnValue('[]');
const getAllMock = vi.fn().mockReturnValue([
  { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
  { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
]);

vi.mock('@coderabbit-test/shared-services', () => {
  class MockAnalyticsService {
    track = trackMock;
    exportEvents = exportMock;
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

describe('demonstrateServices (demo-usage.ts)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    trackMock.mockClear();
    sendMock.mockClear();
    exportMock.mockClear();
    getAllMock.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should run without throwing', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('should log the opening header', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('=== Demonstrating Internal Package Services ===\n');
  });

  it('should log the analytics events section header', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('should log the notifications section header', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('should log the completion messages', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
    expect(consoleSpy).toHaveBeenCalledWith('Internal package successfully referenced and used!');
  });

  it('should call analytics.track exactly twice', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(trackMock).toHaveBeenCalledTimes(2);
  });

  it('should track "user_login" as the first event', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(trackMock.mock.calls[0][0].eventName).toBe('user_login');
  });

  it('should track "page_view" as the second event', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(trackMock.mock.calls[1][0].eventName).toBe('page_view');
  });

  it('should include userId in tracked events', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(trackMock.mock.calls[0][0].userId).toBe('user123');
    expect(trackMock.mock.calls[1][0].userId).toBe('user123');
  });

  it('should send exactly two notifications', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('should send a SUCCESS notification with "Welcome!" title', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(sendMock).toHaveBeenCalledWith('success', 'Welcome!', 'You have successfully logged in.');
  });

  it('should send an INFO notification about a new feature', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(sendMock).toHaveBeenCalledWith('info', 'New Feature', 'Check out our new analytics dashboard!');
  });

  it('should call exportEvents and log the result', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(exportMock).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('[]');
  });

  it('should call getAll and print each notification', async () => {
    const { demonstrateServices } = await import('./demo-usage');
    demonstrateServices();
    expect(getAllMock).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('[SUCCESS] Welcome!: You have successfully logged in.');
    expect(consoleSpy).toHaveBeenCalledWith('[INFO] New Feature: Check out our new analytics dashboard!');
  });
});