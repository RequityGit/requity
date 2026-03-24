"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Requity Group app error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        background: "var(--bg, #F8F6F1)",
        color: "var(--text, #1C1C1C)",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-mid, #5C5C5C)", marginBottom: 24, textAlign: "center" }}>
        The page failed to load. You can try again or return home.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            background: "var(--gold, #A08A4E)",
            color: "var(--navy, #0C1C30)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--navy)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
