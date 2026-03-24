export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #F8F6F1)",
        color: "var(--text-mid, #5C5C5C)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  );
}
