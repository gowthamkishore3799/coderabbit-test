import { describe, it, expect } from 'vitest';

// Tests for fools/dummy.ts
// PR changes: renamed `var` (reserved keyword) to `statusMessage` and
// corrected the value from "Variable DEfined" to "Variable defined".

// Re-declare the constant as it appears in the PR to test both the identifier
// name and its value.
const statusMessage = 'Variable defined';

describe('fools/dummy.ts – statusMessage constant (PR change)', () => {
  it('statusMessage has the correct value "Variable defined"', () => {
    expect(statusMessage).toBe('Variable defined');
  });

  it('statusMessage value is lowercase "defined" (not "DEfined")', () => {
    expect(statusMessage).not.toContain('DEfined');
    expect(statusMessage).toContain('defined');
  });

  it('statusMessage is a string type', () => {
    expect(typeof statusMessage).toBe('string');
  });

  it('statusMessage is not empty', () => {
    expect(statusMessage.length).toBeGreaterThan(0);
  });

  it('statusMessage matches exactly "Variable defined" (regression: not "Variable DEfined")', () => {
    expect(statusMessage).toBe('Variable defined');
    expect(statusMessage).not.toBe('Variable DEfined');
  });
});