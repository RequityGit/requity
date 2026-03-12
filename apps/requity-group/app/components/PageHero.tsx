import SectionLabel from "./SectionLabel";

interface PageHeroProps {
  label: string;
  headline: React.ReactNode;
  body?: string;
  cta?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHero({
  label,
  headline,
  body,
  cta,
  children,
}: PageHeroProps) {
  return (
    <section
      className="dark-zone hero-gradient"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        paddingBottom: 80,
        position: "relative",
      }}
    >
      {/* Grid pattern */}
      <div className="navy-grid-pattern">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="navy-grid-line"
            style={{ left: `${(i + 1) * 7.14}%` }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="navy-glow"
        style={{ top: "15%", right: "10%" }}
      />

      {/* Bottom fade */}
      <div className="navy-bottom-fade" />

      {/* Content */}
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
          <SectionLabel light>{label}</SectionLabel>
        </div>
        <h1
          className="type-hero"
          style={{
            color: "#fff",
            maxWidth: 800,
            animation: "fadeUp 0.8s 0.1s ease both",
          }}
        >
          {headline}
        </h1>
        {body && (
          <div
            style={{
              display: "flex",
              gap: 60,
              marginTop: 36,
              animation: "fadeUp 0.8s 0.2s ease both",
              flexWrap: "wrap" as const,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                maxWidth: 520,
              }}
            >
              {body}
            </p>
            {cta && <div style={{ alignSelf: "flex-end" }}>{cta}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
