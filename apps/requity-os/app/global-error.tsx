"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
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
        </main>
      </body>
    </html>
  );
}
