import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './fronts';

describe('App component (fools/fronts.tsx)', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the heading text', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe('Hello, Tailwind + TypeScript!');
  });

  it('renders the paragraph with correct text ending in a period (not ellipsis)', () => {
    render(<App />);
    const para = screen.getByText(
      'This is a sample component styled with Tailwind CSS and written in TypeScript.'
    );
    expect(para).toBeTruthy();
    // PR changed trailing "..." to "."
    expect(para.textContent).toMatch(/\.$/);
    expect(para.textContent).not.toMatch(/\.\.\.$/);
  });

  it('heading does not have ring-3 class (removed in PR)', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).not.toContain('ring-3');
  });

  it('heading retains expected Tailwind classes after PR', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('text-blue-600');
    expect(heading.className).toContain('font-bold');
    expect(heading.className).toContain('text-3xl');
  });

  it('renders a top-level div with centering classes', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('flex');
    expect(outerDiv.className).toContain('items-center');
    expect(outerDiv.className).toContain('justify-center');
    expect(outerDiv.className).toContain('min-h-screen');
  });

  it('renders the card div with rounded corners and shadow', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    const card = heading.closest('div');
    expect(card?.className).toContain('rounded-2xl');
    expect(card?.className).toContain('shadow-lg');
  });

  it('renders exactly one h1 element', () => {
    const { container } = render(<App />);
    const headings = container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
  });

  it('renders exactly one paragraph element', () => {
    const { container } = render(<App />);
    const paras = container.querySelectorAll('p');
    expect(paras).toHaveLength(1);
  });
});