// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import App from './fronts';

afterEach(() => {
  cleanup();
});

describe('App component (fools/fronts.tsx)', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('renders exactly one heading element', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(1);
  });

  it('displays the correct heading content', () => {
    render(<App />);
    const heading = screen.getAllByText('Hello, Tailwind + TypeScript!');
    expect(heading.length).toBeGreaterThan(0);
  });

  it('renders the paragraph description text', () => {
    render(<App />);
    const paragraph = screen.getAllByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(paragraph.length).toBeGreaterThan(0);
  });

  it('heading is an h1 element', () => {
    const { container } = render(<App />);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
  });

  it('does not contain the old text with trailing ellipsis (regression: text ends with period not ...)', () => {
    const { container } = render(<App />);
    const text = container.textContent || '';
    expect(text).not.toContain('TypeScript...');
  });

  it('paragraph text ends with a period, not ellipsis', () => {
    const { container } = render(<App />);
    const p = container.querySelector('p');
    expect(p?.textContent).toMatch(/TypeScript\.$/);
  });

  it('heading does not contain ring-3 class (regression: removed in PR)', () => {
    const { container } = render(<App />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).not.toContain('ring-3');
  });
});