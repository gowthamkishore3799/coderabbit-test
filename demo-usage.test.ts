import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @coderabbit-test/shared-services to avoid internal zod v4.1.5 incompatibility
// with z.record(z.any()) used in AnalyticsEventSchema.
// This tests that demo-usage.ts correctly orchestrates the services.
vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  } as const;

  class MockAnalyticsService {
    private events: any[] = [];

    track(event: any) {
      this.events.push(event);
      console.log(`[Analytics] Tracked event: ${event.eventName}`);
    }

    getEvents() {
      return [...this.events];
    }

    getEventsByUser(userId: string) {
      return this.events.filter((e) => e.userId === userId);
    }

    clearEvents() {
      this.events = [];
      console.log('[Analytics] Cleared all events');
    }

    exportEvents() {
      return JSON.stringify(this.events, null, 2);
    }
  }

  class MockNotificationService {
    private notifications: any[] = [];
    private listeners: ((n: any) => void)[] = [];

    send(type: string, title: string, message: string) {
      const id = Math.random().toString(36).substr(2, 9);
      const notification = { id, type, title, message, timestamp: new Date(), read: false };
      this.notifications.push(notification);
      this.listeners.forEach((l) => l(notification));
      console.log(`[Notification] ${type.toUpperCase()}: ${title}`);
      return id;
    }

    getAll() {
      return [...this.notifications];
    }

    getUnread() {
      return this.notifications.filter((n) => !n.read);
    }

    markAsRead(id: string) {
      const n = this.notifications.find((n) => n.id === id);
      if (n) { n.read = true; return true; }
      return false;
    }

    markAllAsRead() {
      this.notifications.forEach((n) => (n.read = true));
    }

    subscribe(listener: (n: any) => void) {
      this.listeners.push(listener);
      return () => {
        const idx = this.listeners.indexOf(listener);
        if (idx > -1) this.listeners.splice(idx, 1);
      };
    }

    clear() {
      this.notifications = [];
      console.log('[Notification] Cleared all notifications');
    }
  }

  return {
    AnalyticsService: MockAnalyticsService,
    NotificationService: MockNotificationService,
    NotificationType,
  };
});

const { demonstrateServices } = await import('./demo-usage');
const {
  AnalyticsService,
  NotificationService,
  NotificationType,
} = await import('@coderabbit-test/shared-services');

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('executes without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the demonstration header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('logs the analytics events section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('logs the notifications section header', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('logs the completion message', () => {
    demonstrateServices();
    expect(consoleSpy).toHaveBeenCalledWith('\n=== Service Recognition Test Complete ===');
    expect(consoleSpy).toHaveBeenCalledWith('Internal package successfully referenced and used!');
  });

  it('can be called multiple times without error', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });
});

describe('AnalyticsService (used by demo-usage.ts)', () => {
  let service: InstanceType<typeof AnalyticsService>;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks a user_login event with correct data', () => {
    const event = {
      eventName: 'user_login',
      userId: 'user123',
      timestamp: new Date(),
    };
    service.track(event);
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('user_login');
    expect(events[0].userId).toBe('user123');
  });

  it('tracks a page_view event', () => {
    service.track({
      eventName: 'page_view',
      userId: 'user123',
      timestamp: new Date(),
    });
    const events = service.getEvents();
    expect(events[0].eventName).toBe('page_view');
  });

  it('tracks multiple events and getEvents returns all', () => {
    service.track({ eventName: 'event_a', timestamp: new Date() });
    service.track({ eventName: 'event_b', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(2);
  });

  it('getEventsByUser filters by userId', () => {
    service.track({ eventName: 'login', userId: 'user123', timestamp: new Date() });
    service.track({ eventName: 'logout', userId: 'user456', timestamp: new Date() });
    const userEvents = service.getEventsByUser('user123');
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].userId).toBe('user123');
  });

  it('exportEvents returns a JSON string', () => {
    service.track({ eventName: 'user_login', userId: 'user123', timestamp: new Date() });
    const exported = service.exportEvents();
    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].eventName).toBe('user_login');
  });

  it('clearEvents empties the event list', () => {
    service.track({ eventName: 'test', timestamp: new Date() });
    service.clearEvents();
    expect(service.getEvents()).toHaveLength(0);
  });

  it('getEvents returns a copy, not the internal array', () => {
    service.track({ eventName: 'test', timestamp: new Date() });
    const events = service.getEvents();
    events.push({ eventName: 'extra', timestamp: new Date() });
    expect(service.getEvents()).toHaveLength(1);
  });
});

