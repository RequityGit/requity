import SectionLabel from "./SectionLabel";

interface FooterCTAProps {
  label?: string;
  headline: React.ReactNode;
  body?: string;
  primaryCta?: React.ReactNode;
  secondaryCta?: React.ReactNode;
}

export default function FooterCTA({
  label,
  headline,
  body,
  primaryCta,
  secondaryCta,
}: FooterCTAProps) {
  return (
    <section
      className="dark-zone"
      style={{ padding: "140px 0", position: "relative", overflow: "hidden" }}
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

      <div
        className="container"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {label && <SectionLabel light>{label}</SectionLabel>}
        <h2
          className="type-h2"
          style={{ color: "#fff", marginBottom: body ? 28 : 44 }}
        >
          {headline}
        </h2>
        {body && (
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--navy-text-mid)",
              maxWidth: 560,
              marginBottom: 44,
            }}
          >
            {body}
          </p>
        )}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, justifyContent: "center" }}>
          {primaryCta}
          {secondaryCta}
        </div>
      </div>
    </section>
  );
}
