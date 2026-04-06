type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, "");
  const int = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.min(255, Math.round(v + 255 * amount));
  return rgbToHex({ r: clamp(r), g: clamp(g), b: clamp(b) });
}

function darken(hex: string, amount: number): string {
  return lighten(hex, -amount);
}

function mix(hex1: string, hex2: string, weight = 0.5): string {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  return rgbToHex({
    r: Math.round(a.r * weight + b.r * (1 - weight)),
    g: Math.round(a.g * weight + b.g * (1 - weight)),
    b: Math.round(a.b * weight + b.b * (1 - weight)),
  });
}

export { hexToRgb, rgbToHex, rgbToHsl, lighten, darken, mix, RGB, HSL };
