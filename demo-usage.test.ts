import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Captured call records shared across mock instances
const trackedEventCalls: unknown[][] = [];
const sentNotificationCalls: unknown[][] = [];

// Mock the shared-services module so we can inspect calls without relying on built dist
vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  };

  function AnalyticsService(this: any) {
    this.track = vi.fn((...args: unknown[]) => {
      trackedEventCalls.push(args);
    });
    this.getEvents = vi.fn(() => []);
    this.exportEvents = vi.fn(() => '[]');
    this.clearEvents = vi.fn();
  }

  function NotificationService(this: any) {
    const stored: Array<{ type: string; title: string; message: string }> = [];
    this.send = vi.fn((type: string, title: string, message: string) => {
      sentNotificationCalls.push([type, title, message]);
      stored.push({ type, title, message });
      return 'mock-id-' + stored.length;
    });
    this.getAll = vi.fn(() =>
      stored.map((n, i) => ({
        id: 'mock-id-' + i,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: new Date(),
        read: false,
      }))
    );
    this.getUnread = vi.fn(() => []);
    this.markAsRead = vi.fn(() => true);
    this.clear = vi.fn(() => stored.splice(0));
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

import { demonstrateServices } from './demo-usage';
import { NotificationType } from '@coderabbit-test/shared-services';

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    trackedEventCalls.length = 0;
    sentNotificationCalls.length = 0;
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should call console.log with header banner', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('=== Demonstrating Internal Package Services ===\n');
  });

  it('should track exactly two analytics events', () => {
    demonstrateServices();
    expect(trackedEventCalls).toHaveLength(2);
  });

  it('should track a user_login event first', () => {
    demonstrateServices();
    const [firstEvent] = trackedEventCalls[0] as [any];
    expect(firstEvent.eventName).toBe('user_login');
    expect(firstEvent.userId).toBe('user123');
    expect(firstEvent.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
    expect(firstEvent.timestamp).toBeInstanceOf(Date);
  });

  it('should track a page_view event second', () => {
    demonstrateServices();
    const [secondEvent] = trackedEventCalls[1] as [any];
    expect(secondEvent.eventName).toBe('page_view');
    expect(secondEvent.userId).toBe('user123');
    expect(secondEvent.properties).toMatchObject({ page: '/dashboard', referrer: '/login' });
    expect(secondEvent.timestamp).toBeInstanceOf(Date);
  });

  it('should send exactly two notifications', () => {
    demonstrateServices();
    expect(sentNotificationCalls).toHaveLength(2);
  });

  it('should send a SUCCESS notification with correct title and message', () => {
    demonstrateServices();
    const [type, title, message] = sentNotificationCalls[0] as [string, string, string];
    expect(type).toBe(NotificationType.SUCCESS);
    expect(title).toBe('Welcome!');
    expect(message).toBe('You have successfully logged in.');
  });

  it('should send an INFO notification with correct title and message', () => {
    demonstrateServices();
    const [type, title, message] = sentNotificationCalls[1] as [string, string, string];
    expect(type).toBe(NotificationType.INFO);
    expect(title).toBe('New Feature');
    expect(message).toBe('Check out our new analytics dashboard!');
  });

  it('should log the analytics events section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('should log the notifications section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('should log the completion section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
  });

  it('should log completion message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('Internal package successfully referenced and used!');
  });

  it('should use SUCCESS type value "success"', () => {
    expect(NotificationType.SUCCESS).toBe('success');
  });

  it('should use INFO type value "info"', () => {
    expect(NotificationType.INFO).toBe('info');
  });

  it('should use WARNING type value "warning"', () => {
    expect(NotificationType.WARNING).toBe('warning');
  });

  it('should use ERROR type value "error"', () => {
    expect(NotificationType.ERROR).toBe('error');
  });

  it('should produce console output for each notification (format check)', () => {
    demonstrateServices();
    // The function logs `[TYPE] Title: Message` for each notification
    expect(consoleSpy).toHaveBeenCalledWith(
      `[${NotificationType.SUCCESS.toUpperCase()}] Welcome!: You have successfully logged in.`
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `[${NotificationType.INFO.toUpperCase()}] New Feature: Check out our new analytics dashboard!`
    );
  });

  it('both analytics events use the same userId "user123"', () => {
    demonstrateServices();
    const [ev1] = trackedEventCalls[0] as [any];
    const [ev2] = trackedEventCalls[1] as [any];
    expect(ev1.userId).toBe('user123');
    expect(ev2.userId).toBe('user123');
  });

  it('both analytics events have a timestamp that is a Date', () => {
    demonstrateServices();
    const [ev1] = trackedEventCalls[0] as [any];
    const [ev2] = trackedEventCalls[1] as [any];
    expect(ev1.timestamp).toBeInstanceOf(Date);
    expect(ev2.timestamp).toBeInstanceOf(Date);
  });
});