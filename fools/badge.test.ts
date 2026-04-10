import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

/**
 * Tests for the `badge` tailwind-variants configuration declared in
 * fools/frontend.astro (new file added in this PR).
 *
 * The Astro frontmatter exports the `badge` tv() object; we replicate it
 * here so it can be exercised in a pure-TS test environment without the
 * Astro runtime.
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
// Base classes
// ---------------------------------------------------------------------------
describe('badge base classes', () => {
  it('always includes the base starwind-badge class', () => {
    const cls = badge();
    expect(cls).toContain('starwind-badge');
  });

  it('always includes inline-flex and rounded-full', () => {
    const cls = badge();
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('rounded-full');
  });

  it('always includes transition-all', () => {
    expect(badge()).toContain('transition-all');
  });
});

// ---------------------------------------------------------------------------
// Default variant behaviour
// ---------------------------------------------------------------------------
describe('badge default variants', () => {
  it('uses "default" variant when none specified', () => {
    const cls = badge();
    expect(cls).toContain('bg-foreground');
    expect(cls).toContain('text-background');
  });

  it('uses "md" size when none specified', () => {
    const cls = badge();
    expect(cls).toContain('px-3');
    expect(cls).toContain('text-sm');
  });

  it('does not include cursor-pointer when isLink defaults to false', () => {
    const cls = badge();
    expect(cls).not.toContain('cursor-pointer');
  });
});

// ---------------------------------------------------------------------------
// Variant: each named variant produces its unique class
// ---------------------------------------------------------------------------
const variantCases: Array<[string, string]> = [
  ['default',   'bg-foreground'],
  ['primary',   'bg-primary'],
  ['secondary', 'bg-secondary'],
  ['outline',   'border-border'],
  ['ghost',     'bg-foreground/10'],
  ['info',      'bg-info'],
  ['success',   'bg-success'],
  ['warning',   'bg-warning'],
  ['error',     'bg-error'],
];

describe('badge variant classes', () => {
  for (const [variant, expectedClass] of variantCases) {
    it(`variant="${variant}" includes "${expectedClass}"`, () => {
      const cls = badge({ variant: variant as Parameters<typeof badge>[0]['variant'] });
      expect(cls).toContain(expectedClass);
    });
  }
});

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------
describe('badge size classes', () => {
  it('size="sm" includes text-xs and px-2.5', () => {
    const cls = badge({ size: 'sm' });
    expect(cls).toContain('text-xs');
    expect(cls).toContain('px-2.5');
  });

  it('size="md" includes text-sm and px-3', () => {
    const cls = badge({ size: 'md' });
    expect(cls).toContain('text-sm');
    expect(cls).toContain('px-3');
  });

  it('size="lg" includes text-base and px-4', () => {
    const cls = badge({ size: 'lg' });
    expect(cls).toContain('text-base');
    expect(cls).toContain('px-4');
  });
});

// ---------------------------------------------------------------------------
// isLink compound variant — each variant gets its hover class when isLink=true
// ---------------------------------------------------------------------------
const compoundCases: Array<[string, string]> = [
  ['default',   'hover:bg-foreground/80'],
  ['primary',   'hover:bg-primary/80'],
  ['secondary', 'hover:bg-secondary/80'],
  ['outline',   'hover:border-border/80'],
  ['ghost',     'hover:bg-foreground/7'],
  ['info',      'hover:bg-info/80'],
  ['success',   'hover:bg-success/80'],
  ['warning',   'hover:bg-warning/80'],
  ['error',     'hover:bg-error/80'],
];

describe('badge compound variants (isLink=true)', () => {
  it('adds cursor-pointer when isLink=true', () => {
    const cls = badge({ isLink: true });
    expect(cls).toContain('cursor-pointer');
  });

  for (const [variant, hoverClass] of compoundCases) {
    it(`variant="${variant}" with isLink=true includes "${hoverClass}"`, () => {
      const cls = badge({
        variant: variant as Parameters<typeof badge>[0]['variant'],
        isLink: true,
      });
      expect(cls).toContain(hoverClass);
    });
  }

  it('does NOT add hover class when isLink=false', () => {
    const cls = badge({ variant: 'primary', isLink: false });
    expect(cls).not.toContain('hover:bg-primary/80');
  });
});

// ---------------------------------------------------------------------------
// className override (consumer can pass extra classes)
// ---------------------------------------------------------------------------
describe('badge className override', () => {
  it('merges extra className into output', () => {
    const cls = badge({ class: 'my-custom-class' });
    expect(cls).toContain('my-custom-class');
  });
});

// ---------------------------------------------------------------------------
// Regression: default variant should not include variant-specific hover
//             classes when isLink is false
// ---------------------------------------------------------------------------
describe('badge regression: no hover class without isLink', () => {
  it('does not contain any hover: class by default', () => {
    const cls = badge();
    expect(cls).not.toMatch(/hover:/);
  });
});