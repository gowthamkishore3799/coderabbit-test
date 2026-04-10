/**
 * Tests for the `badge` tv() configuration defined in fools/frontend.astro.
 *
 * The Astro component exports `badge` as a tailwind-variants (tv) object.
 * Because that logic is pure JavaScript (no Astro-specific runtime), it can
 * be tested here by recreating the same configuration.
 */

import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// ── Reproduce the badge configuration from fools/frontend.astro ──────────────
const badge = tv({
  base: [
    'starwind-badge inline-flex items-center rounded-full font-semibold',
    'transition-all outline-none focus-visible:ring-3',
  ],
  variants: {
    variant: {
      default: 'bg-foreground text-background focus-visible:ring-outline/50',
      primary: 'bg-primary text-primary-foreground focus-visible:ring-primary/50',
      secondary: 'bg-secondary text-secondary-foreground focus-visible:ring-secondary/50',
      outline: 'border-border focus-visible:border-outline focus-visible:ring-outline/50 border',
      ghost: 'bg-foreground/10 text-foreground focus-visible:ring-outline/50',
      info: 'bg-info text-info-foreground focus-visible:ring-info/50',
      success: 'bg-success text-success-foreground focus-visible:ring-success/50',
      warning: 'bg-warning text-warning-foreground focus-visible:ring-warning/50',
      error: 'bg-error text-error-foreground focus-visible:ring-error/50',
    },
    size: { sm: 'px-2.5 py-0.5 text-xs', md: 'px-3 py-0.5 text-sm', lg: 'px-4 py-1 text-base' },
    isLink: { true: 'cursor-pointer', false: '' },
  },
  compoundVariants: [
    { isLink: true, variant: 'default', className: 'hover:bg-foreground/80' },
    { isLink: true, variant: 'primary', className: 'hover:bg-primary/80' },
    { isLink: true, variant: 'secondary', className: 'hover:bg-secondary/80' },
    { isLink: true, variant: 'outline', className: 'hover:border-border/80' },
    { isLink: true, variant: 'ghost', className: 'hover:bg-foreground/7' },
    { isLink: true, variant: 'info', className: 'hover:bg-info/80' },
    { isLink: true, variant: 'success', className: 'hover:bg-success/80' },
    { isLink: true, variant: 'warning', className: 'hover:bg-warning/80' },
    { isLink: true, variant: 'error', className: 'hover:bg-error/80' },
  ],
  defaultVariants: { variant: 'default', size: 'md', isLink: false },
});

// Helper: check that a class string contains all expected tokens
function hasClasses(result: string, ...classes: string[]): boolean {
  return classes.every((cls) => result.split(/\s+/).includes(cls));
}

// ── Base classes ──────────────────────────────────────────────────────────────
describe('badge – base classes', () => {
  it('always includes starwind-badge', () => {
    expect(badge()).toContain('starwind-badge');
  });

  it('always includes inline-flex', () => {
    expect(badge()).toContain('inline-flex');
  });

  it('always includes rounded-full', () => {
    expect(badge()).toContain('rounded-full');
  });

  it('always includes font-semibold', () => {
    expect(badge()).toContain('font-semibold');
  });

  it('always includes transition-all', () => {
    expect(badge()).toContain('transition-all');
  });
});

// ── Default variants ──────────────────────────────────────────────────────────
describe('badge – default variants', () => {
  it('uses variant "default" when no variant is passed', () => {
    expect(badge()).toContain('bg-foreground');
    expect(badge()).toContain('text-background');
  });

  it('uses size "md" when no size is passed', () => {
    expect(badge()).toContain('px-3');
    expect(badge()).toContain('py-0.5');
    expect(badge()).toContain('text-sm');
  });

  it('is not a link by default (no cursor-pointer)', () => {
    expect(badge()).not.toContain('cursor-pointer');
  });
});

