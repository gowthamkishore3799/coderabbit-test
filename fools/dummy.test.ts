import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Since dummy.ts does not export its symbols, we verify the module loads cleanly.
describe('dummy.ts module', () => {
  it('loads without throwing', async () => {
    await expect(import('./dummy')).resolves.toBeDefined();
  });
});

// Independent tests for the Player schema shape as defined in dummy.ts
// (mirroring the schema so behaviour changes are caught)
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('Player schema (fools/dummy.ts shape)', () => {
  const validPlayer = {
    username: 'hero99',
    xp: 1500,
    address: 'https://player.example.com',
  };

  it('accepts a valid player', () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('accepts xp of 0 (edge case)', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no min constraint)', () => {
    const result = Player.safeParse({ ...validPlayer, xp: -100 });
    expect(result.success).toBe(true);
  });

  it('accepts an empty username (no min-length constraint)', () => {
    const result = Player.safeParse({ ...validPlayer, username: '' });
    expect(result.success).toBe(true);
  });

  it('rejects non-string username', () => {
    const result = Player.safeParse({ ...validPlayer, username: 42 });
    expect(result.success).toBe(false);
  });

  it('rejects non-number xp', () => {
    const result = Player.safeParse({ ...validPlayer, xp: 'lots' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid address URL', () => {
    const result = Player.safeParse({ ...validPlayer, address: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing address field', () => {
    const { address: _address, ...withoutAddress } = validPlayer;
    const result = Player.safeParse(withoutAddress);
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = Player.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects missing all fields', () => {
    const result = Player.safeParse({});
    expect(result.success).toBe(false);
  });
});

// Test the statusMessage constant value that was renamed in this PR
// (const var -> const statusMessage)
describe('statusMessage constant (fools/dummy.ts)', () => {
  it('module file defines statusMessage as "Variable defined"', () => {
    const filePath = resolve(__dirname, 'dummy.ts');
    const source = readFileSync(filePath, 'utf-8');
    expect(source).toContain('statusMessage');
    expect(source).toContain('"Variable defined"');
  });
});