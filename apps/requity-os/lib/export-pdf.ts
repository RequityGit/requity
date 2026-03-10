import { toast } from "sonner";

/**
 * Detect whether a CSS color value is "light" (close to white).
 * Returns true for white, near-white, transparent, CSS variables, and
 * any rgb/hsl value whose lightness is above 85%.
 */
function isLightColor(color: string): boolean {
  const c = color.trim().toLowerCase();

  // CSS variables or currentColor -- can't evaluate; treat as dark-mode suspect
  if (c.startsWith("var(") || c === "currentcolor") return true;
  // Transparent is effectively "no color"
  if (c === "transparent" || c === "inherit" || c === "unset" || c === "initial") return true;

  // Named white-ish colors
  if (["white", "#fff", "#ffffff", "#fefefe", "#fafafa", "#f5f5f5"].includes(c)) return true;

  // 3/4/6/8-digit hex
  const hexMatch = c.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length === 4) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Perceived brightness > 85% of max
    return (r * 299 + g * 587 + b * 114) / 1000 > 217;
  }

  // rgb/rgba
  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    return (r * 299 + g * 587 + b * 114) / 1000 > 217;
  }

  // hsl/hsla
  const hslMatch = c.match(/hsla?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*([\d.]+)%/);
  if (hslMatch) {
    return Number(hslMatch[1]) > 85;
  }

  return false;
}

/**
 * Strip inline color styles that would appear "light" (white/near-white)
 * from HTML content. This prevents dark-mode text colors from bleeding
 * into the PDF output.
 *
 * Preserves intentional dark colors (red, blue, etc.).
 */
function sanitizeHtmlColorsForPdf(html: string): string {
  // Match style attributes and remove color declarations that are light
  return html.replace(/\bstyle="([^"]*)"/gi, (_match, styleContent: string) => {
    const sanitized = styleContent
      .split(";")
      .map((decl: string) => {
        const trimmed = decl.trim();
        if (!trimmed) return "";
        // Check if this is a color (not background-color) declaration
        const colorMatch = trimmed.match(/^color\s*:\s*(.+)$/i);
        if (colorMatch && isLightColor(colorMatch[1])) {
          // Replace light color with dark
          return "color: #1a1a1a";
        }
        // Check background / background-color for dark values
        const bgMatch = trimmed.match(/^background(?:-color)?\s*:\s*(.+)$/i);
        if (bgMatch) {
          const bgVal = bgMatch[1].trim().toLowerCase();
          // Strip dark backgrounds (near-black)
          if (
            bgVal === "black" ||
            bgVal === "#000" ||
            bgVal === "#000000" ||
            bgVal === "#0a0a0a" ||
            bgVal === "#111" ||
            bgVal === "#111111" ||
            bgVal.match(/^#[0-2][0-2a-f][0-2][0-2a-f][0-2][0-2a-f]$/i) ||
            bgVal.match(/^rgb\(\s*\d{1,2}\s*,\s*\d{1,2}\s*,\s*\d{1,2}\s*\)$/)
          ) {
            return "";
          }
        }
        return trimmed;
      })
      .filter(Boolean)
      .join("; ");
    return sanitized ? `style="${sanitized}"` : "";
  });
}

/**
 * CSS styles for PDF rendering. Applied inside an isolated iframe
 * so that the parent page's dark mode styles cannot interfere.
 * Uses !important on color properties to override any remaining inline styles.
 */
const PDF_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: #ffffff !important;
    color: #1a1a1a !important;
    color-scheme: light !important;
    font-size: 0.875rem;
    line-height: 1.625;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    width: 816px;
    padding: 0;
  }
  p, span, li, td, th, div, strong, em, u, s, b, i, label { color: #1a1a1a !important; }
  a { color: #2563eb !important; }
  h1 { font-size: 1.5rem; font-weight: 700; line-height: 1.25; margin-top: 1.5em; margin-bottom: 0.5em; color: #111 !important; }
  h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; margin-top: 1.25em; margin-bottom: 0.4em; color: #111 !important; }
  h3 { font-size: 1.125rem; font-weight: 600; line-height: 1.35; margin-top: 1em; margin-bottom: 0.3em; color: #111 !important; }
  ul { list-style-type: disc; padding-left: 1.5em; }
  ol { list-style-type: decimal; padding-left: 1.5em; }
  li { margin-top: 0.25em; }
  blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; color: #4b5563 !important; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #d1d5db; padding: 0.5em 0.75em; text-align: left; vertical-align: top; }
  th { background: #f9fafb !important; font-weight: 600; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
  img { max-width: 100%; height: auto; }
  [data-merge-field] { font-weight: 700; background: none !important; border: none; padding: 0; color: #1a1a1a !important; }
`;

/** Shared html2pdf options. */
function getPdfOptions(filename?: string) {
  return {
    margin: [0.7, 0.75, 0.7, 0.75] as number[],
    ...(filename ? { filename } : {}),
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "in",
      format: "letter",
      orientation: "portrait",
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };
}

/**
 * Create a hidden iframe with isolated styles for PDF rendering.
 * Returns the iframe element and the body element to render from.
 */
async function createPdfIframe(htmlContent: string): Promise<{
  iframe: HTMLIFrameElement;
  body: HTMLElement;
}> {
  // Sanitize dark-mode colors from the HTML before rendering
  const cleanHtml = sanitizeHtmlColorsForPdf(htmlContent);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "816px";
  iframe.style.height = "1056px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error("Could not access iframe document");

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light" />
  <style>${PDF_STYLES}</style>
</head>
<body>${cleanHtml}</body>
</html>`);
  iframeDoc.close();

  // Wait for images to load
  const images = iframeDoc.querySelectorAll("img");
  if (images.length > 0) {
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  }

  return { iframe, body: iframeDoc.body };
}

/**
 * Generate a PDF Blob from HTML content (for use as an email attachment).
 * Does NOT trigger a download. Uses an isolated iframe for rendering.
 */
export async function generatePdfBlob(htmlContent: string): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;
  const { iframe, body } = await createPdfIframe(htmlContent);

  try {
    const worker = html2pdf()
      .set(getPdfOptions() as Record<string, unknown>)
      .from(body);

    const blob: Blob = await worker.outputPdf("blob");
    return blob;
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Export HTML content as a PDF file download.
 * Uses html2pdf.js (jsPDF + html2canvas) for client-side conversion.
 *
 * Renders inside a hidden iframe to fully isolate from the parent page's
 * dark-mode Tailwind styles, which otherwise cause white-on-white text.
 */
export async function exportHtmlAsPdf(
  htmlContent: string,
  filename: string
): Promise<void> {
  const toastId = toast.loading("Generating PDF...");

  let iframe: HTMLIFrameElement | null = null;

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const result = await createPdfIframe(htmlContent);
    iframe = result.iframe;

    const safeName = filename
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9_\- ]/g, "_");

    await html2pdf()
      .set(getPdfOptions(`${safeName}.pdf`) as Record<string, unknown>)
      .from(result.body)
      .save();

    toast.success("PDF downloaded", { id: toastId });
  } catch (err) {
    console.error("PDF export failed:", err);
    toast.error("Failed to generate PDF", { id: toastId });
  } finally {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}
