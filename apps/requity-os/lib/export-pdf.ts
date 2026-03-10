import { toast } from "sonner";

/**
 * CSS styles for PDF rendering. Applied inside an isolated iframe
 * so that the parent page's dark mode styles cannot interfere.
 */
const PDF_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: white;
    color: #1a1a1a;
    font-size: 0.875rem;
    line-height: 1.625;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    width: 816px;
    padding: 0;
  }
  p, span, li, td, th, div { color: #1a1a1a; }
  a { color: #2563eb; }
  h1 { font-size: 1.5rem; font-weight: 700; line-height: 1.25; margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
  h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; margin-top: 1.25em; margin-bottom: 0.4em; color: #111; }
  h3 { font-size: 1.125rem; font-weight: 600; line-height: 1.35; margin-top: 1em; margin-bottom: 0.3em; color: #111; }
  ul { list-style-type: disc; padding-left: 1.5em; }
  ol { list-style-type: decimal; padding-left: 1.5em; }
  li { margin-top: 0.25em; }
  blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; color: #4b5563; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #d1d5db; padding: 0.5em 0.75em; text-align: left; vertical-align: top; }
  th { background: #f9fafb; font-weight: 600; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
  img { max-width: 100%; height: auto; }
  [data-merge-field] { font-weight: 700; background: none; border: none; padding: 0; }
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
  <style>${PDF_STYLES}</style>
</head>
<body>${htmlContent}</body>
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
