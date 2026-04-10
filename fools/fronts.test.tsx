import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import App from "./fronts";

describe("App component (fools/fronts.tsx)", () => {
  it("renders without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it("renders the heading text", () => {
    render(<App />);
    expect(
      screen.getByText("Hello, Tailwind + TypeScript!")
    ).toBeTruthy();
  });

  it("renders the paragraph with the updated text ending in a period", () => {
    render(<App />);
    const para = screen.getByText(
      "This is a sample component styled with Tailwind CSS and written in TypeScript."
    );
    expect(para).toBeTruthy();
  });

  it("does NOT contain the old trailing '...' text from before the PR", () => {
    render(<App />);
    const oldText = screen.queryByText(/TypeScript\.\.\./);
    expect(oldText).toBeNull();
  });

  it("renders an h1 element for the heading", () => {
    const { container } = render(<App />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("Hello, Tailwind + TypeScript!");
  });

  it("renders a paragraph element for the description", () => {
    const { container } = render(<App />);
    const p = container.querySelector("p");
    expect(p).not.toBeNull();
  });

  it("h1 does NOT have the 'ring-3' class that was removed in this PR", () => {
    const { container } = render(<App />);
    const h1 = container.querySelector("h1");
    expect(h1?.className).not.toContain("ring-3");
  });

  it("h1 retains the 'font-bold' and 'text-blue-600' classes", () => {
    const { container } = render(<App />);
    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("font-bold");
    expect(h1?.className).toContain("text-blue-600");
  });

  it("renders a top-level div wrapping everything", () => {
    const { container } = render(<App />);
    const topDiv = container.firstElementChild;
    expect(topDiv?.tagName).toBe("DIV");
  });

  it("applies centering layout classes to the outer container", () => {
    const { container } = render(<App />);
    const topDiv = container.firstElementChild;
    expect(topDiv?.className).toContain("flex");
    expect(topDiv?.className).toContain("items-center");
    expect(topDiv?.className).toContain("justify-center");
  });
});