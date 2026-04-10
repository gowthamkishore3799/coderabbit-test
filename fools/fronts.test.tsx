/**
 * Tests for fools/fronts.tsx (renamed from work.tsx)
 *
 * Changes in this PR:
 * - File renamed from fools/work.tsx to fools/fronts.tsx
 * - Paragraph text changed from "...TypeScript..." to "...TypeScript."
 *   (trailing "..." replaced with ".")
 * - Removed `ring-3` class from the h1 element
 *
 * These tests verify the component structure using React's renderToStaticMarkup
 * (server-side rendering helper, no DOM required).
 *
 * Run (after npm install in fools/ with react added):
 *   node --experimental-strip-types --test fools/fronts.test.tsx
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./fronts.js";

describe("App component (fools/fronts.tsx)", () => {
  it("renders without throwing", () => {
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(App)));
  });

  it("contains the heading text 'Hello, Tailwind + TypeScript!'", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    assert.ok(
      html.includes("Hello, Tailwind + TypeScript!"),
      `Expected heading to be present. Got: ${html}`
    );
  });

  it("paragraph ends with a period, not ellipsis (PR text fix)", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    assert.ok(
      html.includes("written in TypeScript."),
      `Expected period at end of paragraph text. Got: ${html}`
    );
    assert.ok(
      !html.includes("written in TypeScript..."),
      `Expected old ellipsis to be removed. Got: ${html}`
    );
  });

  it("h1 does not contain the removed 'ring-3' class", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    // Ensure ring-3 was removed from the heading (PR change)
    const h1Match = html.match(/<h1[^>]*>/);
    if (h1Match) {
      assert.ok(
        !h1Match[0].includes("ring-3"),
        `Expected 'ring-3' to be removed from h1. Found: ${h1Match[0]}`
      );
    }
  });

  it("renders a single h1 element", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    const h1Count = (html.match(/<h1/g) || []).length;
    assert.equal(h1Count, 1);
  });

  it("renders a paragraph element", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    assert.ok(html.includes("<p"), "Expected a <p> element to be present");
  });
});