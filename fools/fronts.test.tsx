import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./fronts";

describe("App component", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("renders the heading with correct text", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("Hello, Tailwind + TypeScript!");
  });

  it("renders a paragraph with expected content", () => {
    render(<App />);
    const paragraph = screen.getByText(
      "This is a sample component styled with Tailwind CSS and written in TypeScript."
    );
    expect(paragraph).toBeTruthy();
  });

  it("paragraph text does not include trailing ellipsis", () => {
    render(<App />);
    // The PR diff removed "..." from the paragraph text
    const paragraph = screen.getByText(
      "This is a sample component styled with Tailwind CSS and written in TypeScript."
    );
    expect(paragraph.textContent).not.toContain("...");
    expect(paragraph.textContent).toMatch(/TypeScript\.$/);
  });

  it("heading does not have ring-3 CSS class", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    // The PR diff removed ring-3 from the className
    expect(heading.className).not.toContain("ring-3");
  });

  it("heading has expected Tailwind classes", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).toContain("text-blue-600");
    expect(heading.className).toContain("mb-4");
  });

  it("outer wrapper has full screen centering classes", () => {
    render(<App />);
    // The outer div should have min-h-screen flex centering
    const outerDiv = screen.getByRole("heading", { level: 1 }).closest("div")?.parentElement;
    expect(outerDiv?.className).toContain("min-h-screen");
    expect(outerDiv?.className).toContain("flex");
  });

  it("card wrapper has expected styling classes", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    const card = heading.closest("div");
    expect(card?.className).toContain("bg-white");
    expect(card?.className).toContain("rounded-2xl");
    expect(card?.className).toContain("shadow-lg");
  });
});