/**
 * Tests for fools/fronts.tsx (renamed from fools/work.tsx in this PR).
 *
 * PR changes:
 *  - Removed `ring-3` class from the h1 element.
 *  - Changed paragraph text from "TypeScript..." (trailing ellipsis) to
 *    "TypeScript." (trailing period).
 *  - Added a trailing newline.
 *
 * Tests use React's renderToStaticMarkup (no DOM required) to verify the
 * rendered output of the App component matches the updated content.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../fools/fronts.tsx';

function render(): string {
  return renderToStaticMarkup(React.createElement(App));
}

// ── basic rendering ───────────────────────────────────────────────────────────

describe('App component', () => {
  test('renders without throwing', () => {
    assert.doesNotThrow(() => render());
  });

  test('exports a function (React component)', () => {
    assert.equal(typeof App, 'function');
  });

  test('renders non-empty HTML', () => {
    const html = render();
    assert.ok(html.length > 0, 'Rendered HTML should not be empty');
  });
});

// ── heading content (PR change: removed ring-3 class) ────────────────────────

describe('App heading', () => {
  test('renders the h1 heading with correct text', () => {
    const html = render();
    assert.ok(
      html.includes('Hello, Tailwind + TypeScript!'),
      `Expected heading "Hello, Tailwind + TypeScript!" in: ${html}`,
    );
  });

  test('heading does not include ring-3 class (removed in PR)', () => {
    const html = render();
    assert.ok(
      !html.includes('ring-3'),
      `Expected ring-3 to be removed but found it in: ${html}`,
    );
  });

  test('heading retains text-3xl! font-bold text-blue-600 mb-4 classes', () => {
    const html = render();
    assert.ok(html.includes('text-3xl!'), 'Missing text-3xl!');
    assert.ok(html.includes('font-bold'), 'Missing font-bold');
    assert.ok(html.includes('text-blue-600'), 'Missing text-blue-600');
    assert.ok(html.includes('mb-4'), 'Missing mb-4');
  });
});

// ── paragraph content (PR change: "TypeScript..." -> "TypeScript.") ──────────

describe('App paragraph', () => {
  test('renders the paragraph with the updated text (ends with period, not ellipsis)', () => {
    const html = render();
    const updatedText =
      'This is a sample component styled with Tailwind CSS and written in TypeScript.';
    assert.ok(
      html.includes(updatedText),
      `Expected updated paragraph text in: ${html}`,
    );
  });

  test('does not contain the old text with trailing ellipsis (pre-PR)', () => {
    const html = render();
    const oldText =
      'This is a sample component styled with Tailwind CSS and written in TypeScript...';
    assert.ok(
      !html.includes(oldText),
      'Old text with trailing ellipsis should have been removed',
    );
  });

  test('paragraph has text-gray-700 class', () => {
    const html = render();
    assert.ok(html.includes('text-gray-700'), 'Missing text-gray-700 class on paragraph');
  });
});

// ── layout structure ──────────────────────────────────────────────────────────

describe('App layout', () => {
  test('renders an outer div with flex centering classes', () => {
    const html = render();
    assert.ok(html.includes('flex'), 'Missing flex class');
    assert.ok(html.includes('items-center'), 'Missing items-center class');
    assert.ok(html.includes('justify-center'), 'Missing justify-center class');
    assert.ok(html.includes('min-h-screen'), 'Missing min-h-screen class');
  });

  test('renders an inner card with white background', () => {
    const html = render();
    assert.ok(html.includes('bg-white'), 'Missing bg-white class on card');
    assert.ok(html.includes('rounded-2xl'), 'Missing rounded-2xl class');
    assert.ok(html.includes('shadow-lg'), 'Missing shadow-lg class');
  });
});