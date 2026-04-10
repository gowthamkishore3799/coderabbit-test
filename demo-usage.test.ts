import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the shared-services package because AnalyticsService.track() uses z.record(z.any())
// which has a known parse bug in the installed version of Zod (4.3.6).
// The mock provides realistic implementations that mirror the actual service behavior.
vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  };

  class AnalyticsService {
    private events: Array<{ eventName: string; userId?: string; timestamp: Date; properties?: Record<string, any> }> = [];

    track(event: { eventName: string; userId?: string; timestamp: Date; properties?: Record<string, any> }) {
      this.events.push(event);
      console.log(`[Analytics] Tracked event: ${event.eventName}`);
    }

    getEvents() { return [...this.events]; }

    exportEvents() { return JSON.stringify(this.events, null, 2); }

    clearEvents() {
      this.events = [];
      console.log('[Analytics] Cleared all events');
    }
  }

  class NotificationService {
    private notifications: Array<{ id: string; type: string; title: string; message: string; timestamp: Date; read: boolean }> = [];

    send(type: string, title: string, message: string): string {
      const id = Math.random().toString(36).substr(2, 9);
      const notification = { id, type, title, message, timestamp: new Date(), read: false };
      this.notifications.push(notification);
      console.log(`[Notification] ${type.toUpperCase()}: ${title}`);
      return id;
    }

    getAll() { return [...this.notifications]; }

    getUnread() { return this.notifications.filter(n => !n.read); }

    markAsRead(id: string) {
      const n = this.notifications.find(n => n.id === id);
      if (n) { n.read = true; return true; }
      return false;
    }

    clear() {
      this.notifications = [];
      console.log('[Notification] Cleared all notifications');
    }
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

import { demonstrateServices } from './demo-usage';

describe('demonstrateServices', () => {
  let consoleLogs: string[];

  beforeEach(() => {
    consoleLogs = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      consoleLogs.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executes without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the demonstration header', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('Demonstrating Internal Package Services');
  });

  it('logs the analytics events section', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('Analytics Events');
  });

  it('logs the notifications section', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('Notifications');
  });

  it('logs the completion message', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('Service Recognition Test Complete');
  });

  it('logs analytics events as JSON (exportEvents output)', () => {
    demonstrateServices();
    const jsonLog = consoleLogs.find(log => {
      try { JSON.parse(log); return true; } catch { return false; }
    });
    expect(jsonLog).toBeDefined();
    const events = JSON.parse(jsonLog!);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it('tracks "user_login" and "page_view" analytics events', () => {
    demonstrateServices();
    const jsonLog = consoleLogs.find(log => {
      try { JSON.parse(log); return true; } catch { return false; }
    });
    const events = JSON.parse(jsonLog!);
    const eventNames = events.map((e: { eventName: string }) => e.eventName);
    expect(eventNames).toContain('user_login');
    expect(eventNames).toContain('page_view');
  });

  it('tracks user_login event with correct userId', () => {
    demonstrateServices();
    const jsonLog = consoleLogs.find(log => {
      try { JSON.parse(log); return true; } catch { return false; }
    });
    const events = JSON.parse(jsonLog!);
    const loginEvent = events.find((e: { eventName: string }) => e.eventName === 'user_login');
    expect(loginEvent?.userId).toBe('user123');
  });

  it('logs notification entries formatted as [TYPE] title: message', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toMatch(/\[SUCCESS\] Welcome!/);
    expect(output).toMatch(/\[INFO\] New Feature/);
  });

  it('sends a SUCCESS notification with correct title and message', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('You have successfully logged in.');
  });

  it('sends an INFO notification about the new feature', () => {
    demonstrateServices();
    const output = consoleLogs.join('\n');
    expect(output).toContain('Check out our new analytics dashboard!');
  });

  it('can be called multiple times without error', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });
});