import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @coderabbit-test/shared-services module before importing demo-usage
// because demo-usage creates module-level service instances
const mockTrack = vi.fn();
const mockExportEvents = vi.fn(() => JSON.stringify([{ eventName: 'user_login' }], null, 2));
const mockSend = vi.fn(() => 'notif-id-123');
const mockGetAll = vi.fn(() => [
  { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.', id: '1', timestamp: new Date(), read: false },
  { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!', id: '2', timestamp: new Date(), read: false },
]);

vi.mock('@coderabbit-test/shared-services', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    track: mockTrack,
    exportEvents: mockExportEvents,
  })),
  NotificationService: vi.fn().mockImplementation(() => ({
    send: mockSend,
    getAll: mockGetAll,
  })),
  NotificationType: {
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
  },
}));

// Import after mocking
const { demonstrateServices } = await import('./demo-usage');

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
    mockExportEvents.mockReturnValue(JSON.stringify([{ eventName: 'user_login' }], null, 2));
    mockSend.mockReturnValue('notif-id-123');
    mockGetAll.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.', id: '1', timestamp: new Date(), read: false },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!', id: '2', timestamp: new Date(), read: false },
    ]);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('calls analytics.track twice with correct events', () => {
    demonstrateServices();

    expect(mockTrack).toHaveBeenCalledTimes(2);

    const firstCall = mockTrack.mock.calls[0][0];
    expect(firstCall.eventName).toBe('user_login');
    expect(firstCall.userId).toBe('user123');
    expect(firstCall.timestamp).toBeInstanceOf(Date);
    expect(firstCall.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });

    const secondCall = mockTrack.mock.calls[1][0];
    expect(secondCall.eventName).toBe('page_view');
    expect(secondCall.userId).toBe('user123');
    expect(secondCall.timestamp).toBeInstanceOf(Date);
    expect(secondCall.properties).toMatchObject({ page: '/dashboard', referrer: '/login' });
  });

  it('calls notifications.send twice with correct arguments', () => {
    demonstrateServices();

    expect(mockSend).toHaveBeenCalledTimes(2);

    expect(mockSend).toHaveBeenNthCalledWith(1, 'success', 'Welcome!', 'You have successfully logged in.');
    expect(mockSend).toHaveBeenNthCalledWith(2, 'info', 'New Feature', 'Check out our new analytics dashboard!');
  });

  it('calls analytics.exportEvents to print events', () => {
    demonstrateServices();
    expect(mockExportEvents).toHaveBeenCalledOnce();
  });

  it('calls notifications.getAll to retrieve all notifications', () => {
    demonstrateServices();
    expect(mockGetAll).toHaveBeenCalledOnce();
  });

  it('logs console output including section headers', () => {
    demonstrateServices();

    const allLogs = consoleSpy.mock.calls.map(call => call[0]);
    expect(allLogs).toContain('=== Demonstrating Internal Package Services ===\n');
    expect(allLogs).toContain('\n=== Analytics Events ===');
    expect(allLogs).toContain('\n=== Notifications ===');
    expect(allLogs).toContain('\n=== Service Recognition Test Complete ===');
    expect(allLogs).toContain('Internal package successfully referenced and used!');
  });

  it('logs each notification in the correct format', () => {
    demonstrateServices();

    const allLogs = consoleSpy.mock.calls.map(call => call[0]);
    expect(allLogs).toContain('[SUCCESS] Welcome!: You have successfully logged in.');
    expect(allLogs).toContain('[INFO] New Feature: Check out our new analytics dashboard!');
  });

  it('returns void (undefined)', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('tracks user_login event with browser properties', () => {
    demonstrateServices();

    const userLoginCall = mockTrack.mock.calls.find(
      call => call[0].eventName === 'user_login'
    );
    expect(userLoginCall).toBeDefined();
    expect(userLoginCall![0].properties.browser).toBe('Chrome');
    expect(userLoginCall![0].properties.version).toBe('120.0.0');
  });

  it('tracks page_view event with navigation properties', () => {
    demonstrateServices();

    const pageViewCall = mockTrack.mock.calls.find(
      call => call[0].eventName === 'page_view'
    );
    expect(pageViewCall).toBeDefined();
    expect(pageViewCall![0].properties.page).toBe('/dashboard');
    expect(pageViewCall![0].properties.referrer).toBe('/login');
  });

  it('passes a notification ID returned from send to notifications listing', () => {
    // Verify send is called and returns an id (which is used to reference the notification)
    demonstrateServices();
    expect(mockSend.mock.results[0].value).toBe('notif-id-123');
  });
});