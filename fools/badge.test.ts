import { describe, it, expect } from "vitest";
import { tv } from "tailwind-variants";

/**
 * Tests for the badge component configuration defined in frontend.astro.
 * Since .astro files cannot be imported directly in vitest, we replicate the
 * badge tv() config here to verify its class generation logic.
 */
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
    size: { sm: "px-2.5 py-0.5 text-xs", md: "px-3 py-0.5 text-sm", lg: "px-4 py-1 text-base" },
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

describe("badge tv() config (from frontend.astro)", () => {
  describe("base classes", () => {
    it("includes base classes in all outputs", () => {
      const result = badge();
      expect(result).toContain("starwind-badge");
      expect(result).toContain("inline-flex");
      expect(result).toContain("items-center");
      expect(result).toContain("rounded-full");
      expect(result).toContain("font-semibold");
      expect(result).toContain("transition-all");
      expect(result).toContain("outline-none");
      expect(result).toContain("focus-visible:ring-3");
    });
  });

  describe("default variants", () => {
    it("applies 'default' variant when no variant specified", () => {
      const result = badge();
      expect(result).toContain("bg-foreground");
      expect(result).toContain("text-background");
    });

    it("applies 'md' size when no size specified", () => {
      const result = badge();
      expect(result).toContain("px-3");
      expect(result).toContain("py-0.5");
      expect(result).toContain("text-sm");
    });

    it("does not include 'cursor-pointer' when isLink is false (default)", () => {
      const result = badge();
      expect(result).not.toContain("cursor-pointer");
    });
  });

  describe("variant classes", () => {
    it("applies 'primary' variant classes", () => {
      const result = badge({ variant: "primary" });
      expect(result).toContain("bg-primary");
      expect(result).toContain("text-primary-foreground");
    });

    it("applies 'secondary' variant classes", () => {
      const result = badge({ variant: "secondary" });
      expect(result).toContain("bg-secondary");
      expect(result).toContain("text-secondary-foreground");
    });

    it("applies 'outline' variant classes", () => {
      const result = badge({ variant: "outline" });
      expect(result).toContain("border-border");
      expect(result).toContain("border");
    });

    it("applies 'ghost' variant classes", () => {
      const result = badge({ variant: "ghost" });
      expect(result).toContain("bg-foreground/10");
    });

    it("applies 'info' variant classes", () => {
      const result = badge({ variant: "info" });
      expect(result).toContain("bg-info");
      expect(result).toContain("text-info-foreground");
    });

    it("applies 'success' variant classes", () => {
      const result = badge({ variant: "success" });
      expect(result).toContain("bg-success");
      expect(result).toContain("text-success-foreground");
    });

    it("applies 'warning' variant classes", () => {
      const result = badge({ variant: "warning" });
      expect(result).toContain("bg-warning");
      expect(result).toContain("text-warning-foreground");
    });

    it("applies 'error' variant classes", () => {
      const result = badge({ variant: "error" });
      expect(result).toContain("bg-error");
      expect(result).toContain("text-error-foreground");
    });
  });

  describe("size classes", () => {
    it("applies small size classes", () => {
      const result = badge({ size: "sm" });
      expect(result).toContain("px-2.5");
      expect(result).toContain("text-xs");
    });

    it("applies medium size classes", () => {
      const result = badge({ size: "md" });
      expect(result).toContain("px-3");
      expect(result).toContain("text-sm");
    });

    it("applies large size classes", () => {
      const result = badge({ size: "lg" });
      expect(result).toContain("px-4");
      expect(result).toContain("py-1");
      expect(result).toContain("text-base");
    });
  });

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

  describe("compound variants", () => {
    it("adds hover class for isLink+default combination", () => {
      const result = badge({ isLink: true, variant: "default" });
      expect(result).toContain("hover:bg-foreground/80");
    });

    it("adds hover class for isLink+primary combination", () => {
      const result = badge({ isLink: true, variant: "primary" });
      expect(result).toContain("hover:bg-primary/80");
    });

    it("adds hover class for isLink+secondary combination", () => {
      const result = badge({ isLink: true, variant: "secondary" });
      expect(result).toContain("hover:bg-secondary/80");
    });

    it("adds hover class for isLink+outline combination", () => {
      const result = badge({ isLink: true, variant: "outline" });
      expect(result).toContain("hover:border-border/80");
    });

    it("adds hover class for isLink+ghost combination", () => {
      const result = badge({ isLink: true, variant: "ghost" });
      expect(result).toContain("hover:bg-foreground/7");
    });

    it("adds hover class for isLink+info combination", () => {
      const result = badge({ isLink: true, variant: "info" });
      expect(result).toContain("hover:bg-info/80");
    });

    it("adds hover class for isLink+success combination", () => {
      const result = badge({ isLink: true, variant: "success" });
      expect(result).toContain("hover:bg-success/80");
    });

    it("adds hover class for isLink+warning combination", () => {
      const result = badge({ isLink: true, variant: "warning" });
      expect(result).toContain("hover:bg-warning/80");
    });

    it("adds hover class for isLink+error combination", () => {
      const result = badge({ isLink: true, variant: "error" });
      expect(result).toContain("hover:bg-error/80");
    });

    it("does NOT add hover class when isLink is false even with primary variant", () => {
      const result = badge({ isLink: false, variant: "primary" });
      expect(result).not.toContain("hover:bg-primary/80");
    });
  });

  describe("combined variant and size", () => {
    it("correctly combines primary variant with large size", () => {
      const result = badge({ variant: "primary", size: "lg" });
      expect(result).toContain("bg-primary");
      expect(result).toContain("px-4");
      expect(result).toContain("text-base");
    });

    it("correctly combines success variant with small size and isLink", () => {
      const result = badge({ variant: "success", size: "sm", isLink: true });
      expect(result).toContain("bg-success");
      expect(result).toContain("px-2.5");
      expect(result).toContain("cursor-pointer");
      expect(result).toContain("hover:bg-success/80");
    });
  });
});