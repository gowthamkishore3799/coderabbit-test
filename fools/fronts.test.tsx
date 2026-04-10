import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './fronts';

describe('App component (fools/fronts.tsx)', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the heading "Hello, Tailwind + TypeScript!"', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Hello, Tailwind + TypeScript!');
  });

  it('displays the paragraph text ending with a period (not "...")', () => {
    render(<App />);
    const para = screen.getByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(para).toBeDefined();
    expect(para.textContent).toBe(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
  });

  it('heading does not contain ring-3 class (removed in PR)', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).not.toContain('ring-3');
  });

  it('heading contains expected Tailwind classes', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('font-bold');
    expect(heading.className).toContain('text-blue-600');
  });

  it('outer wrapper has correct layout classes', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('flex');
    expect(outerDiv.className).toContain('items-center');
    expect(outerDiv.className).toContain('justify-center');
  });

  it('paragraph has text-gray-700 class', () => {
    render(<App />);
    const para = screen.getByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(para.className).toContain('text-gray-700');
  });
});