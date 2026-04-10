import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// Tests for fools/frontend.astro (new file added in this PR).
// The .astro file cannot be imported directly by vitest without Astro tooling.
// We replicate the `badge` configuration from frontend.astro using the same
// tailwind-variants setup and test its class generation logic.

// Mirror of the badge export from frontend.astro
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

describe('fools/frontend.astro – badge base classes', () => {
  it('always includes the base starwind-badge class', () => {
    const cls = badge();
    expect(cls).toContain('starwind-badge');
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
});

describe('fools/frontend.astro – badge default variants', () => {
  it('uses "default" variant by default', () => {
    const cls = badge();
    expect(cls).toContain('bg-foreground');
    expect(cls).toContain('text-background');
  });

  it('uses "md" size by default', () => {
    const cls = badge();
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('does not include cursor-pointer by default (isLink false)', () => {
    const cls = badge();
    expect(cls).not.toContain('cursor-pointer');
  });
});

describe('fools/frontend.astro – badge variant prop', () => {
  it('applies primary variant classes', () => {
    const cls = badge({ variant: 'primary' });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
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

describe('fools/frontend.astro – badge size prop', () => {
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

describe('fools/frontend.astro – badge isLink compound variants', () => {
  it('adds cursor-pointer when isLink is true', () => {
    const cls = badge({ isLink: true });
    expect(cls).toContain('cursor-pointer');
  });

  it('adds default link hover class when isLink=true and variant=default', () => {
    const cls = badge({ isLink: true, variant: 'default' });
    expect(cls).toContain('hover:bg-foreground/80');
  });

  it('adds primary link hover class when isLink=true and variant=primary', () => {
    const cls = badge({ isLink: true, variant: 'primary' });
    expect(cls).toContain('hover:bg-primary/80');
  });

  it('adds secondary link hover class when isLink=true and variant=secondary', () => {
    const cls = badge({ isLink: true, variant: 'secondary' });
    expect(cls).toContain('hover:bg-secondary/80');
  });

  it('adds outline link hover class when isLink=true and variant=outline', () => {
    const cls = badge({ isLink: true, variant: 'outline' });
    expect(cls).toContain('hover:border-border/80');
  });

  it('adds ghost link hover class when isLink=true and variant=ghost', () => {
    const cls = badge({ isLink: true, variant: 'ghost' });
    expect(cls).toContain('hover:bg-foreground/7');
  });

  it('adds info link hover class when isLink=true and variant=info', () => {
    const cls = badge({ isLink: true, variant: 'info' });
    expect(cls).toContain('hover:bg-info/80');
  });

  it('adds success link hover class when isLink=true and variant=success', () => {
    const cls = badge({ isLink: true, variant: 'success' });
    expect(cls).toContain('hover:bg-success/80');
  });

  it('adds warning link hover class when isLink=true and variant=warning', () => {
    const cls = badge({ isLink: true, variant: 'warning' });
    expect(cls).toContain('hover:bg-warning/80');
  });

  it('adds error link hover class when isLink=true and variant=error', () => {
    const cls = badge({ isLink: true, variant: 'error' });
    expect(cls).toContain('hover:bg-error/80');
  });

  it('does not apply link hover class when isLink is false', () => {
    const cls = badge({ isLink: false, variant: 'primary' });
    expect(cls).not.toContain('hover:bg-primary/80');
  });
});

describe('fools/frontend.astro – badge combined props', () => {
  it('combines variant, size, and isLink correctly', () => {
    const cls = badge({ variant: 'success', size: 'lg', isLink: true });
    expect(cls).toContain('bg-success');
    expect(cls).toContain('text-base');
    expect(cls).toContain('cursor-pointer');
    expect(cls).toContain('hover:bg-success/80');
  });

  it('combines primary small link badge correctly', () => {
    const cls = badge({ variant: 'primary', size: 'sm', isLink: true });
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-xs');
    expect(cls).toContain('hover:bg-primary/80');
  });
});