import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./fronts";

// fools/fronts.tsx was renamed from work.tsx in this PR.
// Changes made:
//   - Removed `ring-3` class from the <h1> element
//   - Changed trailing "..." in paragraph to "." (complete sentence)
//   - Added a newline at end of file
describe("fools/fronts.tsx – App component", () => {
  it("renders without crashing", () => {
    render(<App />);
  });

  it("renders the heading text", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("renders the correct heading content", () => {
    render(<App />);
    const heading = screen.getByText("Hello, Tailwind + TypeScript!");
    expect(heading).toBeDefined();
  });

  it("renders the paragraph text ending with a period (PR change: '...' -> '.')", () => {
    render(<App />);
    const para = screen.getByText(
      "This is a sample component styled with Tailwind CSS and written in TypeScript."
    );
    expect(para).toBeDefined();
  });

  it("paragraph does not end with ellipsis (old text removed in PR)", () => {
    render(<App />);
    const elements = screen.queryAllByText(/TypeScript\.\.\./);
    expect(elements).toHaveLength(0);
  });

  it("heading does not have ring-3 class (removed in PR)", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).not.toContain("ring-3");
  });

  it("heading retains font-bold and text-blue-600 classes", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).toContain("text-blue-600");
  });

  it("renders within a centered layout container", () => {
    const { container } = render(<App />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("flex");
    expect(outerDiv.className).toContain("min-h-screen");
  });
});