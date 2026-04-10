import { describe, it, expect } from 'vitest';
import { tv } from 'tailwind-variants';

// The badge tv() configuration from fools/frontend.astro (frontmatter export)
// Re-created here to test the class generation logic in isolation
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

describe('badge tv() configuration (fools/frontend.astro)', () => {
  describe('base classes', () => {
    it('includes base classes in output', () => {
      const cls = badge();
      expect(cls).toContain('starwind-badge');
      expect(cls).toContain('inline-flex');
      expect(cls).toContain('items-center');
      expect(cls).toContain('rounded-full');
      expect(cls).toContain('font-semibold');
    });

    it('includes transition and focus classes', () => {
      const cls = badge();
      expect(cls).toContain('transition-all');
      expect(cls).toContain('outline-none');
      expect(cls).toContain('focus-visible:ring-3');
    });
  });

  describe('default variants', () => {
    it('uses default variant "default" when none specified', () => {
      const cls = badge();
      expect(cls).toContain('bg-foreground');
      expect(cls).toContain('text-background');
    });

    it('uses default size "md" when none specified', () => {
      const cls = badge();
      expect(cls).toContain('px-3');
      expect(cls).toContain('py-0.5');
      expect(cls).toContain('text-sm');
    });

    it('does not include cursor-pointer by default (isLink: false)', () => {
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
      expect(cls).toContain('py-1');
      expect(cls).toContain('text-base');
    });
  });

  describe('isLink compound variants', () => {
    it('adds cursor-pointer when isLink is true', () => {
      const cls = badge({ isLink: true });
      expect(cls).toContain('cursor-pointer');
    });

    it('does not add cursor-pointer when isLink is false', () => {
      const cls = badge({ isLink: false });
      expect(cls).not.toContain('cursor-pointer');
    });

    it('adds hover:bg-foreground/80 for default+isLink', () => {
      const cls = badge({ variant: 'default', isLink: true });
      expect(cls).toContain('hover:bg-foreground/80');
    });

    it('adds hover:bg-primary/80 for primary+isLink', () => {
      const cls = badge({ variant: 'primary', isLink: true });
      expect(cls).toContain('hover:bg-primary/80');
    });

    it('adds hover:bg-success/80 for success+isLink', () => {
      const cls = badge({ variant: 'success', isLink: true });
      expect(cls).toContain('hover:bg-success/80');
    });

    it('adds hover:bg-error/80 for error+isLink', () => {
      const cls = badge({ variant: 'error', isLink: true });
      expect(cls).toContain('hover:bg-error/80');
    });

    it('does NOT add hover classes when isLink is false (no compound match)', () => {
      const cls = badge({ variant: 'primary', isLink: false });
      expect(cls).not.toContain('hover:bg-primary/80');
    });
  });

  describe('combination of variants', () => {
    it('combines primary + lg + isLink correctly', () => {
      const cls = badge({ variant: 'primary', size: 'lg', isLink: true });
      expect(cls).toContain('bg-primary');
      expect(cls).toContain('px-4');
      expect(cls).toContain('text-base');
      expect(cls).toContain('cursor-pointer');
      expect(cls).toContain('hover:bg-primary/80');
    });

    it('combines error + sm without isLink', () => {
      const cls = badge({ variant: 'error', size: 'sm', isLink: false });
      expect(cls).toContain('bg-error');
      expect(cls).toContain('px-2.5');
      expect(cls).not.toContain('cursor-pointer');
      expect(cls).not.toContain('hover:bg-error/80');
    });
  });
});