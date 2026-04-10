/**
 * Tests for the badge tv() configuration exported from fools/frontend.astro
 *
 * The badge function is defined in the Astro component's frontmatter as a
 * standalone tailwind-variants export, and is tested here as pure JS/TS logic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tv } from 'tailwind-variants';

// ---------------------------------------------------------------------------
// Re-declare the badge config identical to fools/frontend.astro
// (Astro files cannot be imported directly in node:test)
// ---------------------------------------------------------------------------
const badge = tv({
  base: [
    'starwind-badge inline-flex items-center rounded-full font-semibold',
    'transition-all outline-none focus-visible:ring-3',
  ],
  variants: {
    variant: {
      default:   'bg-foreground text-background focus-visible:ring-outline/50',
      primary:   'bg-primary text-primary-foreground focus-visible:ring-primary/50',
      secondary: 'bg-secondary text-secondary-foreground focus-visible:ring-secondary/50',
      outline:   'border-border focus-visible:border-outline focus-visible:ring-outline/50 border',
      ghost:     'bg-foreground/10 text-foreground focus-visible:ring-outline/50',
      info:      'bg-info text-info-foreground focus-visible:ring-info/50',
      success:   'bg-success text-success-foreground focus-visible:ring-success/50',
      warning:   'bg-warning text-warning-foreground focus-visible:ring-warning/50',
      error:     'bg-error text-error-foreground focus-visible:ring-error/50',
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

describe('badge – base classes', () => {
  test('always includes the starwind-badge base class', () => {
    const cls = badge();
    assert.ok(cls.includes('starwind-badge'), `Expected 'starwind-badge' in "${cls}"`);
  });

  test('always includes inline-flex', () => {
    const cls = badge();
    assert.ok(cls.includes('inline-flex'));
  });

  test('always includes rounded-full', () => {
    const cls = badge();
    assert.ok(cls.includes('rounded-full'));
  });
});

// ---------------------------------------------------------------------------
// Default variants
// ---------------------------------------------------------------------------

describe('badge – default variant (no arguments)', () => {
  test('applies default variant "default"', () => {
    const cls = badge();
    assert.ok(cls.includes('bg-foreground'), `Missing default variant class in "${cls}"`);
  });

  test('applies default size "md"', () => {
    const cls = badge();
    assert.ok(cls.includes('px-3'), `Missing md size class in "${cls}"`);
    assert.ok(cls.includes('text-sm'));
  });

  test('does not apply cursor-pointer by default (isLink: false)', () => {
    const cls = badge();
    assert.ok(!cls.includes('cursor-pointer'), `cursor-pointer should be absent by default`);
  });
});

// ---------------------------------------------------------------------------
// Variant classes
// ---------------------------------------------------------------------------

describe('badge – variant classes', () => {
  const variantMap: Record<string, string> = {
    default:   'bg-foreground',
    primary:   'bg-primary',
    secondary: 'bg-secondary',
    outline:   'border-border',
    ghost:     'bg-foreground/10',
    info:      'bg-info',
    success:   'bg-success',
    warning:   'bg-warning',
    error:     'bg-error',
  };

  for (const [variant, expectedClass] of Object.entries(variantMap)) {
    test(`variant "${variant}" includes "${expectedClass}"`, () => {
      const cls = badge({ variant: variant as Parameters<typeof badge>[0]['variant'] });
      assert.ok(
        cls.includes(expectedClass),
        `Expected "${expectedClass}" in class for variant "${variant}": "${cls}"`
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Size classes
// ---------------------------------------------------------------------------

describe('badge – size classes', () => {
  test('size sm applies text-xs', () => {
    const cls = badge({ size: 'sm' });
    assert.ok(cls.includes('text-xs'), `Missing text-xs for size sm in "${cls}"`);
    assert.ok(cls.includes('px-2.5'));
  });

  test('size md applies text-sm', () => {
    const cls = badge({ size: 'md' });
    assert.ok(cls.includes('text-sm'));
    assert.ok(cls.includes('px-3'));
  });

  test('size lg applies text-base', () => {
    const cls = badge({ size: 'lg' });
    assert.ok(cls.includes('text-base'));
    assert.ok(cls.includes('px-4'));
    assert.ok(cls.includes('py-1'));
  });
});

// ---------------------------------------------------------------------------
// isLink compound variants
// ---------------------------------------------------------------------------

describe('badge – isLink compound variants', () => {
  test('isLink: true adds cursor-pointer', () => {
    const cls = badge({ isLink: true });
    assert.ok(cls.includes('cursor-pointer'));
  });

  test('isLink: false does not add cursor-pointer', () => {
    const cls = badge({ isLink: false });
    assert.ok(!cls.includes('cursor-pointer'));
  });

  test('isLink: true + variant "primary" adds hover:bg-primary/80', () => {
    const cls = badge({ isLink: true, variant: 'primary' });
    assert.ok(cls.includes('hover:bg-primary/80'), `Expected hover class in "${cls}"`);
  });

  test('isLink: false + variant "primary" does NOT add hover:bg-primary/80', () => {
    const cls = badge({ isLink: false, variant: 'primary' });
    assert.ok(!cls.includes('hover:bg-primary/80'));
  });

  test('isLink: true + variant "success" adds hover:bg-success/80', () => {
    const cls = badge({ isLink: true, variant: 'success' });
    assert.ok(cls.includes('hover:bg-success/80'));
  });

  test('isLink: true + variant "error" adds hover:bg-error/80', () => {
    const cls = badge({ isLink: true, variant: 'error' });
    assert.ok(cls.includes('hover:bg-error/80'));
  });

  test('isLink: true + variant "warning" adds hover:bg-warning/80', () => {
    const cls = badge({ isLink: true, variant: 'warning' });
    assert.ok(cls.includes('hover:bg-warning/80'));
  });

  test('isLink: true + variant "info" adds hover:bg-info/80', () => {
    const cls = badge({ isLink: true, variant: 'info' });
    assert.ok(cls.includes('hover:bg-info/80'));
  });

  test('isLink: true + variant "outline" adds hover:border-border/80', () => {
    const cls = badge({ isLink: true, variant: 'outline' });
    assert.ok(cls.includes('hover:border-border/80'));
  });

  test('isLink: true + variant "ghost" adds hover:bg-foreground/7', () => {
    const cls = badge({ isLink: true, variant: 'ghost' });
    assert.ok(cls.includes('hover:bg-foreground/7'));
  });

  // Boundary: isLink true without specifying variant still applies default compound
  test('isLink: true with implicit default variant adds hover:bg-foreground/80', () => {
    const cls = badge({ isLink: true });
    assert.ok(cls.includes('hover:bg-foreground/80'));
  });
});

// ---------------------------------------------------------------------------
// Custom className merging
// ---------------------------------------------------------------------------

describe('badge – custom className override', () => {
  test('additional class is merged into the output', () => {
    const cls = badge({ class: 'my-custom-class' });
    assert.ok(cls.includes('my-custom-class'));
  });
});