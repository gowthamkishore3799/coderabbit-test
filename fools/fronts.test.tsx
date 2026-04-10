import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "./fronts";

// fools/fronts.tsx was renamed from fools/work.tsx and the paragraph text was
// corrected ("..." trailing ellipsis removed, "ring-3" class removed from h1).
// These tests verify the rendered output reflects those changes.

describe("App component (fools/fronts.tsx)", () => {
  it("renders without crashing", () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it("displays the expected heading text", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Hello, Tailwind \+ TypeScript!/i })
    ).toBeDefined();
  });

  it("displays the corrected paragraph text (no trailing ellipsis)", () => {
    render(<App />);
    const paragraph = screen.getByText(
      "This is a sample component styled with Tailwind CSS and written in TypeScript."
    );
    expect(paragraph).toBeDefined();
  });

  it("does NOT render the old trailing-ellipsis paragraph text", () => {
    render(<App />);
    const old = screen.queryByText(
      /This is a sample component styled with Tailwind CSS and written in TypeScript\.\.\./
    );
    expect(old).toBeNull();
  });

  it("heading does not contain the removed ring-3 class", () => {
    const { container } = render(<App />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.className).not.toContain("ring-3");
  });

  it("renders a single h1 element", () => {
    const { container } = render(<App />);
    const headings = container.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
  });

  it("renders a single paragraph element", () => {
    const { container } = render(<App />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
  });

  it("applies text-blue-600 class to the heading", () => {
    const { container } = render(<App />);
    const h1 = container.querySelector("h1");
    expect(h1!.className).toContain("text-blue-600");
  });

  it("wraps content in a full-screen centering div", () => {
    const { container } = render(<App />);
    const outer = container.firstElementChild;
    expect(outer!.className).toContain("min-h-screen");
  });
});