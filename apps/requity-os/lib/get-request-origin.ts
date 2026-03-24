/**
 * Derive the public-facing origin from an incoming request.
 *
 * On platforms like Netlify the internal `request.url` may contain a deploy-
 * specific hostname (e.g. `69aeea…--borrower.netlify.app`) rather than the
 * custom domain the user actually visited (`app.requitygroup.com`).
 *
 * This helper prefers the `x-forwarded-host` / `host` headers which always
 * reflect the real front-end hostname, falling back to `request.url` only as
 * a last resort.
 */
function isLocalHostHeader(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

export function getRequestOrigin(request: Request): string {
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");

  if (forwardedHost) {
    // Trust x-forwarded-proto when present. Without it, default to http for
    // local dev (Host: localhost:3000) so auth redirects stay on http://localhost,
    // not https://localhost (which breaks cookies and looks like a prod mismatch).
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const proto =
      forwardedProto ||
      (isLocalHostHeader(forwardedHost) ? "http" : "https");
    // host header may include a port — keep it as-is
    return `${proto}://${forwardedHost}`;
  }

  // Fallback: use the origin from the raw URL
  return new URL(request.url).origin;
}
