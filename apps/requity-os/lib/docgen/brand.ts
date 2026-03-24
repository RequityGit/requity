import type { BrandConfig, LogoData } from "./types";

// ─── Brand Constants (for generated PPTX/DOCX only, NOT portal UI) ───

export const BRAND: BrandConfig = {
  navy: "0C1C30",
  gold: "B89D5C",
  cream: "F5F3EE",
  white: "FFFFFF",
  darkText: "1A1A1A",
  gray: "666666",
  lightGray: "E8E8E8",
  headingFont: "Georgia",
  bodyFont: "Calibri",
};

// Logo URLs from Supabase Storage
const WHITE_LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";
const COLOR_LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20Color.svg";

/**
 * Convert an SVG URL to a PNG data URL via Canvas.
 * Preserves native aspect ratio. Scale controls resolution (2x = retina).
 */
export async function loadLogo(
  url: string,
  scale = 2
): Promise<LogoData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth * scale;
      c.height = img.naturalHeight * scale;
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve({
        data: c.toDataURL("image/png"),
        aspect: img.naturalWidth / img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error("Failed to load logo: " + url));
    img.src = url;
  });
}

/** Load the white logo (for dark backgrounds) */
export function loadWhiteLogo(): Promise<LogoData> {
  return loadLogo(WHITE_LOGO_URL);
}

/** Load the color logo (for light backgrounds) */
export function loadColorLogo(): Promise<LogoData> {
  return loadLogo(COLOR_LOGO_URL);
}

/**
 * Place a logo on a PptxGenJS slide with correct aspect ratio.
 * Height is specified; width is derived from native aspect.
 * NEVER use sizing: { type: "contain" } as it distorts proportions.
 */
export function placeLogo(
  slide: { addImage: (opts: Record<string, unknown>) => void },
  logo: LogoData | null,
  x: number,
  y: number,
  h: number
): void {
  if (!logo) return;
  const w = h * logo.aspect;
  slide.addImage({ data: logo.data, x, y, w, h });
}
