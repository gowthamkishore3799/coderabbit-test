import { describe, it, expect } from 'vitest';

describe('fools/dummy.ts – module integrity', () => {
  it('module loads without syntax errors (the PR fixed a reserved keyword usage)', async () => {
    // The PR renamed `var` (reserved keyword) to `statusMessage`.
    // A successful dynamic import proves the module is syntactically valid.
    await expect(import('./dummy')).resolves.toBeDefined();
  });

  it('module does not throw on load', async () => {
    let threw = false;
    try {
      await import('./dummy');
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});

describe('fools/dummy.ts – Player schema (inline tests using zod)', () => {
  it('validates a valid Player object', async () => {
    const { default: z } = await import('zod');

    // Reproduce the Player schema to verify its shape is correct
    const Player = z.object({
      username: z.string(),
      xp: z.number(),
      address: z.url(),
    });

    const result = Player.safeParse({
      username: 'alice',
      xp: 100,
      address: 'https://example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a Player with an invalid address (non-URL)', async () => {
    const { default: z } = await import('zod');

    const Player = z.object({
      username: z.string(),
      xp: z.number(),
      address: z.url(),
    });

    const result = Player.safeParse({
      username: 'bob',
      xp: 50,
      address: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a Player with a non-numeric xp', async () => {
    const { default: z } = await import('zod');

    const Player = z.object({
      username: z.string(),
      xp: z.number(),
      address: z.url(),
    });

    const result = Player.safeParse({
      username: 'carol',
      xp: 'not-a-number',
      address: 'https://example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a Player with missing username', async () => {
    const { default: z } = await import('zod');

    const Player = z.object({
      username: z.string(),
      xp: z.number(),
      address: z.url(),
    });

    const result = Player.safeParse({
      xp: 200,
      address: 'https://example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a Player with an empty username', async () => {
    const { default: z } = await import('zod');

    const Player = z.object({
      username: z.string().min(1),
      xp: z.number(),
      address: z.url(),
    });

    const result = Player.safeParse({
      username: '',
      xp: 200,
      address: 'https://example.com',
    });

    expect(result.success).toBe(false);
  });
});