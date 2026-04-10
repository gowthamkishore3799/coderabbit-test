/**
 * Tests for the badge tv() configuration defined in fools/frontend.astro.
 *
 * The badge export is a tailwind-variants config defined in the Astro component's
 * frontmatter. Since .astro files cannot be directly imported by Vitest, we
 * replicate the badge configuration here and test its output. This validates the
 * variant/compound-variant logic introduced in the PR.
 */
import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// Replicate the exact badge config from fools/frontend.astro
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

describe('badge tv() config (from frontend.astro)', () => {
  describe('base classes', () => {
    it('always includes starwind-badge base class', () => {
      const cls = badge();
      expect(cls).toContain('starwind-badge');
    });

    it('always includes inline-flex and items-center', () => {
      const cls = badge();
      expect(cls).toContain('inline-flex');
      expect(cls).toContain('items-center');
    });

    it('always includes transition-all', () => {
      const cls = badge();
      expect(cls).toContain('transition-all');
    });
  });

  describe('default variants', () => {
    it('uses "default" variant when no variant specified', () => {
      const cls = badge();
      expect(cls).toContain('bg-foreground');
      expect(cls).toContain('text-background');
    });

    it('uses "md" size when no size specified', () => {
      const cls = badge();
      expect(cls).toContain('px-3');
      expect(cls).toContain('text-sm');
    });

    it('does not include cursor-pointer when isLink defaults to false', () => {
      const cls = badge();
      expect(cls).not.toContain('cursor-pointer');
    });
  });

  describe('variant classes', () => {
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

  describe('size classes', () => {
    it('applies sm size classes', () => {
      const cls = badge({ size: 'sm' });
      expect(cls).toContain('px-2.5');
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
      expect(cls).toContain('text-base');
    });
  });

  describe('isLink variant', () => {
    it('adds cursor-pointer when isLink is true', () => {
      const cls = badge({ isLink: true });
      expect(cls).toContain('cursor-pointer');
    });

    it('does not add cursor-pointer when isLink is false', () => {
      const cls = badge({ isLink: false });
      expect(cls).not.toContain('cursor-pointer');
    });
  });

  describe('compound variants (isLink + variant)', () => {
    it('adds hover:bg-foreground/80 for isLink+default', () => {
      const cls = badge({ isLink: true, variant: 'default' });
      expect(cls).toContain('hover:bg-foreground/80');
    });

    it('adds hover:bg-primary/80 for isLink+primary', () => {
      const cls = badge({ isLink: true, variant: 'primary' });
      expect(cls).toContain('hover:bg-primary/80');
    });

    it('adds hover:bg-secondary/80 for isLink+secondary', () => {
      const cls = badge({ isLink: true, variant: 'secondary' });
      expect(cls).toContain('hover:bg-secondary/80');
    });

    it('adds hover:border-border/80 for isLink+outline', () => {
      const cls = badge({ isLink: true, variant: 'outline' });
      expect(cls).toContain('hover:border-border/80');
    });

    it('adds hover:bg-foreground/7 for isLink+ghost', () => {
      const cls = badge({ isLink: true, variant: 'ghost' });
      expect(cls).toContain('hover:bg-foreground/7');
    });

    it('adds hover:bg-info/80 for isLink+info', () => {
      const cls = badge({ isLink: true, variant: 'info' });
      expect(cls).toContain('hover:bg-info/80');
    });

    it('adds hover:bg-success/80 for isLink+success', () => {
      const cls = badge({ isLink: true, variant: 'success' });
      expect(cls).toContain('hover:bg-success/80');
    });

    it('adds hover:bg-warning/80 for isLink+warning', () => {
      const cls = badge({ isLink: true, variant: 'warning' });
      expect(cls).toContain('hover:bg-warning/80');
    });

    it('adds hover:bg-error/80 for isLink+error', () => {
      const cls = badge({ isLink: true, variant: 'error' });
      expect(cls).toContain('hover:bg-error/80');
    });

    it('does NOT add hover classes for non-link default variant', () => {
      const cls = badge({ isLink: false, variant: 'primary' });
      expect(cls).not.toContain('hover:bg-primary/80');
    });
  });

  describe('combined variant + size', () => {
    it('correctly combines primary variant with lg size', () => {
      const cls = badge({ variant: 'primary', size: 'lg' });
      expect(cls).toContain('bg-primary');
      expect(cls).toContain('px-4');
      expect(cls).toContain('text-base');
    });

    it('correctly combines error variant with sm size and isLink', () => {
      const cls = badge({ variant: 'error', size: 'sm', isLink: true });
      expect(cls).toContain('bg-error');
      expect(cls).toContain('px-2.5');
      expect(cls).toContain('cursor-pointer');
      expect(cls).toContain('hover:bg-error/80');
    });
  });
});