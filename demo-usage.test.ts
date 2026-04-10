import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to declare mocks before vi.mock factory is executed
const { mockTrack, mockExportEvents, mockGetEvents, mockSend, mockGetAll } = vi.hoisted(() => {
  return {
    mockTrack: vi.fn(),
    mockExportEvents: vi.fn().mockReturnValue('[]'),
    mockGetEvents: vi.fn().mockReturnValue([]),
    mockSend: vi.fn().mockReturnValue('mock-notification-id'),
    mockGetAll: vi.fn().mockReturnValue([]),
  };
});

// Mock the shared-services package before importing demo-usage
vi.mock('@coderabbit-test/shared-services', () => {
  const NotificationType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  };

  class AnalyticsService {
    track = mockTrack;
    exportEvents = mockExportEvents;
    getEvents = mockGetEvents;
  }

  class NotificationService {
    send = mockSend;
    getAll = mockGetAll;
  }

  return { AnalyticsService, NotificationService, NotificationType };
});

// Import after mocking
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockReturnValue([]);
    mockExportEvents.mockReturnValue('[]');
    mockSend.mockReturnValue('mock-notification-id');
  });

  it('is exported as a function', () => {
    expect(typeof demonstrateServices).toBe('function');
  });

  it('calls analytics.track exactly twice', () => {
    demonstrateServices();
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('tracks the user_login event first', () => {
    demonstrateServices();
    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
    expect(firstCall.timestamp).toBeInstanceOf(Date);
  });

  it('tracks the page_view event second', () => {
    demonstrateServices();
    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.properties).toMatchObject({ page: '/dashboard', referrer: '/login' });
    expect(secondCall.timestamp).toBeInstanceOf(Date);
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS notification for welcome message', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO notification for new feature', () => {
    demonstrateServices();
    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('calls exportEvents once to display analytics', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll to retrieve all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('iterates over all notifications and logs them', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockNotifications = [
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ];
    mockGetAll.mockReturnValue(mockNotifications);

    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map(c => c[0]);
    expect(logCalls.some(msg => typeof msg === 'string' && msg.includes('[SUCCESS]'))).toBe(true);
    expect(logCalls.some(msg => typeof msg === 'string' && msg.includes('[INFO]'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('logs the completion message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map(c => c[0]);
    expect(logCalls.some(msg => typeof msg === 'string' && msg.includes('Service Recognition Test Complete'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('logs the initial header message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    demonstrateServices();

    const logCalls = consoleSpy.mock.calls.map(c => c[0]);
    expect(logCalls.some(msg => typeof msg === 'string' && msg.includes('Demonstrating Internal Package Services'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('returns void (undefined)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('can be called multiple times without errors', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
    // Each call tracks 2 events
    expect(mockTrack).toHaveBeenCalledTimes(4);
  });
});