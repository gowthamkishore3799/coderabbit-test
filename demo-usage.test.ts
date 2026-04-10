// Mocks must be defined before any imports that use the mocked modules.
// We reference jest.fn() instances defined in outer scope so they can be
// reset and inspected in each test.
const mockTrack = jest.fn();
const mockExportEvents = jest.fn().mockReturnValue('[]');
const mockSend = jest.fn().mockReturnValue('mock-notification-id');
const mockGetAll = jest.fn().mockReturnValue([]);

jest.mock('@coderabbit-test/shared-services', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    track: mockTrack,
    exportEvents: mockExportEvents,
  })),
  NotificationService: jest.fn().mockImplementation(() => ({
    send: mockSend,
    getAll: mockGetAll,
  })),
  NotificationType: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  },
}));

// Import the subject under test after mock registration
import { demonstrateServices } from './demo-usage';

describe('demonstrateServices()', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockGetAll.mockReturnValue([]);
    mockExportEvents.mockReturnValue('[]');
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  it('tracks a user_login event with the expected payload', () => {
    demonstrateServices();

    const loginCall = (mockTrack.mock.calls as Array<[{ eventName: string; userId?: string; timestamp: Date; properties?: Record<string, unknown> }]>).find(
      ([event]) => event.eventName === 'user_login'
    );
    expect(loginCall).toBeDefined();

    const [loginEvent] = loginCall!;
    expect(loginEvent.userId).toBe('user123');
    expect(loginEvent.timestamp).toBeInstanceOf(Date);
    expect(loginEvent.properties).toMatchObject({ browser: 'Chrome', version: '120.0.0' });
  });

  it('tracks a page_view event with the expected payload', () => {
    demonstrateServices();

    const pageViewCall = (mockTrack.mock.calls as Array<[{ eventName: string; userId?: string; properties?: Record<string, unknown> }]>).find(
      ([event]) => event.eventName === 'page_view'
    );
    expect(pageViewCall).toBeDefined();

    const [pageViewEvent] = pageViewCall!;
    expect(pageViewEvent.userId).toBe('user123');
    expect(pageViewEvent.properties).toMatchObject({ page: '/dashboard', referrer: '/login' });
  });

  it('tracks exactly two analytics events', () => {
    demonstrateServices();

    expect(mockTrack).toHaveBeenCalledTimes(2);
  });

  it('sends a SUCCESS welcome notification', () => {
    demonstrateServices();

    expect(mockSend).toHaveBeenCalledWith(
      'success',
      'Welcome!',
      'You have successfully logged in.'
    );
  });

  it('sends an INFO new-feature notification', () => {
    demonstrateServices();

    expect(mockSend).toHaveBeenCalledWith(
      'info',
      'New Feature',
      'Check out our new analytics dashboard!'
    );
  });

  it('sends exactly two notifications', () => {
    demonstrateServices();

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('calls exportEvents() to display analytics output', () => {
    demonstrateServices();

    expect(mockExportEvents).toHaveBeenCalledTimes(1);
  });

  it('calls getAll() to retrieve notifications for display', () => {
    demonstrateServices();

    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('logs each notification returned by getAll()', () => {
    mockGetAll.mockReturnValue([
      { type: 'success', title: 'Welcome!', message: 'You have successfully logged in.' },
      { type: 'info', title: 'New Feature', message: 'Check out our new analytics dashboard!' },
    ]);

    demonstrateServices();

    const loggedMessages = consoleSpy.mock.calls.map((args: unknown[]) => String(args[0]));
    expect(loggedMessages.some(m => m.includes('[SUCCESS]'))).toBe(true);
    expect(loggedMessages.some(m => m.includes('[INFO]'))).toBe(true);
  });

  it('logs header and footer banners to the console', () => {
    demonstrateServices();

    const loggedMessages = consoleSpy.mock.calls.map((args: unknown[]) => String(args[0]));
    expect(loggedMessages.some(m => m.includes('Demonstrating Internal Package Services'))).toBe(true);
    expect(loggedMessages.some(m => m.includes('Service Recognition Test Complete'))).toBe(true);
  });

  it('the SUCCESS welcome notification is sent before the INFO notification', () => {
    demonstrateServices();

    const calls = mockSend.mock.calls as Array<[string, string, string]>;
    expect(calls[0][0]).toBe('success');
    expect(calls[1][0]).toBe('info');
  });
});