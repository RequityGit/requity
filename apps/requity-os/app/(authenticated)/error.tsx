"use client";

import { useEffect } from "react";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Authenticated page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <h2 className="text-lg font-semibold">
        Failed to load this page
      </h2>
      <p className="text-sm text-gray-500 max-w-md">
        An error occurred while loading. Please try again or contact support if
        the problem persists.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
