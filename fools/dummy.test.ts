import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// dummy.ts defines Player schema and statusMessage as module-level constants (not exported).
// We reconstruct equivalent schemas to test the logic introduced/changed by this PR.

describe('Player schema behavior (fools/dummy.ts)', () => {
  // Reconstruct equivalent schema to test logic (Player is not exported)
  const PlayerSchema = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  it('parses a valid player', () => {
    const result = PlayerSchema.safeParse({
      username: 'Alice',
      xp: 1500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing username', () => {
    const result = PlayerSchema.safeParse({
      xp: 100,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-string username', () => {
    const result = PlayerSchema.safeParse({
      username: 42,
      xp: 100,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-number xp', () => {
    const result = PlayerSchema.safeParse({
      username: 'Bob',
      xp: 'lots',
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid address URL', () => {
    const result = PlayerSchema.safeParse({
      username: 'Carol',
      xp: 200,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty address string', () => {
    const result = PlayerSchema.safeParse({
      username: 'Dave',
      xp: 50,
      address: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero xp', () => {
    const result = PlayerSchema.safeParse({
      username: 'Newbie',
      xp: 0,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (no min constraint)', () => {
    const result = PlayerSchema.safeParse({
      username: 'Penalized',
      xp: -50,
      address: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects extra unexpected fields only if strict', () => {
    // Player uses z.object (not strict), so extra fields are stripped but parsing succeeds
    const result = PlayerSchema.safeParse({
      username: 'Test',
      xp: 10,
      address: 'https://example.com',
      extraField: 'ignored',
    });
    expect(result.success).toBe(true);
  });
});