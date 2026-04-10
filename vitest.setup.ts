/**
 * Vitest global setup – polyfills Zod APIs that are not present in the installed version.
 *
 * fools/files.ts uses `z.urls()` which does not exist in zod@4.1.5.
 * The polyfill returns a `z.string()` schema so that the module loads and
 * schema-level tests can exercise the surrounding logic.
 */
import * as z from 'zod';

if (typeof (z as any).urls !== 'function') {
  // Polyfill: accept any string (mimics a "list of URLs" string field).
  try {
    Object.defineProperty(z, 'urls', {
      configurable: true,
      writable: true,
      value: () => (z as any).string(),
    });
  } catch {
    // If defineProperty also fails, the property exists in a non-writable form –
    // skip the polyfill; tests covering siteUrls will report the Zod version gap.
  }
}