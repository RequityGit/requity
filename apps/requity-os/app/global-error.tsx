"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module")
  );
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      const hasReloaded = sessionStorage.getItem("chunk-error-reload");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk-error-reload", "true");
        window.location.reload();
        return;
      }
      sessionStorage.removeItem("chunk-error-reload");
    }
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
          <h2 className="text-lg font-semibold">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 max-w-md">
            An unexpected error occurred. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #3f3f46",
              background: "#27272a",
              color: "#e4e4e7",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </main>
      </body>
    </html>
  );
}
