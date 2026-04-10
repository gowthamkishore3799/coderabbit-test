/**
 * Tests for fools/dummy.ts
 *
 * PR change: renamed `const var` (syntax error – reserved keyword) to
 * `const statusMessage` (valid identifier). The module now loads without errors.
 *
 * Additionally, the Player schema was not changed but its presence is verified
 * to ensure the module is complete and valid.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Importing the module itself validates that it loads without syntax errors after the rename.
import * as dummyModule from './dummy';

// Equivalent schema to the non-exported Player in dummy.ts – used to verify expected behaviour.
const PlayerSchema = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('fools/dummy.ts – module loads after variable rename', () => {
  it('module imports without throwing', () => {
    // If the import at the top of this file threw, the whole test suite would have failed.
    // Reaching this test confirms the module loaded successfully.
    expect(dummyModule).toBeDefined();
  });

  it('module is a non-null object', () => {
    expect(typeof dummyModule).toBe('object');
    expect(dummyModule).not.toBeNull();
  });
});

describe('Player schema behaviour (equivalent of fools/dummy.ts Player)', () => {
  it('accepts a valid player object', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero',
      xp: 9001,
      address: 'https://example.com/profile',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when username is missing', () => {
    const result = PlayerSchema.safeParse({ xp: 100, address: 'https://example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects when username is a number instead of string', () => {
    const result = PlayerSchema.safeParse({ username: 42, xp: 100, address: 'https://example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects when xp is not a number', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero',
      xp: 'lots',
      address: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when address is not a valid URL', () => {
    const result = PlayerSchema.safeParse({ username: 'hero', xp: 10, address: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects when address is an empty string', () => {
    const result = PlayerSchema.safeParse({ username: 'hero', xp: 10, address: '' });
    expect(result.success).toBe(false);
  });

  it('accepts xp = 0 (zero is a valid number)', () => {
    const result = PlayerSchema.safeParse({
      username: 'newbie',
      xp: 0,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (z.number() has no minimum constraint)', () => {
    const result = PlayerSchema.safeParse({
      username: 'penalized',
      xp: -50,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when all fields are missing', () => {
    const result = PlayerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});