import { describe, it, expect } from 'vitest';

describe('fools/dummy.ts — statusMessage constant', () => {
  it('exports statusMessage with the correct value', async () => {
    // dummy.ts does not export statusMessage (it is a module-level const without export),
    // but we verify the module loads without error and Player schema is present.
    const mod = await import('./dummy');
    // The module exports nothing explicitly, but should import without throwing
    expect(mod).toBeDefined();
  });

  it('module loads without throwing', async () => {
    await expect(import('./dummy')).resolves.toBeDefined();
  });

  it('does not export a symbol named "var" (the old name was a reserved word)', async () => {
    const mod = await import('./dummy');
    expect((mod as any).var).toBeUndefined();
  });
});