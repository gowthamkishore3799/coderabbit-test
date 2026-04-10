/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './fronts';

describe('App component (fools/fronts.tsx)', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the heading text', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText('Hello, Tailwind + TypeScript!')).toBeDefined();
  });

  it('displays the paragraph text (updated in PR: trailing "..." removed)', () => {
    render(<App />);
    expect(
      screen.getByText(
        'This is a sample component styled with Tailwind CSS and written in TypeScript.'
      )
    ).toBeDefined();
  });

  it('does NOT contain the old trailing ellipsis text', () => {
    render(<App />);
    const paragraph = screen.getByText(/This is a sample component/);
    expect(paragraph.textContent).not.toMatch(/\.\.\.$/);
  });

  it('heading has blue text class', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-blue-600');
  });

  it('heading does NOT have ring-3 class (removed in PR)', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).not.toContain('ring-3');
  });

  it('outer container has centering layout classes', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('flex');
    expect(outerDiv.className).toContain('items-center');
    expect(outerDiv.className).toContain('justify-center');
  });
});