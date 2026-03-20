interface SectionLabelProps {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}

export default function SectionLabel({
  children,
  light = false,
  className = "",
}: SectionLabelProps) {
  return (
    <p
      className={className}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "3px",
        textTransform: "uppercase" as const,
        color: light ? "var(--gold-muted)" : "var(--gold)",
        marginBottom: 24,
      }}
    >
      {children}
    </p>
  );
}
