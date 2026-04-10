import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

/**
 * Re-declare the badge tv() configuration from frontend.astro
 * (Astro files cannot be directly imported in a Node/vitest environment,
 * so we extract the pure JS logic for testing.)
 */
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
    size: {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-0.5 text-sm',
      lg: 'px-4 py-1 text-base',
    },
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

// ─────────────────────────────────────────────
// Base classes
// ─────────────────────────────────────────────
describe('badge – base classes', () => {
  it('always includes base class starwind-badge', () => {
    expect(badge()).toContain('starwind-badge');
  });

  it('always includes inline-flex and items-center', () => {
    const cls = badge();
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('items-center');
  });

  it('always includes rounded-full and font-semibold', () => {
    const cls = badge();
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('font-semibold');
  });

  it('always includes transition-all and outline-none', () => {
    const cls = badge();
    expect(cls).toContain('transition-all');
    expect(cls).toContain('outline-none');
  });
});

// ─────────────────────────────────────────────
// Default variants
// ─────────────────────────────────────────────
describe('badge – default variants (variant=default, size=md, isLink=false)', () => {
  it('applies default variant classes by default', () => {
    const cls = badge();
    expect(cls).toContain('bg-foreground');
    expect(cls).toContain('text-background');
  });

  it('applies md size classes by default', () => {
    const cls = badge();
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('does not include cursor-pointer when isLink defaults to false', () => {
    expect(badge()).not.toContain('cursor-pointer');
  });
});

// ─────────────────────────────────────────────
// Variant classes
// ─────────────────────────────────────────────
describe('badge – variant classes', () => {
  it('primary variant includes bg-primary and text-primary-foreground', () => {
    const cls = badge({ variant: 'primary' });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
  });

  it('secondary variant includes bg-secondary', () => {
    expect(badge({ variant: 'secondary' })).toContain('bg-secondary');
  });

  it('outline variant includes border class', () => {
    expect(badge({ variant: 'outline' })).toContain('border');
  });

  it('ghost variant includes bg-foreground/10', () => {
    expect(badge({ variant: 'ghost' })).toContain('bg-foreground/10');
  });

  it('info variant includes bg-info', () => {
    expect(badge({ variant: 'info' })).toContain('bg-info');
  });

  it('success variant includes bg-success', () => {
    expect(badge({ variant: 'success' })).toContain('bg-success');
  });

  it('warning variant includes bg-warning', () => {
    expect(badge({ variant: 'warning' })).toContain('bg-warning');
  });

  it('error variant includes bg-error', () => {
    expect(badge({ variant: 'error' })).toContain('bg-error');
  });
});

// ─────────────────────────────────────────────
// Size classes
// ─────────────────────────────────────────────
describe('badge – size classes', () => {
  it('sm size includes px-2.5 and text-xs', () => {
    const cls = badge({ size: 'sm' });
    expect(cls).toContain('px-2.5');
    expect(cls).toContain('text-xs');
  });

  it('md size includes px-3 and text-sm', () => {
    const cls = badge({ size: 'md' });
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('lg size includes px-4 and text-base', () => {
    const cls = badge({ size: 'lg' });
    expect(cls).toContain('px-4');
    expect(cls).toContain('text-base');
  });
});

// ─────────────────────────────────────────────
// isLink variant
// ─────────────────────────────────────────────
describe('badge – isLink variant', () => {
  it('adds cursor-pointer when isLink is true', () => {
    expect(badge({ isLink: true })).toContain('cursor-pointer');
  });

  it('does not add cursor-pointer when isLink is false', () => {
    expect(badge({ isLink: false })).not.toContain('cursor-pointer');
  });
});

// ─────────────────────────────────────────────
// Compound variants (isLink + variant hover classes)
// ─────────────────────────────────────────────
describe('badge – compound variants (isLink hover styles)', () => {
  it('adds hover:bg-foreground/80 for isLink+default', () => {
    expect(badge({ isLink: true, variant: 'default' })).toContain('hover:bg-foreground/80');
  });

  it('adds hover:bg-primary/80 for isLink+primary', () => {
    expect(badge({ isLink: true, variant: 'primary' })).toContain('hover:bg-primary/80');
  });

  it('adds hover:bg-secondary/80 for isLink+secondary', () => {
    expect(badge({ isLink: true, variant: 'secondary' })).toContain('hover:bg-secondary/80');
  });

  it('adds hover:border-border/80 for isLink+outline', () => {
    expect(badge({ isLink: true, variant: 'outline' })).toContain('hover:border-border/80');
  });

  it('adds hover:bg-foreground/7 for isLink+ghost', () => {
    expect(badge({ isLink: true, variant: 'ghost' })).toContain('hover:bg-foreground/7');
  });

  it('adds hover:bg-info/80 for isLink+info', () => {
    expect(badge({ isLink: true, variant: 'info' })).toContain('hover:bg-info/80');
  });

  it('adds hover:bg-success/80 for isLink+success', () => {
    expect(badge({ isLink: true, variant: 'success' })).toContain('hover:bg-success/80');
  });

  it('adds hover:bg-warning/80 for isLink+warning', () => {
    expect(badge({ isLink: true, variant: 'warning' })).toContain('hover:bg-warning/80');
  });

  it('adds hover:bg-error/80 for isLink+error', () => {
    expect(badge({ isLink: true, variant: 'error' })).toContain('hover:bg-error/80');
  });

  it('does NOT add hover class when isLink is false', () => {
    expect(badge({ isLink: false, variant: 'primary' })).not.toContain('hover:bg-primary/80');
  });
});

// ─────────────────────────────────────────────
// Combined variants
// ─────────────────────────────────────────────
describe('badge – combined variants', () => {
  it('produces correct classes for primary+lg+isLink', () => {
    const cls = badge({ variant: 'primary', size: 'lg', isLink: true });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('px-4');
    expect(cls).toContain('text-base');
    expect(cls).toContain('cursor-pointer');
    expect(cls).toContain('hover:bg-primary/80');
  });

  it('produces correct classes for error+sm+non-link', () => {
    const cls = badge({ variant: 'error', size: 'sm', isLink: false });
    expect(cls).toContain('bg-error');
    expect(cls).toContain('px-2.5');
    expect(cls).toContain('text-xs');
    expect(cls).not.toContain('cursor-pointer');
    expect(cls).not.toContain('hover:bg-error/80');
  });
});