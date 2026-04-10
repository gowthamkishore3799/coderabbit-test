import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { demonstrateServices } from './demo-usage';

// ---------------------------------------------------------------------------
// demonstrateServices – newly added function in this PR
// ---------------------------------------------------------------------------

describe('demonstrateServices', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('is a callable function that returns undefined', () => {
    const result = demonstrateServices();
    expect(result).toBeUndefined();
  });

  it('logs the opening banner', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Demonstrating Internal Package Services'))).toBe(true);
  });

  it('logs the Analytics Events section', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Analytics Events'))).toBe(true);
  });

  it('logs the Notifications section', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Notifications'))).toBe(true);
  });

  it('logs the completion message', () => {
    demonstrateServices();
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    expect(calls.some((msg) => msg.includes('Service Recognition Test Complete'))).toBe(true);
  });

  it('can be called multiple times without throwing', () => {
    expect(() => {
      demonstrateServices();
      demonstrateServices();
    }).not.toThrow();
  });

  it('logs notification messages with expected type labels', () => {
    demonstrateServices();
    // Notification entries are logged with the pattern "[TYPE] Title: message"
    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    const notificationLines = calls.filter((msg) => /^\[(SUCCESS|INFO|WARNING|ERROR)\]/.test(msg));
    // We send SUCCESS and INFO notifications in demonstrateServices
    expect(notificationLines.length).toBeGreaterThanOrEqual(2);
  });

  it('outputs analytics event JSON on export', () => {
    demonstrateServices();
    // exportEvents() returns a JSON string; console.log is called with it
    const calls = consoleSpy.mock.calls;
    // The JSON output for events contains our event names
    const allOutput = calls.map((c) => String(c[0])).join('\n');
    expect(allOutput).toContain('user_login');
    expect(allOutput).toContain('page_view');
  });

  it('logs "Welcome!" notification', () => {
    demonstrateServices();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(allOutput).toContain('Welcome!');
  });

  it('logs "New Feature" notification', () => {
    demonstrateServices();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(allOutput).toContain('New Feature');
  });
});