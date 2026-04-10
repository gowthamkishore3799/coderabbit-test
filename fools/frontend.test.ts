/**
 * Tests for the `badge` tailwind-variants (tv) function defined in frontend.astro.
 *
 * The badge configuration is exported from the Astro frontmatter and mirrors the
 * exact tv() definition in frontend.astro. To avoid Astro's build-pipeline
 * requirement in unit tests, the badge configuration is recreated here from the
 * same source-of-truth parameters so that variant class generation logic can be
 * exercised in a plain Node.js context.
 *
 * Run with: vitest run fools/frontend.test.ts
 */
import { describe, it, expect } from "vitest";
import { tv } from "tailwind-variants";

// Mirror of the badge tv() config from frontend.astro – kept in sync with the file.
const badge = tv({
  base: [
    "starwind-badge inline-flex items-center rounded-full font-semibold",
    "transition-all outline-none focus-visible:ring-3",
  ],
  variants: {
    variant: {
      default: "bg-foreground text-background focus-visible:ring-outline/50",
      primary: "bg-primary text-primary-foreground focus-visible:ring-primary/50",
      secondary: "bg-secondary text-secondary-foreground focus-visible:ring-secondary/50",
      outline: "border-border focus-visible:border-outline focus-visible:ring-outline/50 border",
      ghost: "bg-foreground/10 text-foreground focus-visible:ring-outline/50",
      info: "bg-info text-info-foreground focus-visible:ring-info/50",
      success: "bg-success text-success-foreground focus-visible:ring-success/50",
      warning: "bg-warning text-warning-foreground focus-visible:ring-warning/50",
      error: "bg-error text-error-foreground focus-visible:ring-error/50",
    },
    size: {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-0.5 text-sm",
      lg: "px-4 py-1 text-base",
    },
    isLink: { true: "cursor-pointer", false: "" },
  },
  compoundVariants: [
    { isLink: true, variant: "default", className: "hover:bg-foreground/80" },
    { isLink: true, variant: "primary", className: "hover:bg-primary/80" },
    { isLink: true, variant: "secondary", className: "hover:bg-secondary/80" },
    { isLink: true, variant: "outline", className: "hover:border-border/80" },
    { isLink: true, variant: "ghost", className: "hover:bg-foreground/7" },
    { isLink: true, variant: "info", className: "hover:bg-info/80" },
    { isLink: true, variant: "success", className: "hover:bg-success/80" },
    { isLink: true, variant: "warning", className: "hover:bg-warning/80" },
    { isLink: true, variant: "error", className: "hover:bg-error/80" },
  ],
  defaultVariants: { variant: "default", size: "md", isLink: false },
});

