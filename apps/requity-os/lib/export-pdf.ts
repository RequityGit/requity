import { toast } from "sonner";

/**
 * Export HTML content as a PDF file download.
 * Uses html2pdf.js (jsPDF + html2canvas) for client-side conversion.
 */
export async function exportHtmlAsPdf(
  htmlContent: string,
  filename: string
): Promise<void> {
  const toastId = toast.loading("Generating PDF...");

  try {
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import("html2pdf.js")).default;

    // Create an off-screen container with document styles
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "816px";
    container.style.padding = "0";
    container.style.background = "white";
    container.style.color = "#1a1a1a";
    container.style.fontSize = "0.875rem";
    container.style.lineHeight = "1.625";
    container.style.fontFamily =
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    container.innerHTML = htmlContent;

    // Apply inline styles to match TipTap editor rendering
    applyDocumentStyles(container);

    document.body.appendChild(container);

    const safeName = filename.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_\- ]/g, "_");

    const opts = {
      margin: [0.7, 0.75, 0.7, 0.75] as number[], // top, left, bottom, right (inches)
      filename: `${safeName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf()
      .set(opts as Record<string, unknown>)
      .from(container)
      .save();

    document.body.removeChild(container);
    toast.success("PDF downloaded", { id: toastId });
  } catch (err) {
    console.error("PDF export failed:", err);
    toast.error("Failed to generate PDF", { id: toastId });
  }
}

/** Apply inline styles to the container to match the editor canvas rendering. */
function applyDocumentStyles(container: HTMLElement) {
  // Headings
  container.querySelectorAll<HTMLElement>("h1").forEach((el) => {
    el.style.fontSize = "1.5rem";
    el.style.fontWeight = "700";
    el.style.lineHeight = "1.25";
    el.style.marginTop = "1.5em";
    el.style.marginBottom = "0.5em";
    el.style.color = "#111";
  });
  container.querySelectorAll<HTMLElement>("h2").forEach((el) => {
    el.style.fontSize = "1.25rem";
    el.style.fontWeight = "600";
    el.style.lineHeight = "1.3";
    el.style.marginTop = "1.25em";
    el.style.marginBottom = "0.4em";
    el.style.color = "#111";
  });
  container.querySelectorAll<HTMLElement>("h3").forEach((el) => {
    el.style.fontSize = "1.125rem";
    el.style.fontWeight = "600";
    el.style.lineHeight = "1.35";
    el.style.marginTop = "1em";
    el.style.marginBottom = "0.3em";
    el.style.color = "#111";
  });

  // Lists
  container.querySelectorAll<HTMLElement>("ul").forEach((el) => {
    el.style.listStyleType = "disc";
    el.style.paddingLeft = "1.5em";
  });
  container.querySelectorAll<HTMLElement>("ol").forEach((el) => {
    el.style.listStyleType = "decimal";
    el.style.paddingLeft = "1.5em";
  });
  container.querySelectorAll<HTMLElement>("li").forEach((el) => {
    el.style.marginTop = "0.25em";
  });

  // Blockquotes
  container.querySelectorAll<HTMLElement>("blockquote").forEach((el) => {
    el.style.borderLeft = "3px solid #d1d5db";
    el.style.paddingLeft = "1em";
    el.style.color = "#4b5563";
    el.style.fontStyle = "italic";
  });

  // Tables
  container.querySelectorAll<HTMLElement>("table").forEach((el) => {
    el.style.borderCollapse = "collapse";
    el.style.width = "100%";
    el.style.margin = "1em 0";
  });
  container.querySelectorAll<HTMLElement>("th, td").forEach((el) => {
    el.style.border = "1px solid #d1d5db";
    el.style.padding = "0.5em 0.75em";
    el.style.textAlign = "left";
    el.style.verticalAlign = "top";
  });
  container.querySelectorAll<HTMLElement>("th").forEach((el) => {
    el.style.background = "#f9fafb";
    el.style.fontWeight = "600";
  });

  // Horizontal rules
  container.querySelectorAll<HTMLElement>("hr").forEach((el) => {
    el.style.border = "none";
    el.style.borderTop = "1px solid #e5e7eb";
    el.style.margin = "1.5em 0";
  });

  // Images
  container.querySelectorAll<HTMLElement>("img").forEach((el) => {
    el.style.maxWidth = "100%";
    el.style.height = "auto";
  });

  // Merge field badges (render as plain bold text in PDF)
  container
    .querySelectorAll<HTMLElement>("[data-merge-field]")
    .forEach((el) => {
      el.style.fontWeight = "700";
      el.style.background = "none";
      el.style.border = "none";
      el.style.padding = "0";
    });
}
