/**
 * Tests for the badge tv() configuration from fools/frontend.astro.
 * Since .astro files cannot be directly imported in Vitest, the badge
 * configuration is reproduced here to test its class-generation logic.
 */
import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// Reproduce the badge configuration from frontend.astro
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
    it('includes base classes in all variants', () => {
      const classes = badge();
      expect(classes).toContain('starwind-badge');
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('font-semibold');
    });

    it('includes transition and focus classes in all variants', () => {
      const classes = badge();
      expect(classes).toContain('transition-all');
      expect(classes).toContain('outline-none');
    });
  });

  describe('default variants', () => {
    it('uses "default" variant, "md" size, and isLink=false by default', () => {
      const classes = badge();
      expect(classes).toContain('bg-foreground');
      expect(classes).toContain('text-background');
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-sm');
      expect(classes).not.toContain('cursor-pointer');
    });
  });

  describe('variant classes', () => {
    it('applies "primary" variant classes', () => {
      const classes = badge({ variant: 'primary' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('applies "secondary" variant classes', () => {
      const classes = badge({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    it('applies "outline" variant classes', () => {
      const classes = badge({ variant: 'outline' });
      expect(classes).toContain('border-border');
      expect(classes).toContain('border');
    });

    it('applies "ghost" variant classes', () => {
      const classes = badge({ variant: 'ghost' });
      expect(classes).toContain('bg-foreground/10');
    });

    it('applies "info" variant classes', () => {
      const classes = badge({ variant: 'info' });
      expect(classes).toContain('bg-info');
      expect(classes).toContain('text-info-foreground');
    });

    it('applies "success" variant classes', () => {
      const classes = badge({ variant: 'success' });
      expect(classes).toContain('bg-success');
      expect(classes).toContain('text-success-foreground');
    });

    it('applies "warning" variant classes', () => {
      const classes = badge({ variant: 'warning' });
      expect(classes).toContain('bg-warning');
      expect(classes).toContain('text-warning-foreground');
    });

    it('applies "error" variant classes', () => {
      const classes = badge({ variant: 'error' });
      expect(classes).toContain('bg-error');
      expect(classes).toContain('text-error-foreground');
    });
  });

  describe('size classes', () => {
    it('applies "sm" size classes', () => {
      const classes = badge({ size: 'sm' });
      expect(classes).toContain('px-2.5');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-xs');
    });

    it('applies "md" size classes (default)', () => {
      const classes = badge({ size: 'md' });
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-sm');
    });

    it('applies "lg" size classes', () => {
      const classes = badge({ size: 'lg' });
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-1');
      expect(classes).toContain('text-base');
    });
  });

  describe('isLink variant', () => {
    it('adds cursor-pointer when isLink is true', () => {
      const classes = badge({ isLink: true });
      expect(classes).toContain('cursor-pointer');
    });

    it('does not add cursor-pointer when isLink is false', () => {
      const classes = badge({ isLink: false });
      expect(classes).not.toContain('cursor-pointer');
    });
  });

  describe('compound variants (isLink + variant hover effects)', () => {
    it('adds hover class for default + isLink=true', () => {
      const classes = badge({ variant: 'default', isLink: true });
      expect(classes).toContain('hover:bg-foreground/80');
    });

    it('adds hover class for primary + isLink=true', () => {
      const classes = badge({ variant: 'primary', isLink: true });
      expect(classes).toContain('hover:bg-primary/80');
    });

    it('adds hover class for secondary + isLink=true', () => {
      const classes = badge({ variant: 'secondary', isLink: true });
      expect(classes).toContain('hover:bg-secondary/80');
    });

    it('adds hover class for outline + isLink=true', () => {
      const classes = badge({ variant: 'outline', isLink: true });
      expect(classes).toContain('hover:border-border/80');
    });

    it('adds hover class for ghost + isLink=true', () => {
      const classes = badge({ variant: 'ghost', isLink: true });
      expect(classes).toContain('hover:bg-foreground/7');
    });

    it('adds hover class for info + isLink=true', () => {
      const classes = badge({ variant: 'info', isLink: true });
      expect(classes).toContain('hover:bg-info/80');
    });

    it('adds hover class for success + isLink=true', () => {
      const classes = badge({ variant: 'success', isLink: true });
      expect(classes).toContain('hover:bg-success/80');
    });

    it('adds hover class for warning + isLink=true', () => {
      const classes = badge({ variant: 'warning', isLink: true });
      expect(classes).toContain('hover:bg-warning/80');
    });

    it('adds hover class for error + isLink=true', () => {
      const classes = badge({ variant: 'error', isLink: true });
      expect(classes).toContain('hover:bg-error/80');
    });

    it('does NOT add hover class when isLink is false', () => {
      const classes = badge({ variant: 'primary', isLink: false });
      expect(classes).not.toContain('hover:bg-primary/80');
    });
  });

  describe('combined variant + size + isLink', () => {
    it('correctly combines primary, lg, isLink=true', () => {
      const classes = badge({ variant: 'primary', size: 'lg', isLink: true });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('px-4');
      expect(classes).toContain('text-base');
      expect(classes).toContain('cursor-pointer');
      expect(classes).toContain('hover:bg-primary/80');
    });

    it('correctly combines error, sm, isLink=false', () => {
      const classes = badge({ variant: 'error', size: 'sm', isLink: false });
      expect(classes).toContain('bg-error');
      expect(classes).toContain('px-2.5');
      expect(classes).toContain('text-xs');
      expect(classes).not.toContain('cursor-pointer');
      expect(classes).not.toContain('hover:bg-error/80');
    });
  });
});