import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './fronts';

describe('App component (fronts.tsx)', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('renders the heading text', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('heading contains "Hello, Tailwind + TypeScript!"', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Hello, Tailwind + TypeScript!');
  });

  it('renders the paragraph text ending with a period (not ellipsis)', () => {
    render(<App />);
    // PR changed "TypeScript..." to "TypeScript." — verify the period
    const paragraph = screen.getByText(/This is a sample component styled with Tailwind CSS and written in TypeScript\./);
    expect(paragraph).toBeTruthy();
  });

  it('paragraph text does not end with an ellipsis (...)', () => {
    render(<App />);
    const paragraphs = screen.getAllByText(/TypeScript/);
    const pTag = paragraphs.find(el => el.tagName === 'P');
    expect(pTag?.textContent).not.toContain('...');
    expect(pTag?.textContent).toMatch(/TypeScript\.$/);
  });

  it('heading does not contain ring-3 class (removed in PR)', () => {
    const { container } = render(<App />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).not.toContain('ring-3');
  });

  it('heading retains expected Tailwind classes', () => {
    const { container } = render(<App />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('font-bold');
    expect(h1?.className).toContain('text-blue-600');
  });

  it('renders a wrapper div with correct layout classes', () => {
    const { container } = render(<App />);
    const outerDiv = container.querySelector('div');
    expect(outerDiv?.className).toContain('flex');
    expect(outerDiv?.className).toContain('min-h-screen');
  });
});