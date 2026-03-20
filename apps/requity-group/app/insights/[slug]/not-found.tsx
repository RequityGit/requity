import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main>
      <section
        className="dark-zone hero-gradient"
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          paddingTop: 120,
          paddingBottom: 80,
          position: "relative",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="type-hero"
            style={{ color: "#fff", marginBottom: 16 }}
          >
            Post not found
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--navy-text-mid)",
              maxWidth: 480,
              margin: "0 auto 36px",
            }}
          >
            The article you are looking for may have been moved or is no longer
            available.
          </p>
          <Link
            href="/insights"
            className="btn-primary-light"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ArrowLeft size={16} /> Back to Insights
          </Link>
        </div>
      </section>
    </main>
  );
}
