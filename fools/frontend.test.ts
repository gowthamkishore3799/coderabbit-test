/**
 * Tests for the `badge` tv() configuration exported from fools/frontend.astro.
 *
 * The Astro runtime parts (Astro.props, HTML template) cannot be unit tested
 * without an Astro renderer. These tests focus on the `badge` tailwind-variants
 * configuration, which is the pure-JS logic that can be tested independently.
 */

import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// Replicate the badge configuration from frontend.astro
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

describe('badge tv() configuration (fools/frontend.astro)', () => {
  describe('base classes', () => {
    it('always includes base class "starwind-badge"', () => {
      expect(badge()).toContain('starwind-badge');
    });

    it('always includes "inline-flex" base class', () => {
      expect(badge()).toContain('inline-flex');
    });

    it('always includes "rounded-full" base class', () => {
      expect(badge()).toContain('rounded-full');
    });

    it('always includes "font-semibold" base class', () => {
      expect(badge()).toContain('font-semibold');
    });

    it('always includes "transition-all" base class', () => {
      expect(badge()).toContain('transition-all');
    });
  });

  describe('default variants', () => {
    it('uses "default" variant when none specified', () => {
      expect(badge()).toContain('bg-foreground');
      expect(badge()).toContain('text-background');
    });

    it('uses "md" size when none specified', () => {
      expect(badge()).toContain('px-3');
      expect(badge()).toContain('text-sm');
    });

    it('does not include "cursor-pointer" by default (isLink=false)', () => {
      expect(badge()).not.toContain('cursor-pointer');
    });
  });

  describe('variant prop', () => {
    it('applies "primary" variant classes', () => {
      const cls = badge({ variant: 'primary' });
      expect(cls).toContain('bg-primary');
      expect(cls).toContain('text-primary-foreground');
    });

    it('applies "secondary" variant classes', () => {
      const cls = badge({ variant: 'secondary' });
      expect(cls).toContain('bg-secondary');
    });

    it('applies "outline" variant classes', () => {
      const cls = badge({ variant: 'outline' });
      expect(cls).toContain('border-border');
      expect(cls).toContain('border');
    });

    it('applies "ghost" variant classes', () => {
      const cls = badge({ variant: 'ghost' });
      expect(cls).toContain('bg-foreground/10');
    });

    it('applies "info" variant classes', () => {
      const cls = badge({ variant: 'info' });
      expect(cls).toContain('bg-info');
    });

    it('applies "success" variant classes', () => {
      const cls = badge({ variant: 'success' });
      expect(cls).toContain('bg-success');
    });

    it('applies "warning" variant classes', () => {
      const cls = badge({ variant: 'warning' });
      expect(cls).toContain('bg-warning');
    });

    it('applies "error" variant classes', () => {
      const cls = badge({ variant: 'error' });
      expect(cls).toContain('bg-error');
    });
  });

  describe('size prop', () => {
    it('applies "sm" size classes', () => {
      const cls = badge({ size: 'sm' });
      expect(cls).toContain('px-2.5');
      expect(cls).toContain('text-xs');
    });

    it('applies "md" size classes', () => {
      const cls = badge({ size: 'md' });
      expect(cls).toContain('px-3');
      expect(cls).toContain('text-sm');
    });

    it('applies "lg" size classes', () => {
      const cls = badge({ size: 'lg' });
      expect(cls).toContain('px-4');
      expect(cls).toContain('text-base');
    });
  });

  describe('isLink prop', () => {
    it('adds "cursor-pointer" when isLink=true', () => {
      expect(badge({ isLink: true })).toContain('cursor-pointer');
    });

    it('does not add "cursor-pointer" when isLink=false', () => {
      expect(badge({ isLink: false })).not.toContain('cursor-pointer');
    });
  });

  describe('compound variants (isLink + variant)', () => {
    it('adds hover class for isLink=true + default variant', () => {
      const cls = badge({ isLink: true, variant: 'default' });
      expect(cls).toContain('hover:bg-foreground/80');
    });

    it('adds hover class for isLink=true + primary variant', () => {
      const cls = badge({ isLink: true, variant: 'primary' });
      expect(cls).toContain('hover:bg-primary/80');
    });

    it('adds hover class for isLink=true + secondary variant', () => {
      const cls = badge({ isLink: true, variant: 'secondary' });
      expect(cls).toContain('hover:bg-secondary/80');
    });

    it('adds hover class for isLink=true + outline variant', () => {
      const cls = badge({ isLink: true, variant: 'outline' });
      expect(cls).toContain('hover:border-border/80');
    });

    it('adds hover class for isLink=true + ghost variant', () => {
      const cls = badge({ isLink: true, variant: 'ghost' });
      expect(cls).toContain('hover:bg-foreground/7');
    });

    it('adds hover class for isLink=true + info variant', () => {
      const cls = badge({ isLink: true, variant: 'info' });
      expect(cls).toContain('hover:bg-info/80');
    });

    it('adds hover class for isLink=true + success variant', () => {
      const cls = badge({ isLink: true, variant: 'success' });
      expect(cls).toContain('hover:bg-success/80');
    });

    it('adds hover class for isLink=true + warning variant', () => {
      const cls = badge({ isLink: true, variant: 'warning' });
      expect(cls).toContain('hover:bg-warning/80');
    });

    it('adds hover class for isLink=true + error variant', () => {
      const cls = badge({ isLink: true, variant: 'error' });
      expect(cls).toContain('hover:bg-error/80');
    });

    it('does NOT add hover class when isLink=false', () => {
      const cls = badge({ isLink: false, variant: 'primary' });
      expect(cls).not.toContain('hover:bg-primary/80');
    });
  });

  describe('combined props', () => {
    it('applies all specified variant+size+isLink classes together', () => {
      const cls = badge({ variant: 'success', size: 'lg', isLink: true });
      expect(cls).toContain('bg-success');
      expect(cls).toContain('px-4');
      expect(cls).toContain('cursor-pointer');
      expect(cls).toContain('hover:bg-success/80');
    });

    it('returns a string', () => {
      expect(typeof badge({ variant: 'info', size: 'sm' })).toBe('string');
    });

    it('generates non-empty class string', () => {
      expect(badge({ variant: 'error', size: 'md', isLink: false }).length).toBeGreaterThan(0);
    });
  });
});