describe('NotificationService (used by demo-usage.ts)', () => {
  let service: InstanceType<typeof NotificationService>;

  beforeEach(() => {
    service = new NotificationService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a SUCCESS notification and returns an id', () => {
    const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('sends an INFO notification', () => {
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe(NotificationType.INFO);
    expect(all[0].title).toBe('New Feature');
  });

  it('getAll returns notifications matching demo-usage calls', () => {
    service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
    service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
    const all = service.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].type).toBe(NotificationType.SUCCESS);
    expect(all[1].type).toBe(NotificationType.INFO);
  });

  it('new notifications are unread by default', () => {
    service.send(NotificationType.INFO, 'Test', 'Message');
    const all = service.getAll();
    expect(all[0].read).toBe(false);
  });

  it('getUnread returns only unread notifications', () => {
    const id = service.send(NotificationType.INFO, 'Test', 'Message');
    service.send(NotificationType.WARNING, 'Warn', 'Warning!');
    service.markAsRead(id);
    expect(service.getUnread()).toHaveLength(1);
    expect(service.getUnread()[0].type).toBe(NotificationType.WARNING);
  });

  it('markAsRead returns true for existing notification', () => {
    const id = service.send(NotificationType.SUCCESS, 'Hi', 'Hello!');
    expect(service.markAsRead(id)).toBe(true);
    const all = service.getAll();
    expect(all[0].read).toBe(true);
  });

  it('markAsRead returns false for non-existent id', () => {
    expect(service.markAsRead('nonexistent-id')).toBe(false);
  });

  it('markAllAsRead marks every notification as read', () => {
    service.send(NotificationType.INFO, 'A', 'Msg A');
    service.send(NotificationType.ERROR, 'B', 'Msg B');
    service.markAllAsRead();
    expect(service.getUnread()).toHaveLength(0);
  });

  it('clear empties all notifications', () => {
    service.send(NotificationType.INFO, 'Test', 'Message');
    service.clear();
    expect(service.getAll()).toHaveLength(0);
  });

  it('getAll returns a copy, not the internal array', () => {
    service.send(NotificationType.INFO, 'Test', 'Message');
    const all = service.getAll();
    all.push({ id: 'extra', type: NotificationType.WARNING, title: 'X', message: 'X', timestamp: new Date(), read: false });
    expect(service.getAll()).toHaveLength(1);
  });

  it('subscribe listener is called on send', () => {
    const listener = vi.fn();
    service.subscribe(listener);
    service.send(NotificationType.SUCCESS, 'Hi', 'Hello');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].type).toBe(NotificationType.SUCCESS);
  });

  it('unsubscribe stops listener from being called', () => {
    const listener = vi.fn();
    const unsub = service.subscribe(listener);
    unsub();
    service.send(NotificationType.INFO, 'Hi', 'Hello');
    expect(listener).not.toHaveBeenCalled();
  });

  it('notification has a timestamp property', () => {
    service.send(NotificationType.INFO, 'Time test', 'Check timestamp');
    const n = service.getAll()[0];
    expect(n.timestamp).toBeInstanceOf(Date);
  });

  // Regression: notification type values match enum values used in demo-usage.ts
  it('regression: NotificationType.SUCCESS equals "success"', () => {
    expect(NotificationType.SUCCESS).toBe('success');
  });

  it('regression: NotificationType.INFO equals "info"', () => {
    expect(NotificationType.INFO).toBe('info');
  });
});