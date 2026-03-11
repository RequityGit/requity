interface SectionHeaderProps {
  children: React.ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <div className="section-header-line pt-3 px-4 pb-2 border-b-2 border-foreground mt-6">
      <h3
        className="font-bold uppercase text-foreground"
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          margin: 0,
        }}
      >
        {children}
      </h3>
    </div>
  );
}
