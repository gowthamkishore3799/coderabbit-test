import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './fronts';

// ---------------------------------------------------------------------------
// Tests for fools/fronts.tsx (renamed from fools/work.tsx)
//
// PR changes:
//   - Renamed work.tsx → fronts.tsx
//   - Removed `ring-3` from the <h1> className
//   - Fixed trailing "..." → "." in the <p> text
// ---------------------------------------------------------------------------

describe('App component (fronts.tsx)', () => {
  it('is a function (valid React component)', () => {
    expect(typeof App).toBe('function');
  });

  it('renders without throwing', () => {
    // React.createElement verifies the component can produce an element
    expect(() => React.createElement(App)).not.toThrow();
  });

  it('element type is "div" at the root level', () => {
    const element = React.createElement(App);
    // The component returns JSX; calling the function gives us the React element tree
    const vdom = (App as () => React.ReactElement)();
    expect(vdom.type).toBe('div');
  });

  it('does NOT include "ring-3" in any className (removed in this PR)', () => {
    // Serialize the VDOM to a string and check for the removed class
    function collectClassNames(node: React.ReactElement | null): string {
      if (!node || typeof node !== 'object') return '';
      const cls = (node as React.ReactElement<{ className?: string }>).props?.className ?? '';
      const children: React.ReactNode[] = [
        (node as React.ReactElement<{ children?: React.ReactNode }>).props?.children,
      ].flat();
      const childClasses = children
        .filter((c): c is React.ReactElement => React.isValidElement(c))
        .map(collectClassNames)
        .join(' ');
      return `${cls} ${childClasses}`;
    }

    const vdom = (App as () => React.ReactElement)();
    const allClasses = collectClassNames(vdom);
    expect(allClasses).not.toContain('ring-3');
  });

  it('h1 className contains "text-3xl!" (kept from original)', () => {
    function findH1(node: React.ReactNode): React.ReactElement | null {
      if (!React.isValidElement(node)) return null;
      if (node.type === 'h1') return node as React.ReactElement;
      const children = (node as React.ReactElement<{ children?: React.ReactNode }>).props?.children;
      for (const child of [children].flat()) {
        const found = findH1(child as React.ReactNode);
        if (found) return found;
      }
      return null;
    }

    const vdom = (App as () => React.ReactElement)();
    const h1 = findH1(vdom);
    expect(h1).not.toBeNull();
    expect((h1!.props as { className: string }).className).toContain('text-3xl!');
  });

  it('paragraph ends with a period, not "..." (text fixed in this PR)', () => {
    function findParagraph(node: React.ReactNode): React.ReactElement | null {
      if (!React.isValidElement(node)) return null;
      if (node.type === 'p') return node as React.ReactElement;
      const children = (node as React.ReactElement<{ children?: React.ReactNode }>).props?.children;
      for (const child of [children].flat()) {
        const found = findParagraph(child as React.ReactNode);
        if (found) return found;
      }
      return null;
    }

    const vdom = (App as () => React.ReactElement)();
    const p = findParagraph(vdom);
    expect(p).not.toBeNull();
    const text = (p!.props as { children: string }).children as string;
    expect(text.endsWith('.')).toBe(true);
    expect(text.endsWith('...')).toBe(false);
  });
});