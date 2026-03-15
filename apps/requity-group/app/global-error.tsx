"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Requity Group global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          background: "#F8F6F1",
          color: "#1C1C1C",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#5C5C5C", marginBottom: 24, textAlign: "center" }}>
          The app failed to load. Try refreshing the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            background: "#A08A4E",
            color: "#0C1C30",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
