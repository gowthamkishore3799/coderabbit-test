/**
 * Tests for demo-usage.ts
 *
 * demonstrateServices() tracks analytics events and sends notifications using
 * module-level AnalyticsService and NotificationService instances.
 *
 * Note: AnalyticsEventSchema uses z.record(z.any()) internally which has a known
 * incompatibility in Zod v4.3.x when records are non-empty. The service layer
 * is therefore mocked here to test the orchestration logic of demonstrateServices()
 * in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available before vi.mock runs (vi.mock is hoisted).
const { mockTrack, mockExportEvents, mockSend, mockGetAll } = vi.hoisted(() => {
  const mockTrack = vi.fn();
  const mockExportEvents = vi.fn();
  const mockSend = vi.fn().mockReturnValue('mock-notif-id');
  const mockGetAll = vi.fn();
  return { mockTrack, mockExportEvents, mockSend, mockGetAll };
});

vi.mock('@coderabbit-test/shared-services', () => {
  function AnalyticsService(this: Record<string, unknown>) {
    this.track = mockTrack;
    this.exportEvents = mockExportEvents;
    this.getEvents = vi.fn().mockReturnValue([]);
  }
  function NotificationService(this: Record<string, unknown>) {
    this.send = mockSend;
    this.getAll = mockGetAll;
  }
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

import { demonstrateServices } from './demo-usage';

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

const defaultExportedEvents = JSON.stringify([
  { eventName: 'user_login', userId: 'user123' },
  { eventName: 'page_view', userId: 'user123' },
]);

const defaultNotifications = [
  { id: '1', type: 'success', title: 'Welcome!', message: 'You have successfully logged in.', read: false, timestamp: new Date() },
  { id: '2', type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!', read: false, timestamp: new Date() },
];

describe('demonstrateServices()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue(defaultExportedEvents);
    mockGetAll.mockReturnValue(defaultNotifications);
    mockSend.mockReturnValue('mock-notif-id');
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('logs the introductory banner', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs the analytics section header', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('Analytics Events'))).toBe(true);
  });

  it('logs the notifications section header', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('Notifications'))).toBe(true);
  });

  it('logs the completion message', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('Service Recognition Test Complete'))).toBe(true);
  });

  it('logs "Internal package successfully referenced and used!"', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('Internal package successfully referenced and used!'))).toBe(true);
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks a user_login event with correct userId', () => {
    demonstrateServices();
    const loginCall = mockTrack.mock.calls.find(([e]) => e.eventName === 'user_login');
    expect(loginCall).toBeDefined();
    expect(loginCall![0].userId).toBe('user123');
  });

  it('tracks a user_login event with browser and version properties', () => {
    demonstrateServices();
    const loginCall = mockTrack.mock.calls.find(([e]) => e.eventName === 'user_login');
    expect(loginCall![0].properties?.browser).toBe('Chrome');
    expect(loginCall![0].properties?.version).toBe('120.0.0');
  });

  it('tracks a page_view event with page and referrer properties', () => {
    demonstrateServices();
    const pageViewCall = mockTrack.mock.calls.find(([e]) => e.eventName === 'page_view');
    expect(pageViewCall).toBeDefined();
    expect(pageViewCall![0].properties?.page).toBe('/dashboard');
    expect(pageViewCall![0].properties?.referrer).toBe('/login');
  });

  it('each tracked event has a Date timestamp', () => {
    demonstrateServices();
    mockTrack.mock.calls.forEach(([event]) => {
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  it('calls notifications.send exactly twice', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification with title "Welcome!"', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO notification with title "New Feature"', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('calls analytics.exportEvents() to display events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls notifications.getAll() to display notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs each notification in [TYPE] TITLE: MESSAGE format', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('[SUCCESS]') && c.includes('Welcome!'))).toBe(true);
    expect(calls.some(c => c.includes('[INFO]') && c.includes('New Feature'))).toBe(true);
  });

  it('logs the exported analytics JSON string to console', () => {
    const exportedJson = '[{"eventName":"user_login"}]';
    mockExportEvents.mockReturnValue(exportedJson);
    demonstrateServices();
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some(c => c.includes('user_login'))).toBe(true);
  });

  it('returns void (no explicit return value)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });
});