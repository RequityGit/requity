/**
 * ChunkLoadError detection and recovery.
 *
 * After deploying new code, users with stale browser tabs may hit
 * ChunkLoadError because old chunk hashes no longer exist on the server.
 * These helpers detect the error and auto-reload once to pick up the
 * new deployment's chunk manifest.
 */

const RELOAD_KEY = "chunk-error-reload";

export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module")
  );
}

/**
 * Auto-reload the page once on ChunkLoadError.
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function handleChunkLoadError(): void {
  try {
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (!hasReloaded) {
      sessionStorage.setItem(RELOAD_KEY, "true");
      window.location.reload();
      return;
    }
    // Already reloaded once — clear flag so future deploys can retry
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // sessionStorage unavailable (e.g. private browsing quota exceeded)
  }
}

/**
 * Clear the reload flag on successful page load.
 * Call this from a top-level client component (e.g. ServiceWorkerRegistration).
 */
export function clearChunkErrorFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // sessionStorage unavailable
  }
}
