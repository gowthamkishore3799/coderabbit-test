import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Tests for demo-usage.ts – demonstrateServices()
//
// We test observable side-effects of the function:
//   - console.log calls it makes
//   - the underlying AnalyticsService and NotificationService behaviour it
//     exercises (via spying on the module instances)
// ---------------------------------------------------------------------------

// The shared-services module must be importable. Because package resolution
// uses the workspace link ("file:./packages/shared-services"), we import from
// the source directly in this test so it runs without a compiled dist/.
vi.mock('@coderabbit-test/shared-services', async () => {
  // Re-export from the actual TypeScript source so we can spy on class methods
  const actual = await import('./packages/shared-services/src/index');
  return actual;
});

import { demonstrateServices } from './demo-usage';
import { AnalyticsService, NotificationService, NotificationType } from '@coderabbit-test/shared-services';

describe('demonstrateServices()', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs without throwing', () => {
    expect(() => demonstrateServices()).not.toThrow();
  });

  it('prints the header banner', () => {
    demonstrateServices();

    expect(consoleSpy).toHaveBeenCalledWith(
      '=== Demonstrating Internal Package Services ===\n'
    );
  });

  it('prints the analytics events section header', () => {
    demonstrateServices();

    expect(consoleSpy).toHaveBeenCalledWith('\n=== Analytics Events ===');
  });

  it('prints the notifications section header', () => {
    demonstrateServices();

    expect(consoleSpy).toHaveBeenCalledWith('\n=== Notifications ===');
  });

  it('prints the completion message', () => {
    demonstrateServices();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Internal package successfully referenced and used!'
    );
  });

  it('logs at least 5 times (banner + 2 section headers + completion + service recognition)', () => {
    demonstrateServices();

    // Banner + analytics header + exportEvents output + notifications header +
    // at least one notification line + recognition header + recognition message
    expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Integration: verify the function actually tracks 2 analytics events and
// sends 2 notifications by observing the module-level service instances.
// Because demo-usage.ts creates its own module-level instances, we verify
// behaviour using a fresh run via a re-import with mocked constructors.
// ---------------------------------------------------------------------------
describe('demonstrateServices() – service interaction', () => {
  it('tracks two analytics events per invocation', async () => {
    const trackedEvents: string[] = [];

    vi.doMock('@coderabbit-test/shared-services', () => ({
      AnalyticsService: class {
        track(event: { eventName: string }) { trackedEvents.push(event.eventName); }
        exportEvents() { return '[]'; }
      },
      NotificationService: class {
        send() { return 'id'; }
        getAll() { return []; }
      },
      NotificationType: { SUCCESS: 'success', INFO: 'info' },
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Re-import the module under test so it picks up the mock
    const { demonstrateServices: demo } = await import('./demo-usage?fresh=' + Date.now());
    demo();

    expect(trackedEvents).toContain('user_login');
    expect(trackedEvents).toContain('page_view');
    expect(trackedEvents).toHaveLength(2);

    vi.doUnmock('@coderabbit-test/shared-services');
    vi.restoreAllMocks();
  });

  it('sends two notifications per invocation', async () => {
    const sentNotifications: Array<{ type: string; title: string }> = [];

    vi.doMock('@coderabbit-test/shared-services', () => ({
      AnalyticsService: class {
        track() {}
        exportEvents() { return '[]'; }
      },
      NotificationService: class {
        send(type: string, title: string) {
          sentNotifications.push({ type, title });
          return 'id';
        }
        getAll() { return []; }
      },
      NotificationType: { SUCCESS: 'success', INFO: 'info' },
    }));

    vi.spyOn(console, 'log').mockImplementation(() => {});

    const { demonstrateServices: demo } = await import('./demo-usage?fresh2=' + Date.now());
    demo();

    expect(sentNotifications).toHaveLength(2);
    expect(sentNotifications[0].title).toBe('Welcome!');
    expect(sentNotifications[1].title).toBe('New Feature');

    vi.doUnmock('@coderabbit-test/shared-services');
    vi.restoreAllMocks();
  });
});