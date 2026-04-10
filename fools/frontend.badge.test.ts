/**
 * Tests for the `badge` tailwind-variants configuration exported from
 * fools/frontend.astro (new file added in this PR).
 *
 * The Astro frontmatter block defines and exports `badge` as a tv() call.
 * We re-create the identical tv() configuration here so the class-generation
 * logic can be exercised without needing an Astro runtime.
 */

import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// ---------------------------------------------------------------------------
// Reproduce the badge tv() configuration from frontend.astro verbatim
// ---------------------------------------------------------------------------
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
    { isLink: true, variant: 'default',   className: 'hover:bg-foreground/80' },
    { isLink: true, variant: 'primary',   className: 'hover:bg-primary/80' },
    { isLink: true, variant: 'secondary', className: 'hover:bg-secondary/80' },
    { isLink: true, variant: 'outline',   className: 'hover:border-border/80' },
    { isLink: true, variant: 'ghost',     className: 'hover:bg-foreground/7' },
    { isLink: true, variant: 'info',      className: 'hover:bg-info/80' },
    { isLink: true, variant: 'success',   className: 'hover:bg-success/80' },
    { isLink: true, variant: 'warning',   className: 'hover:bg-warning/80' },
    { isLink: true, variant: 'error',     className: 'hover:bg-error/80' },
  ],
  defaultVariants: { variant: 'default', size: 'md', isLink: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function classes(str: string): string[] {
  return str.split(/\s+/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Base classes — always present
// ---------------------------------------------------------------------------
describe('badge base classes', () => {
  it('always includes starwind-badge', () => {
    expect(classes(badge())).toContain('starwind-badge');
  });

  it('always includes inline-flex and items-center', () => {
    const cls = classes(badge());
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('items-center');
  });

  it('always includes rounded-full and font-semibold', () => {
    const cls = classes(badge());
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('font-semibold');
  });

  it('always includes transition-all and outline-none', () => {
    const cls = classes(badge());
    expect(cls).toContain('transition-all');
    expect(cls).toContain('outline-none');
  });
});

// ---------------------------------------------------------------------------
// Default variants
// ---------------------------------------------------------------------------
describe('badge default variants', () => {
  it('uses "default" variant when no variant is specified', () => {
    expect(classes(badge())).toContain('bg-foreground');
  });

  it('uses "md" size when no size is specified', () => {
    const cls = classes(badge());
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('does NOT include cursor-pointer when isLink is not set', () => {
    expect(classes(badge())).not.toContain('cursor-pointer');
  });
});

// ---------------------------------------------------------------------------
// Variant: variant
// ---------------------------------------------------------------------------
describe('badge variant prop', () => {
  it('primary variant includes bg-primary and text-primary-foreground', () => {
    const cls = classes(badge({ variant: 'primary' }));
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
  });

  it('secondary variant includes bg-secondary', () => {
    expect(classes(badge({ variant: 'secondary' }))).toContain('bg-secondary');
  });

  it('outline variant includes border-border and border', () => {
    const cls = classes(badge({ variant: 'outline' }));
    expect(cls).toContain('border-border');
    expect(cls).toContain('border');
  });

  it('ghost variant includes bg-foreground/10', () => {
    expect(classes(badge({ variant: 'ghost' }))).toContain('bg-foreground/10');
  });

  it('info variant includes bg-info and text-info-foreground', () => {
    const cls = classes(badge({ variant: 'info' }));
    expect(cls).toContain('bg-info');
    expect(cls).toContain('text-info-foreground');
  });

  it('success variant includes bg-success', () => {
    expect(classes(badge({ variant: 'success' }))).toContain('bg-success');
  });

  it('warning variant includes bg-warning', () => {
    expect(classes(badge({ variant: 'warning' }))).toContain('bg-warning');
  });

  it('error variant includes bg-error', () => {
    expect(classes(badge({ variant: 'error' }))).toContain('bg-error');
  });
});

// ---------------------------------------------------------------------------
// Variant: size
// ---------------------------------------------------------------------------
describe('badge size prop', () => {
  it('sm size includes text-xs and px-2.5', () => {
    const cls = classes(badge({ size: 'sm' }));
    expect(cls).toContain('text-xs');
    expect(cls).toContain('px-2.5');
  });

  it('md size includes text-sm and px-3', () => {
    const cls = classes(badge({ size: 'md' }));
    expect(cls).toContain('text-sm');
    expect(cls).toContain('px-3');
  });

  it('lg size includes text-base and px-4', () => {
    const cls = classes(badge({ size: 'lg' }));
    expect(cls).toContain('text-base');
    expect(cls).toContain('px-4');
  });
});

// ---------------------------------------------------------------------------
// Variant: isLink
// ---------------------------------------------------------------------------
describe('badge isLink prop', () => {
  it('adds cursor-pointer when isLink is true', () => {
    expect(classes(badge({ isLink: true }))).toContain('cursor-pointer');
  });

  it('does not add cursor-pointer when isLink is false', () => {
    expect(classes(badge({ isLink: false }))).not.toContain('cursor-pointer');
  });
});

// ---------------------------------------------------------------------------
// Compound variants — isLink + variant combos
// ---------------------------------------------------------------------------
describe('badge compound variants (isLink + variant)', () => {
  it('default + isLink adds hover:bg-foreground/80', () => {
    expect(classes(badge({ variant: 'default', isLink: true }))).toContain('hover:bg-foreground/80');
  });

  it('primary + isLink adds hover:bg-primary/80', () => {
    expect(classes(badge({ variant: 'primary', isLink: true }))).toContain('hover:bg-primary/80');
  });

  it('secondary + isLink adds hover:bg-secondary/80', () => {
    expect(classes(badge({ variant: 'secondary', isLink: true }))).toContain(
      'hover:bg-secondary/80'
    );
  });

  it('outline + isLink adds hover:border-border/80', () => {
    expect(classes(badge({ variant: 'outline', isLink: true }))).toContain('hover:border-border/80');
  });

  it('ghost + isLink adds hover:bg-foreground/7', () => {
    expect(classes(badge({ variant: 'ghost', isLink: true }))).toContain('hover:bg-foreground/7');
  });

  it('info + isLink adds hover:bg-info/80', () => {
    expect(classes(badge({ variant: 'info', isLink: true }))).toContain('hover:bg-info/80');
  });

  it('success + isLink adds hover:bg-success/80', () => {
    expect(classes(badge({ variant: 'success', isLink: true }))).toContain('hover:bg-success/80');
  });

  it('warning + isLink adds hover:bg-warning/80', () => {
    expect(classes(badge({ variant: 'warning', isLink: true }))).toContain('hover:bg-warning/80');
  });

  it('error + isLink adds hover:bg-error/80', () => {
    expect(classes(badge({ variant: 'error', isLink: true }))).toContain('hover:bg-error/80');
  });

  // Regression: compound variant should NOT apply when isLink is false
  it('primary WITHOUT isLink does NOT add hover:bg-primary/80', () => {
    expect(classes(badge({ variant: 'primary', isLink: false }))).not.toContain(
      'hover:bg-primary/80'
    );
  });
});

// ---------------------------------------------------------------------------
// Custom className passthrough
// ---------------------------------------------------------------------------
describe('badge custom className', () => {
  it('merges a custom class string', () => {
    const cls = classes(badge({ class: 'my-custom-class' }));
    expect(cls).toContain('my-custom-class');
  });
});