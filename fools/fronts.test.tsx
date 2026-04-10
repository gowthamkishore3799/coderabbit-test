import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './fronts';

// ---------------------------------------------------------------------------
// Tests for fools/fronts.tsx (renamed from fools/work.tsx)
//
// Changes in this PR:
//  - Removed ring-3 class from the <h1> element
//  - Changed the <p> text from "...TypeScript..." to "...TypeScript."
// ---------------------------------------------------------------------------

describe('App component (fools/fronts.tsx)', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('renders the heading text', () => {
    render(<App />);
    expect(
      screen.getByText('Hello, Tailwind + TypeScript!')
    ).toBeDefined();
  });

  it('renders the paragraph text ending with a period (not "...")', () => {
    render(<App />);
    const paragraph = screen.getByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(paragraph).toBeDefined();
  });

  it('paragraph text does not end with "..."', () => {
    render(<App />);
    const paragraph = screen.getByText(/TypeScript/);
    expect(paragraph.textContent).not.toMatch(/\.\.\.$/);
  });

  it('heading does NOT have ring-3 class (removed in this PR)', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).not.toContain('ring-3');
  });

  it('heading has text-3xl! class', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-3xl!');
  });

  it('heading has the expected Tailwind classes', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('font-bold');
    expect(heading.className).toContain('text-blue-600');
  });

  it('renders an h1 tag for the heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.tagName).toBe('H1');
  });

  it('renders a paragraph element', () => {
    render(<App />);
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  it('outer container has centering classes', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('flex');
    expect(outerDiv.className).toContain('items-center');
    expect(outerDiv.className).toContain('justify-center');
  });
});