describe("badge (tailwind-variants config from frontend.astro)", () => {
  // --- base classes ---
  describe("base classes", () => {
    it("always includes the starwind-badge marker class", () => {
      expect(badge()).toContain("starwind-badge");
    });

    it("always includes inline-flex for layout", () => {
      expect(badge()).toContain("inline-flex");
    });

    it("always includes rounded-full for pill shape", () => {
      expect(badge()).toContain("rounded-full");
    });

    it("always includes font-semibold", () => {
      expect(badge()).toContain("font-semibold");
    });

    it("always includes transition-all for smooth transitions", () => {
      expect(badge()).toContain("transition-all");
    });

    it("always includes focus-visible:ring-3 for accessibility ring", () => {
      expect(badge()).toContain("focus-visible:ring-3");
    });
  });

  // --- default variants ---
  describe("default variants (variant=default, size=md, isLink=false)", () => {
    it("applies default variant classes when no variant is specified", () => {
      const result = badge();
      expect(result).toContain("bg-foreground");
      expect(result).toContain("text-background");
    });

    it("applies md size classes by default", () => {
      const result = badge();
      expect(result).toContain("px-3");
      expect(result).toContain("py-0.5");
      expect(result).toContain("text-sm");
    });

    it("does not include cursor-pointer when isLink defaults to false", () => {
      const result = badge();
      expect(result).not.toContain("cursor-pointer");
    });
  });

  // --- variant classes ---
  describe("variant classes", () => {
    it.each([
      ["default", "bg-foreground"],
      ["primary", "bg-primary"],
      ["secondary", "bg-secondary"],
      ["outline", "border-border"],
      ["ghost", "bg-foreground/10"],
      ["info", "bg-info"],
      ["success", "bg-success"],
      ["warning", "bg-warning"],
      ["error", "bg-error"],
    ] as const)("variant '%s' includes expected class '%s'", (variant, cls) => {
      const result = badge({ variant });
      expect(result).toContain(cls);
    });

    it("primary variant includes text-primary-foreground", () => {
      expect(badge({ variant: "primary" })).toContain("text-primary-foreground");
    });

    it("outline variant includes border class", () => {
      expect(badge({ variant: "outline" })).toContain("border");
    });

    it("error variant includes error-foreground text class", () => {
      expect(badge({ variant: "error" })).toContain("text-error-foreground");
    });
  });

  // --- size classes ---
  describe("size classes", () => {
    it("sm size uses text-xs and narrow padding", () => {
      const result = badge({ size: "sm" });
      expect(result).toContain("text-xs");
      expect(result).toContain("px-2.5");
      expect(result).toContain("py-0.5");
    });

    it("md size uses text-sm and standard padding", () => {
      const result = badge({ size: "md" });
      expect(result).toContain("text-sm");
      expect(result).toContain("px-3");
    });

    it("lg size uses text-base and wide padding", () => {
      const result = badge({ size: "lg" });
      expect(result).toContain("text-base");
      expect(result).toContain("px-4");
      expect(result).toContain("py-1");
    });
  });

  // --- isLink classes ---
  describe("isLink variant", () => {
    it("adds cursor-pointer when isLink is true", () => {
      const result = badge({ isLink: true });
      expect(result).toContain("cursor-pointer");
    });

    it("does not add cursor-pointer when isLink is false", () => {
      const result = badge({ isLink: false });
      expect(result).not.toContain("cursor-pointer");
    });
  });

  // --- compound variants ---
  describe("compound variants (isLink + variant combinations)", () => {
    it.each([
      ["default", "hover:bg-foreground/80"],
      ["primary", "hover:bg-primary/80"],
      ["secondary", "hover:bg-secondary/80"],
      ["outline", "hover:border-border/80"],
      ["ghost", "hover:bg-foreground/7"],
      ["info", "hover:bg-info/80"],
      ["success", "hover:bg-success/80"],
      ["warning", "hover:bg-warning/80"],
      ["error", "hover:bg-error/80"],
    ] as const)(
      "when isLink=true and variant='%s', adds '%s'",
      (variant, hoverClass) => {
        const result = badge({ isLink: true, variant });
        expect(result).toContain(hoverClass);
      }
    );

    it("does NOT add hover class when isLink is false", () => {
      const result = badge({ isLink: false, variant: "primary" });
      expect(result).not.toContain("hover:bg-primary/80");
    });
  });

  // --- custom className merging ---
  describe("custom className", () => {
    it("includes an extra className passed to the function", () => {
      const result = badge({ class: "my-custom-class" });
      expect(result).toContain("my-custom-class");
    });

    it("still includes base classes when a custom class is provided", () => {
      const result = badge({ class: "extra" });
      expect(result).toContain("starwind-badge");
    });
  });

  // --- regression / boundary ---
  describe("boundary and regression tests", () => {
    it("returns a non-empty string for every valid variant combination", () => {
      const variants = ["default", "primary", "secondary", "outline", "ghost", "info", "success", "warning", "error"] as const;
      const sizes = ["sm", "md", "lg"] as const;
      for (const variant of variants) {
        for (const size of sizes) {
          const result = badge({ variant, size });
          expect(typeof result).toBe("string");
          expect(result.length).toBeGreaterThan(0);
        }
      }
    });

    it("badge called with no arguments returns a string (uses all defaults)", () => {
      expect(typeof badge()).toBe("string");
    });
  });
});