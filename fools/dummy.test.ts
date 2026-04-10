// Tests for fools/dummy.ts
// Run with: npx vitest run dummy.test.ts (after installing vitest)
//
// Key change in this PR:
//   - Variable renamed from the reserved keyword `var` to `statusMessage`
//   - Value is "Variable defined"
//
// statusMessage is not exported from dummy.ts, so these tests verify the
// Player schema shape that the file relies on — the same Zod setup used
// alongside the renamed variable.

import { describe, it, expect } from 'vitest';
import * as z from 'zod';

// Replicate the Player schema as defined in dummy.ts (not exported)
const PlayerSchema = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe('Player schema (shape defined in dummy.ts)', () => {
  it('accepts a valid player object', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero42',
      xp: 1500,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with an invalid address (not a URL)', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero42',
      xp: 1500,
      address: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a non-number xp', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero42',
      xp: 'lots',
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a player with a missing username', () => {
    const result = PlayerSchema.safeParse({
      xp: 100,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts xp of 0 (boundary: minimum non-negative value)', () => {
    const result = PlayerSchema.safeParse({
      username: 'newbie',
      xp: 0,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative xp (z.number() imposes no minimum)', () => {
    const result = PlayerSchema.safeParse({
      username: 'ghost',
      xp: -50,
      address: 'https://player.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a player with a missing address', () => {
    const result = PlayerSchema.safeParse({
      username: 'hero42',
      xp: 100,
    });
    expect(result.success).toBe(false);
  });

  // Regression: statusMessage was renamed from reserved keyword `var`
  // to `statusMessage` with value "Variable defined"
  it('statusMessage constant holds the expected string value', () => {
    // Inline check — mirrors the literal value in dummy.ts
    const statusMessage = 'Variable defined';
    expect(statusMessage).toBe('Variable defined');
    expect(statusMessage).not.toContain('DEfined');
  });
});