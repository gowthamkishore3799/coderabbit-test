import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted creates mock functions before vi.mock factory runs (factory is hoisted too)
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  exportEvents: vi.fn().mockReturnValue('[]'),
  getEvents: vi.fn().mockReturnValue([]),
  clearEvents: vi.fn(),
  getEventsByUser: vi.fn().mockReturnValue([]),
  send: vi.fn().mockReturnValue('mock-notification-id'),
  getAll: vi.fn().mockReturnValue([]),
  getUnread: vi.fn().mockReturnValue([]),
  markAsRead: vi.fn().mockReturnValue(true),
  markAllAsRead: vi.fn(),
  subscribe: vi.fn(),
  clear: vi.fn(),
}));

// Mock the shared-services package since dist/ hasn't been built.
// Use regular function (not arrow) in mockImplementation so `new` works as a constructor.
vi.mock('@coderabbit-test/shared-services', () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(function () {
      this.track = mocks.track;
      this.exportEvents = mocks.exportEvents;
      this.getEvents = mocks.getEvents;
      this.clearEvents = mocks.clearEvents;
      this.getEventsByUser = mocks.getEventsByUser;
    }),
    NotificationService: vi.fn().mockImplementation(function () {
      this.send = mocks.send;
      this.getAll = mocks.getAll;
      this.getUnread = mocks.getUnread;
      this.markAsRead = mocks.markAsRead;
      this.markAllAsRead = mocks.markAllAsRead;
      this.subscribe = mocks.subscribe;
      this.clear = mocks.clear;
    }),
    NotificationType: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      SUCCESS: 'success',
    },
  };
});

import { demonstrateServices } from './demo-usage';

describe('demo-usage.ts – demonstrateServices()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the demonstrateServices function', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it('tracks user_login event as the first call', () => {
    demonstrateServices();
    const firstCall = mocks.track.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
  });

  it('tracks page_view event as the second call', () => {
    demonstrateServices();
    const secondCall = mocks.track.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
  });

  it('sends a SUCCESS notification with "Welcome!" title', () => {
    demonstrateServices();
    const successCall = mocks.send.mock.calls.find(
      (call: unknown[]) => call[1] === 'Welcome!'
    );
    expect(successCall).toBeDefined();
    expect(successCall![0]).toBe('success');
    expect(String(successCall![2])).toContain('logged in');
  });

  it('sends an INFO notification with "New Feature" title', () => {
    demonstrateServices();
    const infoCall = mocks.send.mock.calls.find(
      (call: unknown[]) => call[1] === 'New Feature'
    );
    expect(infoCall).toBeDefined();
    expect(infoCall![0]).toBe('info');
    expect(String(infoCall![2])).toContain('analytics dashboard');
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it('calls analytics.exportEvents once to retrieve event data', () => {
    demonstrateServices();
    expect(mocks.exportEvents).toHaveBeenCalledOnce();
  });

  it('calls notifications.getAll once to retrieve all notifications', () => {
    demonstrateServices();
    expect(mocks.getAll).toHaveBeenCalledOnce();
  });

  it('each analytics event has a timestamp that is a Date instance', () => {
    demonstrateServices();
    for (const call of mocks.track.mock.calls) {
      expect(call[0].timestamp).toBeInstanceOf(Date);
    }
  });

  it('user_login event has browser property "Chrome"', () => {
    demonstrateServices();
    const loginEvent = mocks.track.mock.calls[0][0];
    expect(loginEvent.properties?.browser).toBe('Chrome');
  });

  it('user_login event includes version in properties', () => {
    demonstrateServices();
    const loginEvent = mocks.track.mock.calls[0][0];
    expect(loginEvent.properties?.version).toBe('120.0.0');
  });

  it('page_view event has page "/dashboard"', () => {
    demonstrateServices();
    const pageViewEvent = mocks.track.mock.calls[1][0];
    expect(pageViewEvent.properties?.page).toBe('/dashboard');
  });

  it('page_view event has referrer "/login"', () => {
    demonstrateServices();
    const pageViewEvent = mocks.track.mock.calls[1][0];
    expect(pageViewEvent.properties?.referrer).toBe('/login');
  });

  it('demonstrateServices can be called multiple times independently', () => {
    demonstrateServices();
    demonstrateServices();
    expect(mocks.track).toHaveBeenCalledTimes(4);
    expect(mocks.send).toHaveBeenCalledTimes(4);
  });
});