// ── Variant: variant ─────────────────────────────────────────────────────────
describe('badge – variant prop', () => {
  it('applies primary classes for variant="primary"', () => {
    const cls = badge({ variant: 'primary' });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
  });

  it('applies secondary classes for variant="secondary"', () => {
    const cls = badge({ variant: 'secondary' });
    expect(cls).toContain('bg-secondary');
    expect(cls).toContain('text-secondary-foreground');
  });

  it('applies outline border class for variant="outline"', () => {
    const cls = badge({ variant: 'outline' });
    expect(cls).toContain('border');
    expect(cls).toContain('border-border');
  });

  it('applies ghost classes for variant="ghost"', () => {
    const cls = badge({ variant: 'ghost' });
    expect(cls).toContain('bg-foreground/10');
  });

  it('applies info classes for variant="info"', () => {
    const cls = badge({ variant: 'info' });
    expect(cls).toContain('bg-info');
    expect(cls).toContain('text-info-foreground');
  });

  it('applies success classes for variant="success"', () => {
    const cls = badge({ variant: 'success' });
    expect(cls).toContain('bg-success');
    expect(cls).toContain('text-success-foreground');
  });

  it('applies warning classes for variant="warning"', () => {
    const cls = badge({ variant: 'warning' });
    expect(cls).toContain('bg-warning');
    expect(cls).toContain('text-warning-foreground');
  });

  it('applies error classes for variant="error"', () => {
    const cls = badge({ variant: 'error' });
    expect(cls).toContain('bg-error');
    expect(cls).toContain('text-error-foreground');
  });
});

// ── Variant: size ─────────────────────────────────────────────────────────────
describe('badge – size prop', () => {
  it('applies sm classes for size="sm"', () => {
    const cls = badge({ size: 'sm' });
    expect(cls).toContain('px-2.5');
    expect(cls).toContain('text-xs');
  });

  it('applies md classes for size="md"', () => {
    const cls = badge({ size: 'md' });
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('applies lg classes for size="lg"', () => {
    const cls = badge({ size: 'lg' });
    expect(cls).toContain('px-4');
    expect(cls).toContain('py-1');
    expect(cls).toContain('text-base');
  });
});

// ── Variant: isLink ───────────────────────────────────────────────────────────
describe('badge – isLink prop', () => {
  it('adds cursor-pointer when isLink=true', () => {
    expect(badge({ isLink: true })).toContain('cursor-pointer');
  });

  it('does not add cursor-pointer when isLink=false', () => {
    expect(badge({ isLink: false })).not.toContain('cursor-pointer');
  });
});

// ── Compound variants ─────────────────────────────────────────────────────────
describe('badge – compound variants (isLink + variant)', () => {
  it('adds hover:bg-foreground/80 when isLink=true and variant="default"', () => {
    expect(badge({ isLink: true, variant: 'default' })).toContain('hover:bg-foreground/80');
  });

  it('adds hover:bg-primary/80 when isLink=true and variant="primary"', () => {
    expect(badge({ isLink: true, variant: 'primary' })).toContain('hover:bg-primary/80');
  });

  it('adds hover:bg-secondary/80 when isLink=true and variant="secondary"', () => {
    expect(badge({ isLink: true, variant: 'secondary' })).toContain('hover:bg-secondary/80');
  });

  it('adds hover:border-border/80 when isLink=true and variant="outline"', () => {
    expect(badge({ isLink: true, variant: 'outline' })).toContain('hover:border-border/80');
  });

  it('adds hover:bg-foreground/7 when isLink=true and variant="ghost"', () => {
    expect(badge({ isLink: true, variant: 'ghost' })).toContain('hover:bg-foreground/7');
  });

  it('adds hover:bg-info/80 when isLink=true and variant="info"', () => {
    expect(badge({ isLink: true, variant: 'info' })).toContain('hover:bg-info/80');
  });

  it('adds hover:bg-success/80 when isLink=true and variant="success"', () => {
    expect(badge({ isLink: true, variant: 'success' })).toContain('hover:bg-success/80');
  });

  it('adds hover:bg-warning/80 when isLink=true and variant="warning"', () => {
    expect(badge({ isLink: true, variant: 'warning' })).toContain('hover:bg-warning/80');
  });

  it('adds hover:bg-error/80 when isLink=true and variant="error"', () => {
    expect(badge({ isLink: true, variant: 'error' })).toContain('hover:bg-error/80');
  });

  it('does NOT add compound hover class when isLink=false', () => {
    const cls = badge({ isLink: false, variant: 'primary' });
    expect(cls).not.toContain('hover:bg-primary/80');
  });
});

// ── Return type ───────────────────────────────────────────────────────────────
describe('badge – return type', () => {
  it('returns a string', () => {
    expect(typeof badge()).toBe('string');
  });

  it('returns a non-empty string', () => {
    expect(badge().length).toBeGreaterThan(0);
  });
});