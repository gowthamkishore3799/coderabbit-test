/**
 * Tests for the badge component defined in fools/frontend.astro.
 * Since .astro files cannot be imported directly by vitest, the badge tv()
 * configuration is reproduced here and tested for correctness of class generation.
 *
 * The badge export from frontend.astro:
 *   export const badge = tv({ base: [...], variants: { variant, size, isLink }, ... })
 */
import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// Reproduced from fools/frontend.astro
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

describe('badge – base classes', () => {
  it('always includes base class starwind-badge', () => {
    expect(badge()).toContain('starwind-badge');
  });

  it('always includes inline-flex items-center rounded-full font-semibold', () => {
    const cls = badge();
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('items-center');
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('font-semibold');
  });

  it('always includes transition-all and outline-none', () => {
    const cls = badge();
    expect(cls).toContain('transition-all');
    expect(cls).toContain('outline-none');
  });

  it('always includes focus-visible:ring-3', () => {
    expect(badge()).toContain('focus-visible:ring-3');
  });
});

describe('badge – default variants', () => {
  it('defaults to variant "default"', () => {
    expect(badge()).toContain('bg-foreground');
    expect(badge()).toContain('text-background');
  });

  it('defaults to size "md"', () => {
    expect(badge()).toContain('px-3');
    expect(badge()).toContain('py-0.5');
    expect(badge()).toContain('text-sm');
  });

  it('defaults to isLink false (no cursor-pointer)', () => {
    expect(badge()).not.toContain('cursor-pointer');
  });
});

describe('badge – variant classes', () => {
  it('applies primary variant classes', () => {
    const cls = badge({ variant: 'primary' });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
    expect(cls).toContain('focus-visible:ring-primary/50');
  });

  it('applies secondary variant classes', () => {
    const cls = badge({ variant: 'secondary' });
    expect(cls).toContain('bg-secondary');
    expect(cls).toContain('text-secondary-foreground');
  });

  it('applies outline variant classes', () => {
    const cls = badge({ variant: 'outline' });
    expect(cls).toContain('border-border');
    expect(cls).toContain('border');
  });

  it('applies ghost variant classes', () => {
    const cls = badge({ variant: 'ghost' });
    expect(cls).toContain('bg-foreground/10');
  });

  it('applies info variant classes', () => {
    const cls = badge({ variant: 'info' });
    expect(cls).toContain('bg-info');
    expect(cls).toContain('text-info-foreground');
  });

  it('applies success variant classes', () => {
    const cls = badge({ variant: 'success' });
    expect(cls).toContain('bg-success');
    expect(cls).toContain('text-success-foreground');
  });

  it('applies warning variant classes', () => {
    const cls = badge({ variant: 'warning' });
    expect(cls).toContain('bg-warning');
    expect(cls).toContain('text-warning-foreground');
  });

  it('applies error variant classes', () => {
    const cls = badge({ variant: 'error' });
    expect(cls).toContain('bg-error');
    expect(cls).toContain('text-error-foreground');
  });
});

describe('badge – size classes', () => {
  it('applies sm size classes', () => {
    const cls = badge({ size: 'sm' });
    expect(cls).toContain('px-2.5');
    expect(cls).toContain('py-0.5');
    expect(cls).toContain('text-xs');
  });

  it('applies md size classes', () => {
    const cls = badge({ size: 'md' });
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('applies lg size classes', () => {
    const cls = badge({ size: 'lg' });
    expect(cls).toContain('px-4');
    expect(cls).toContain('py-1');
    expect(cls).toContain('text-base');
  });
});

describe('badge – isLink compound variants', () => {
  it('adds cursor-pointer when isLink is true', () => {
    expect(badge({ isLink: true })).toContain('cursor-pointer');
  });

  it('does not add cursor-pointer when isLink is false', () => {
    expect(badge({ isLink: false })).not.toContain('cursor-pointer');
  });

  it('adds hover:bg-foreground/80 for default+isLink', () => {
    const cls = badge({ variant: 'default', isLink: true });
    expect(cls).toContain('hover:bg-foreground/80');
  });

  it('adds hover:bg-primary/80 for primary+isLink', () => {
    const cls = badge({ variant: 'primary', isLink: true });
    expect(cls).toContain('hover:bg-primary/80');
  });

  it('adds hover:bg-secondary/80 for secondary+isLink', () => {
    const cls = badge({ variant: 'secondary', isLink: true });
    expect(cls).toContain('hover:bg-secondary/80');
  });

  it('adds hover:border-border/80 for outline+isLink', () => {
    const cls = badge({ variant: 'outline', isLink: true });
    expect(cls).toContain('hover:border-border/80');
  });

  it('adds hover:bg-foreground/7 for ghost+isLink', () => {
    const cls = badge({ variant: 'ghost', isLink: true });
    expect(cls).toContain('hover:bg-foreground/7');
  });

  it('adds hover:bg-info/80 for info+isLink', () => {
    const cls = badge({ variant: 'info', isLink: true });
    expect(cls).toContain('hover:bg-info/80');
  });

  it('adds hover:bg-success/80 for success+isLink', () => {
    const cls = badge({ variant: 'success', isLink: true });
    expect(cls).toContain('hover:bg-success/80');
  });

  it('adds hover:bg-warning/80 for warning+isLink', () => {
    const cls = badge({ variant: 'warning', isLink: true });
    expect(cls).toContain('hover:bg-warning/80');
  });

  it('adds hover:bg-error/80 for error+isLink', () => {
    const cls = badge({ variant: 'error', isLink: true });
    expect(cls).toContain('hover:bg-error/80');
  });

  it('does NOT add hover class when isLink is false for primary', () => {
    const cls = badge({ variant: 'primary', isLink: false });
    expect(cls).not.toContain('hover:bg-primary/80');
  });
});

describe('badge – custom className override', () => {
  it('merges additional classes via class option', () => {
    const cls = badge({ class: 'my-custom-class' });
    expect(cls).toContain('my-custom-class');
  });
});