import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './fronts';

describe('App component (fools/fronts.tsx)', () => {
  it('renders the heading with correct text', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toBe('Hello, Tailwind + TypeScript!');
  });

  it('renders the paragraph with the correct text (period not ellipsis, PR change)', () => {
    render(<App />);
    const paragraph = screen.getByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(paragraph).toBeDefined();
  });

  it('does not render the old ellipsis text that was present before this PR', () => {
    render(<App />);
    const oldText = screen.queryByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript...'
    );
    expect(oldText).toBeNull();
  });

  it('renders a top-level div container', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstElementChild;
    expect(outerDiv?.tagName).toBe('DIV');
  });

  it('heading has the correct CSS classes (no ring-3, PR change)', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-3xl!');
    expect(heading.className).toContain('font-bold');
    expect(heading.className).not.toContain('ring-3');
  });
});