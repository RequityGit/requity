import { useState } from "react";

/* ─────────────────── colour tokens ─────────────────── */
const bg = "#09090B";
const card = "#141416";
const cardAlt = "#1A1A1E";
const border = "#27272A";
const text = "#FAFAFA";
const textMuted = "#8A8A8D";
const textDim = "#5A5A5D";
const accent = "#2563EB";
const accentMuted = "rgba(37,99,235,0.12)";
const success = "#22C55E";
const successMuted = "rgba(34,197,94,0.10)";
const successText = "#4ADE80";
const warning = "#F59E0B";
const warningMuted = "rgba(245,158,11,0.10)";
const warningText = "#FBBF24";
const destructive = "#EF4444";
const destructiveText = "#F87171";
const gold = "#C5975B";
const goldMuted = "rgba(197,151,91,0.10)";
const violet = "#8B5CF6";
const violetMuted = "rgba(139,92,246,0.12)";
const violetText = "#A78BFA";
const guidanceGreen = "#059669";
const guidanceMuted = "rgba(5,150,105,0.10)";
const guidanceText = "#34D399";

/* ─────────────────── shared styles ─────────────────── */
const tabStyle = (active) => ({
  padding: "7px 16px", fontSize: 13, fontWeight: active ? 600 : 400,
  color: active ? text : textMuted, background: active ? "#27272A" : "transparent",
  border: "none", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
});
const sectionTitle = { fontSize: 13, fontWeight: 600, color: text, margin: 0, letterSpacing: "0.01em" };
const microLabel = { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted };
const th = { ...microLabel, padding: "9px 14px", borderBottom: `2px solid ${border}`, textAlign: "right", whiteSpace: "nowrap" };
const thLeft = { ...th, textAlign: "left" };
const td = { padding: "9px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: text, textAlign: "right", verticalAlign: "middle", borderBottom: `1px solid ${border}` };
const tdLeft = { ...td, textAlign: "left" };
const tdMuted = { ...td, color: textMuted };
const totalRow = { borderTop: `2px solid ${border}`, background: "rgba(255,255,255,0.02)", fontWeight: 600 };
const subtotalRow = { borderTop: `1px solid ${border}`, fontWeight: 500 };
const pillBadge = (color, bgColor) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, color, background: bgColor });
const cardStyle = { background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden" };
const actionBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" };
const actionBtnPrimary = { ...actionBtn, background: accent, borderColor: accent, color: "#fff" };
const metricBox = { display: "flex", flexDirection: "column", gap: 2 };
const metricValue = { fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: text };
const metricLabel = { ...microLabel };
const StatusDot = ({ color }) => <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />;

/* note icon */
const NoteIcon = ({ hasNote, size = 14 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size - 3, opacity: hasNote ? 1 : 0.3, color: hasNote ? accent : textDim, cursor: "pointer", transition: "opacity 0.15s" }}>&#x1F4DD;</span>
);

/* toggle */
function Toggle({ on, onToggle, labelOff, labelOn }) {
  return (
    <button onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "5px 6px", borderRadius: 8, border: `1px solid ${on ? violet : border}`, background: on ? violetMuted : "transparent", cursor: "pointer", transition: "all 0.2s" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: on ? textMuted : text }}>{labelOff}</span>
      <span style={{ width: 36, height: 20, borderRadius: 10, position: "relative", background: on ? violet : "#3F3F46", transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: on ? violetText : textMuted }}>{labelOn}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRO FORMA TAB (with Takeout Test toggle + Stabilized + Valuation)
   ═══════════════════════════════════════════════════════════════ */
function ProFormaTab() {
  const [showTakeout, setShowTakeout] = useState(false);
  const [takeoutYear, setTakeoutYear] = useState(2);

  /* ─── Takeout Test View ─── */
  if (showTakeout) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Toggle on={showTakeout} onToggle={() => setShowTakeout(false)} labelOff="Operating" labelOn="Takeout Test" />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12 }}>
              <span style={{ fontSize: 12, color: textMuted }}>Refi Year:</span>
              {[1, 2, 3].map((yr) => (
                <button key={yr} onClick={() => setTakeoutYear(yr)} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${takeoutYear === yr ? violet : border}`, background: takeoutYear === yr ? violetMuted : "transparent", color: takeoutYear === yr ? violetText : textMuted }}>Yr {yr}</button>
              ))}
            </div>
          </div>
          <button style={actionBtn}>&#x2193; Export .xlsx</button>
        </div>

        {/* Takeout Loan Params */}
        <div style={{ ...cardStyle, border: `1px solid ${violet}40` }}>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, background: violetMuted }}>
            <span style={{ fontSize: 14 }}>&#x1F3AF;</span>
            <span style={{ ...sectionTitle, color: violetText }}>Takeout / Permanent Loan Parameters</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: textMuted }}>Stress testing Year {takeoutYear} stabilized financials against permanent financing</span>
          </div>
          <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px 24px" }}>
            {[
              { label: "Takeout Loan Amount", value: "$3,200,000" },
              { label: "Rate (Fixed)", value: "6.50%" },
              { label: "Amortization", value: "30 years" },
              { label: "Term", value: "10 years" },
              { label: "IO Period", value: "None" },
              { label: "Annual Debt Service", value: "$242,688" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: textMuted }}>{f.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: text, padding: "4px 8px", borderRadius: 6, border: `1px solid transparent`, cursor: "pointer" }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        <div style={cardStyle}>
          <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { label: `Yr ${takeoutYear} NOI`, value: "$344,447", sub: "Stabilized" },
              { label: "Takeout DSCR", value: "1.42x", sub: "Min 1.25x", color: successText, pass: true },
              { label: "Takeout LTV", value: "66.7%", sub: "Max 75%", color: successText, pass: true },
              { label: "Debt Yield", value: "10.8%", sub: "Min 8.0%", color: successText, pass: true },
              { label: "Test Result", value: "PASS", sub: "All covenants met", isBadge: true },
            ].map((m, i) => (
              <div key={i} style={metricBox}>
                <span style={metricLabel}>{m.label}</span>
                {m.isBadge ? (
                  <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 700, background: successMuted, color: successText, marginTop: 4, display: "inline-block", width: "fit-content" }}>{m.value}</span>
                ) : (
                  <span style={{ ...metricValue, fontSize: 18, color: m.color || text }}>{m.value}</span>
                )}
                <span style={{ fontSize: 10, color: m.pass ? successText : textDim }}>{m.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bridge vs Takeout Comparison */}
        <div style={cardStyle}>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sectionTitle}>Year {takeoutYear} Cash Flow: Bridge vs Takeout</span>
            <span style={pillBadge(violetText, violetMuted)}>Stress Comparison</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: cardAlt }}>
                  <th style={{ ...thLeft, width: 260 }}>LINE ITEM</th>
                  <th style={{ ...th, color: gold }}>T-12 Actual</th>
                  <th style={{ ...th, fontWeight: 700 }}>Yr {takeoutYear} Pro Forma</th>
                  <th style={{ ...th, color: violetText }}>Takeout Test</th>
                  <th style={{ ...th, width: 100 }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>REVENUE</td></tr>
                {[
                  { label: "Effective Gross Income", t12: "$480,300", yr: "$530,737", to: "$530,737", v: "\u2014" },
                ].map((r, i) => <tr key={i}><td style={{ ...tdLeft, fontWeight: 600 }}>{r.label}</td><td style={{ ...td, color: gold }}>{r.t12}</td><td style={{ ...td, fontWeight: 600 }}>{r.yr}</td><td style={{ ...td, color: violetText, fontWeight: 600 }}>{r.to}</td><td style={{ ...td, color: textDim }}>{r.v}</td></tr>)}
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>EXPENSES</td></tr>
                {[
                  { label: "Total Operating Expenses", t12: "$186,600", yr: "$169,336", to: "$169,336", v: "\u2014" },
                ].map((r, i) => <tr key={i}><td style={{ ...tdLeft, fontWeight: 600 }}>{r.label}</td><td style={{ ...td, color: gold }}>{r.t12}</td><td style={{ ...td, fontWeight: 600 }}>{r.yr}</td><td style={{ ...td, color: violetText, fontWeight: 600 }}>{r.to}</td><td style={{ ...td, color: textDim }}>{r.v}</td></tr>)}
                <tr style={{ ...totalRow, background: "rgba(34,197,94,0.04)" }}>
                  <td style={{ ...tdLeft, fontWeight: 700, fontSize: 14 }}>Net Operating Income</td>
                  <td style={{ ...td, color: gold, fontWeight: 700 }}>$349,800</td>
                  <td style={{ ...td, fontWeight: 700, color: successText }}>$344,447</td>
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$344,447</td>
                  <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                </tr>
                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>DEBT SERVICE</td></tr>
                <tr>
                  <td style={tdLeft}>Annual Debt Service</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  <td style={{ ...td, fontWeight: 500 }}>$198,000</td>
                  <td style={{ ...td, fontWeight: 600, color: violetText }}>$242,688</td>
                  <td style={{ ...td, color: warningText, fontWeight: 600 }}>+$44,688</td>
                </tr>
                <tr style={{ background: "rgba(139,92,246,0.04)" }}>
                  <td style={{ ...tdLeft, fontSize: 11, color: textDim, paddingLeft: 28 }}>Bridge: 8.5% IO on $3.0M &nbsp;|&nbsp; Takeout: 6.5% amort on $3.2M</td>
                  <td colSpan={4} style={{ border: "none" }} />
                </tr>
                <tr style={totalRow}>
                  <td style={{ ...tdLeft, fontWeight: 700 }}>Net Cash Flow</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  <td style={{ ...td, fontWeight: 700, color: successText }}>$146,447</td>
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$101,759</td>
                  <td style={{ ...td, color: warningText, fontWeight: 600 }}>-$44,688</td>
                </tr>
                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>COVENANT TESTS</td></tr>
                {[
                  { label: "DSCR", bridge: "1.74x", to: "1.42x", min: "Min 1.25x", pass: true },
                  { label: "LTV at Takeout", bridge: "62.5%", to: "66.7%", min: "Max 75%", pass: true },
                  { label: "Debt Yield", bridge: "11.5%", to: "10.8%", min: "Min 8.0%", pass: true },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={tdLeft}>{r.label}</td>
                    <td style={tdMuted}>{"\u2014"}</td>
                    <td style={{ ...td, color: successText }}>{r.bridge}</td>
                    <td style={{ ...td, color: violetText, fontWeight: 600 }}>{r.to}</td>
                    <td style={td}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: r.pass ? successMuted : "rgba(239,68,68,0.1)", color: r.pass ? successText : destructiveText }}>{r.pass ? "Pass" : "Fail"} ({r.min})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DSCR Sensitivity */}
        <div style={cardStyle}>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}` }}>
            <span style={sectionTitle}>Takeout DSCR Sensitivity</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 140 }}>NOI \ RATE</th>
                <th style={th}>5.50%</th><th style={th}>6.00%</th>
                <th style={{ ...th, fontWeight: 700, color: violetText, background: violetMuted }}>6.50%</th>
                <th style={th}>7.00%</th><th style={th}>7.50%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { noi: "$310K (-10%)", vals: ["1.43x", "1.36x", "1.28x", "1.20x", "1.13x"] },
                { noi: "$327K (-5%)", vals: ["1.51x", "1.43x", "1.35x", "1.27x", "1.19x"] },
                { noi: "$344K (base)", vals: ["1.59x", "1.51x", "1.42x", "1.33x", "1.25x"], base: true },
                { noi: "$362K (+5%)", vals: ["1.67x", "1.59x", "1.49x", "1.40x", "1.32x"] },
                { noi: "$379K (+10%)", vals: ["1.75x", "1.66x", "1.56x", "1.47x", "1.38x"] },
              ].map((row, i) => (
                <tr key={i} style={row.base ? { background: "rgba(139,92,246,0.04)" } : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.base ? 600 : 400, color: row.base ? violetText : textMuted, fontSize: 12 }}>{row.noi}</td>
                  {row.vals.map((v, j) => {
                    const num = parseFloat(v);
                    const isBase = row.base && j === 2;
                    return <td key={j} style={{ ...td, fontWeight: isBase ? 700 : 400, color: num < 1.25 ? destructiveText : num < 1.35 ? warningText : successText, background: isBase ? violetMuted : "transparent" }}>{v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "8px 24px", borderTop: `1px solid ${border}`, display: "flex", gap: 16 }}>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={success} /> Above 1.35x</span>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={warning} /> 1.25-1.35x</span>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={destructive} /> Below 1.25x</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Operating Pro Forma (default) ─── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Toggle on={false} onToggle={() => setShowTakeout(true)} labelOff="Operating" labelOn="Takeout Test" />
          <span style={pillBadge(successText, successMuted)}><StatusDot color={success} /> Synced</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={actionBtn}>&#x2193; Export .xlsx</button>
          <button style={actionBtn}>&#x26F6;</button>
        </div>
      </div>

      {/* Inline Assumptions Bar */}
      <div style={cardStyle}>
        <div style={{ padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: cardAlt }}>
          <span style={{ ...microLabel, fontSize: 11 }}>ASSUMPTIONS</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { l: "Hold", v: "5 yr" }, { l: "Entry Cap", v: "7.2%" }, { l: "Exit Cap", v: "6.5%" },
              { l: "Rent Growth", v: "3.0%" }, { l: "Expense Growth", v: "3.0%" },
              { l: "Vacancy", v: "5% > 4%" }, { l: "Stab. Vacancy", v: "5%" }, { l: "Mgmt Fee", v: "8% EGI" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: textDim }}>{a.l}:</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: text, cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}>{a.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={cardStyle}>
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {[
            { label: "Going-In Cap", value: "7.2%" },
            { label: "Exit Cap", value: "6.5%" },
            { label: "Yr 1 DSCR", value: "1.65x", color: successText },
            { label: "Avg Cash-on-Cash", value: "9.8%", color: successText },
            { label: "5-Yr IRR", value: "18.2%", color: successText },
            { label: "Equity Multiple", value: "2.1x" },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={metricLabel}>{m.label}</span>
              <span style={{ ...metricValue, fontSize: 18, color: m.color || text }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Forma Table - now with STABILIZED column */}
      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1020 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>CASH FLOW</th>
                <th style={{ ...th, color: gold }}>T-12</th>
                <th style={{ ...th, fontWeight: 700 }}>YR 1</th>
                <th style={th}>YR 2</th>
                <th style={th}>YR 3</th>
                <th style={th}>YR 4</th>
                <th style={th}>YR 5</th>
                <th style={{ ...th, color: violetText, borderLeft: `2px solid ${violet}40` }}>STABILIZED</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>REVENUE</td></tr>
              {[
                { label: "Gross Potential Rent", t12: "$486,000", vals: ["$500,580", "$515,597", "$531,065", "$546,997", "$563,407"], stab: "$531,065" },
                { label: "Other Income", t12: "$24,000", vals: ["$24,720", "$25,462", "$26,226", "$27,013", "$27,823"], stab: "$28,800" },
                { label: "Less: Vacancy", t12: "", vals: ["-$25,029", "-$20,624", "-$21,243", "-$21,880", "-$22,537"], stab: "-$26,553", neg: true },
                { label: "Less: Credit Loss", t12: "", vals: ["-$10,012", "-$7,734", "-$5,311", "-$5,470", "-$5,634"], stab: "-$5,311", neg: true },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, color: row.neg ? destructiveText : text }}>{row.label}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, color: row.neg ? destructiveText : text, fontWeight: j === 0 ? 600 : 400 }}>{v}</td>)}
                  <td style={{ ...td, color: row.neg ? destructiveText : violetText, fontWeight: 600, borderLeft: `2px solid ${violet}40` }}>{row.stab}</td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Effective Gross Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$510,000</td>
                {["$490,259", "$512,701", "$530,737", "$546,660", "$563,059"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>)}
                <td style={{ ...td, fontWeight: 700, color: violetText, borderLeft: `2px solid ${violet}40` }}>$528,001</td>
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>OPERATING EXPENSES</td></tr>
              {[
                { label: "Property Taxes", t12: "$42,000", vals: ["$43,260", "$44,558", "$45,895", "$47,271", "$48,689"], stab: "$43,260" },
                { label: "Insurance", t12: "$18,000", vals: ["$18,540", "$19,096", "$19,669", "$20,259", "$20,867"], stab: "$18,540" },
                { label: "Management (8%)", t12: "$30,600", vals: ["$39,221", "$41,016", "$42,459", "$43,733", "$45,045"], stab: "$42,240" },
                { label: "Repairs & Maint.", t12: "$36,000", vals: ["$37,080", "$38,192", "$39,338", "$40,518", "$41,734"], stab: "$37,080" },
                { label: "Utilities", t12: "$21,600", vals: ["$22,248", "$22,915", "$23,603", "$24,311", "$25,040"], stab: "$22,248" },
                { label: "G&A / Other", t12: "$12,000", vals: ["$12,360", "$12,731", "$13,113", "$13,506", "$13,911"], stab: "$12,360" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.label}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  {row.vals.map((v, j) => <td key={j} style={td}>{v}</td>)}
                  <td style={{ ...td, color: violetText, borderLeft: `2px solid ${violet}40` }}>{row.stab}</td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Total OpEx</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$160,200</td>
                {["$172,709", "$178,508", "$184,077", "$189,598", "$195,286"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>)}
                <td style={{ ...td, fontWeight: 700, color: violetText, borderLeft: `2px solid ${violet}40` }}>$175,728</td>
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>
              <tr style={{ ...totalRow, background: "rgba(34,197,94,0.04)" }}>
                <td style={{ ...tdLeft, fontWeight: 700, fontSize: 14 }}>Net Operating Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700, fontSize: 14 }}>$349,800</td>
                {["$317,550", "$334,193", "$346,660", "$357,062", "$367,773"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700, fontSize: 14, color: successText }}>{v}</td>)}
                <td style={{ ...td, fontWeight: 700, fontSize: 14, color: violetText, borderLeft: `2px solid ${violet}40` }}>$352,273</td>
              </tr>

              {/* NOI Upside */}
              <tr>
                <td style={{ ...tdLeft, fontSize: 12, color: textDim }}>NOI Upside vs T-12</td>
                <td style={tdMuted}>{"\u2014"}</td>
                <td colSpan={5} style={{ border: "none" }} />
                <td style={{ ...td, color: successText, fontWeight: 600, fontSize: 12, borderLeft: `2px solid ${violet}40` }}>+$2,473 (+0.7%)</td>
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>DEBT SERVICE</td></tr>
              <tr>
                <td style={tdLeft}>Senior Debt Service</td>
                <td style={tdMuted}>{"\u2014"}</td>
                {["$198,000", "$198,000", "$198,000", "$198,000", "$198,000"].map((v, i) => <td key={i} style={td}>{v}</td>)}
                <td style={{ ...td, color: violetText, borderLeft: `2px solid ${violet}40` }}>$242,688</td>
              </tr>
              <tr style={{ background: "rgba(139,92,246,0.02)" }}>
                <td style={{ ...tdLeft, fontSize: 10, color: textDim, paddingLeft: 20 }}>Stabilized DS uses takeout loan terms</td>
                <td colSpan={7} style={{ border: "none" }} />
              </tr>
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Net Cash Flow</td>
                <td style={tdMuted}>{"\u2014"}</td>
                {["$119,550", "$136,193", "$148,660", "$159,062", "$169,773"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700, color: successText }}>{v}</td>)}
                <td style={{ ...td, fontWeight: 700, color: violetText, borderLeft: `2px solid ${violet}40` }}>$109,585</td>
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>RETURN METRICS</td></tr>
              {[
                { label: "DSCR", vals: ["1.60x", "1.69x", "1.75x", "1.80x", "1.86x"], stab: "1.45x" },
                { label: "Cap Rate", vals: ["6.6%", "7.0%", "7.2%", "7.4%", "7.7%"], stab: "7.3%" },
                { label: "Cash-on-Cash", vals: ["7.9%", "9.1%", "9.9%", "10.6%", "11.3%"], stab: "7.3%" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.label}</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, color: successText }}>{v}</td>)}
                  <td style={{ ...td, color: violetText, borderLeft: `2px solid ${violet}40` }}>{row.stab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valuation Grid */}
      <div style={cardStyle}>
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Valuation per Cap Rate</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: 100 }}>CAP RATE</th>
              <th style={{ ...th, color: gold }}>T-12 NOI</th>
              <th style={th}>YR 1 NOI</th>
              <th style={{ ...th, color: violetText }}>STABILIZED NOI</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cap: "6.0%", t12: "$5,830,000", yr1: "$5,292,500", stab: "$5,871,217", highlight: false },
              { cap: "7.0%", t12: "$4,997,143", yr1: "$4,536,429", stab: "$5,032,471", highlight: true },
              { cap: "8.0%", t12: "$4,372,500", yr1: "$3,969,375", stab: "$4,403,413", highlight: false },
              { cap: "9.0%", t12: "$3,886,667", yr1: "$3,528,333", stab: "$3,914,144", highlight: false },
              { cap: "10.0%", t12: "$3,498,000", yr1: "$3,175,500", stab: "$3,522,730", highlight: false },
              { cap: "11.0%", t12: "$3,180,000", yr1: "$2,886,818", stab: "$3,202,482", highlight: false },
            ].map((row, i) => (
              <tr key={i} style={row.highlight ? { background: "rgba(37,99,235,0.04)" } : {}}>
                <td style={{ ...tdLeft, fontWeight: row.highlight ? 700 : 400, color: row.highlight ? accent : textMuted }}>{row.cap} {row.highlight ? "\u2190" : ""}</td>
                <td style={{ ...td, color: gold }}>{row.t12}</td>
                <td style={{ ...td, fontWeight: row.highlight ? 600 : 400 }}>{row.yr1}</td>
                <td style={{ ...td, color: violetText, fontWeight: row.highlight ? 600 : 400 }}>{row.stab}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "8px 24px", borderTop: `1px solid ${border}`, fontSize: 11, color: textDim }}>
          Arrow indicates deal's going-in cap rate. Stabilized DS column uses takeout loan terms.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INCOME TAB (with Occupancy Income + Expanded Ancillary + Notes)
   ═══════════════════════════════════════════════════════════════ */
function IncomeTab({ assetType }) {
  const [expandedNote, setExpandedNote] = useState(null);
  const isOccBased = ["rv_park", "hotel", "marina", "campground", "vacation_rental"].includes(assetType);
  const isLeaseBased = !isOccBased;

  const unitLabel = { multifamily: "unit", office: "SF", retail: "SF", industrial: "SF", mhp: "pad", rv_park: "site", hotel: "room", marina: "slip", campground: "site", vacation_rental: "unit" }[assetType] || "unit";

  /* ancillary defaults by asset type */
  const ancillaryDefaults = {
    multifamily: ["Laundry", "Pet Fees", "Storage Units", "Late Fees", "Parking"],
    rv_park: ["Dump Station", "Storage / Dry Dock", "Amenity Fees", "Utility Reimbursement", "Vending"],
    hotel: ["Food & Beverage (Net)", "Event / Meeting Space", "Amenity Fees", "Vending / Retail"],
    marina: ["Dry Dock / Storage", "Equipment / Boat Rental", "Fuel Sales (Net)", "Amenity Fees"],
    mhp: ["Laundry", "Storage Units", "Utility Reimbursement", "Late Fees"],
  }[assetType] || ["Laundry", "Pet Fees", "Storage", "Late Fees"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Asset type indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: textMuted }}>Property Type:</span>
        <span style={pillBadge(accent, accentMuted)}>{assetType === "rv_park" ? "RV Park" : assetType === "multifamily" ? "Multifamily" : assetType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
        <span style={{ fontSize: 12, color: textMuted, marginLeft: 8 }}>Income mode: {isOccBased ? "Occupancy-Based (primary)" : "Lease-Based (primary)"}</span>
      </div>

      {/* ─── RENT ROLL (shown for lease-based, collapsed for occ-based) ─── */}
      {isLeaseBased && (
        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={sectionTitle}>Rent Roll</span>
              <span style={{ fontSize: 12, color: textMuted }}>24 units</span>
            </div>
            <button style={actionBtnPrimary}>+ Add Units</button>
          </div>
          <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, borderBottom: `1px solid ${border}`, background: cardAlt }}>
            {[
              { label: "Monthly Rent", value: "$40,500" },
              { label: "Annual GPR", value: "$486,000" },
              { label: "Occupancy", value: "92%", color: successText },
              { label: `Avg Rent/${unitLabel}`, value: "$1,688" },
              { label: `Mkt Rent/${unitLabel}`, value: "$1,785" },
              { label: "Loss-to-Lease", value: "5.4%", color: warningText },
            ].map((m, i) => (
              <div key={i} style={metricBox}>
                <span style={{ ...metricLabel, fontSize: 9 }}>{m.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: m.color || text }}>{m.value}</span>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                {["UNIT", "TYPE", "STATUS", "TENANT", "CURRENT", "MARKET", ""].map((h, i) => (
                  <th key={i} style={i === 0 || i === 3 ? thLeft : i === 6 ? { ...th, width: 30 } : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { unit: "101", type: "2BR/1BA", status: "occupied", tenant: "J. Martinez", current: "$1,650", market: "$1,750", note: "Below market, hasn't renewed yet" },
                { unit: "102", type: "1BR/1BA", status: "occupied", tenant: "A. Chen", current: "$1,350", market: "$1,425", note: null },
                { unit: "103", type: "2BR/1BA", status: "vacant", tenant: "\u2014", current: "\u2014", market: "$1,750", note: "Down unit, needs reno" },
                { unit: "104", type: "Studio", status: "occupied", tenant: "R. Williams", current: "$1,100", market: "$1,150", note: null },
              ].map((row, i) => {
                const sc = { occupied: success, vacant: warning, down: destructive };
                return (
                  <>
                    <tr key={i} style={{ cursor: "pointer" }}>
                      <td style={{ ...tdLeft, fontWeight: 600 }}>{row.unit}</td>
                      <td style={td}>{row.type}</td>
                      <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><StatusDot color={sc[row.status]} /><span style={{ fontSize: 12, textTransform: "capitalize" }}>{row.status}</span></span></td>
                      <td style={tdLeft}>{row.tenant}</td>
                      <td style={td}>{row.current}</td>
                      <td style={td}>{row.market}</td>
                      <td style={{ ...td, textAlign: "center" }} onClick={() => setExpandedNote(expandedNote === `rent-${i}` ? null : `rent-${i}`)}><NoteIcon hasNote={!!row.note} /></td>
                    </tr>
                    {expandedNote === `rent-${i}` && (
                      <tr><td colSpan={7} style={{ padding: "6px 14px 10px 28px", borderBottom: `1px solid ${border}`, background: "rgba(37,99,235,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ fontSize: 11, color: accent, fontWeight: 600, whiteSpace: "nowrap", marginTop: 2 }}>Note:</span>
                          <span style={{ fontSize: 12, color: text, flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${border}`, background: card, minHeight: 28 }}>{row.note || "Add a note..."}</span>
                        </div>
                      </td></tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "10px 24px", borderTop: `1px solid ${border}` }}>
            <button style={{ background: "none", border: "none", color: accent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Show 20 more units...</button>
          </div>
        </div>
      )}

      {/* ─── OCCUPANCY-BASED INCOME (shown for transient asset types) ─── */}
      {isOccBased && (
        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={sectionTitle}>Occupancy-Based Income</span>
              <span style={{ fontSize: 12, color: textMuted }}>Operating Days: <span style={{ color: text, fontWeight: 600, cursor: "pointer" }}>365</span></span>
            </div>
            <button style={actionBtnPrimary}>+ Add Site Type</button>
          </div>

          {/* Occupancy KPIs */}
          <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, borderBottom: `1px solid ${border}`, background: cardAlt }}>
            {[
              { label: "Total Sites", value: "85" },
              { label: "Avg Nightly Rate", value: "$42" },
              { label: "Avg Occupancy", value: "72%", color: warningText },
              { label: "Current Revenue", value: "$999,180" },
              { label: "Stabilized Revenue", value: "$1,196,100", color: successText },
              { label: "RevPAR", value: "$30.24" },
            ].map((m, i) => (
              <div key={i} style={metricBox}>
                <span style={{ ...metricLabel, fontSize: 9 }}>{m.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: m.color || text }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Occupancy Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: cardAlt }}>
                  <th style={thLeft}>SITE TYPE</th>
                  <th style={th}>COUNT</th>
                  <th style={th}>RATE/NIGHT</th>
                  <th style={th}>OCC %</th>
                  <th style={th}>OCC NIGHTS</th>
                  <th style={th}>REV/SITE</th>
                  <th style={th}>TOTAL REV</th>
                  <th style={{ ...th, color: violetText }}>TARGET RATE</th>
                  <th style={{ ...th, color: violetText }}>TARGET OCC</th>
                  <th style={{ ...th, color: violetText }}>STAB REV</th>
                  <th style={{ ...th, width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: "Full Hookup Pull-Through", count: 30, rate: "$55", occ: "78%", nights: "284", revSite: "$15,620", totalRev: "$468,600", tRate: "$60", tOcc: "82%", stabRev: "$537,360", note: "Premium spots, lake view" },
                  { type: "Full Hookup Back-In", count: 25, rate: "$45", occ: "72%", nights: "263", revSite: "$11,835", totalRev: "$295,875", tRate: "$50", tOcc: "78%", stabRev: "$355,875", note: null },
                  { type: "Water/Electric Only", count: 20, rate: "$30", occ: "65%", nights: "237", revSite: "$7,118", totalRev: "$142,350", tRate: "$35", tOcc: "72%", stabRev: "$184,100", note: null },
                  { type: "Tent / Primitive", count: 10, rate: "$20", occ: "55%", nights: "201", revSite: "$4,015", totalRev: "$40,150", tRate: "$25", tOcc: "60%", stabRev: "$54,750", note: "Seasonal only May-Oct" },
                ].map((row, i) => (
                  <>
                    <tr key={i} style={{ cursor: "pointer" }}>
                      <td style={{ ...tdLeft, fontWeight: 500 }}>{row.type}</td>
                      <td style={td}>{row.count}</td>
                      <td style={td}>{row.rate}</td>
                      <td style={td}>{row.occ}</td>
                      <td style={{ ...td, color: textMuted }}>{row.nights}</td>
                      <td style={{ ...td, color: textMuted }}>{row.revSite}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{row.totalRev}</td>
                      <td style={{ ...td, color: violetText }}>{row.tRate}</td>
                      <td style={{ ...td, color: violetText }}>{row.tOcc}</td>
                      <td style={{ ...td, color: violetText, fontWeight: 600 }}>{row.stabRev}</td>
                      <td style={{ ...td, textAlign: "center" }}><NoteIcon hasNote={!!row.note} /></td>
                    </tr>
                    {row.note && (
                      <tr><td colSpan={11} style={{ padding: "4px 14px 6px 28px", borderBottom: `1px solid ${border}`, background: "rgba(37,99,235,0.02)" }}>
                        <span style={{ fontSize: 11, color: textMuted }}>{row.note}</span>
                      </td></tr>
                    )}
                  </>
                ))}
                <tr style={totalRow}>
                  <td style={{ ...tdLeft, fontWeight: 700 }}>Total</td>
                  <td style={{ ...td, fontWeight: 700 }}>85</td>
                  <td style={{ ...td, color: textMuted }}>$42 avg</td>
                  <td style={{ ...td, color: textMuted }}>72% avg</td>
                  <td colSpan={2} style={{ border: "none" }} />
                  <td style={{ ...td, fontWeight: 700 }}>$946,975</td>
                  <td colSpan={2} style={{ border: "none" }} />
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$1,132,085</td>
                  <td style={{ border: "none" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ANCILLARY INCOME (asset-type-aware) ─── */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sectionTitle}>Ancillary / Other Income</span>
            <span style={{ fontSize: 11, color: textDim }}>Pre-populated for {assetType === "rv_park" ? "RV Park" : "Multifamily"}</span>
          </div>
          <button style={actionBtn}>+ Add Source</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: "30%" }}>SOURCE</th>
              <th style={th}>CURRENT ANNUAL</th>
              <th style={th}>STABILIZED</th>
              <th style={th}>$/{unitLabel}</th>
              <th style={{ ...th, width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {(isOccBased ? [
              { source: "Dump Station", current: "$8,400", stab: "$12,000", per: "$99" },
              { source: "Storage / Dry Dock", current: "$18,000", stab: "$24,000", per: "$212" },
              { source: "Amenity Fees", current: "$6,000", stab: "$8,500", per: "$71" },
              { source: "Utility Reimbursement", current: "$14,400", stab: "$14,400", per: "$169" },
              { source: "Vending", current: "$3,600", stab: "$4,200", per: "$42" },
            ] : [
              { source: "Laundry", current: "$6,000", stab: "$6,000", per: "$250" },
              { source: "Pet Fees", current: "$3,600", stab: "$4,800", per: "$150" },
              { source: "Storage Units", current: "$2,400", stab: "$3,600", per: "$100" },
              { source: "Late Fees", current: "$4,800", stab: "$3,000", per: "$200" },
              { source: "Parking", current: "$7,200", stab: "$9,600", per: "$300" },
            ]).map((row, i) => (
              <tr key={i} style={{ cursor: "pointer" }}>
                <td style={tdLeft}>{row.source}</td>
                <td style={td}>{row.current}</td>
                <td style={td}>{row.stab}</td>
                <td style={{ ...td, color: textMuted }}>{row.per}</td>
                <td style={{ ...td, textAlign: "center" }}><NoteIcon hasNote={false} /></td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Total Ancillary</td>
              <td style={{ ...td, fontWeight: 700 }}>{isOccBased ? "$50,400" : "$24,000"}</td>
              <td style={{ ...td, fontWeight: 700 }}>{isOccBased ? "$63,100" : "$27,000"}</td>
              <td colSpan={2} style={{ border: "none" }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* GPI Summary */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Gross Potential Income Summary</span>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {(isOccBased ? [
            { label: "Occupancy-Based Revenue", value: "$946,975" },
            { label: "+ Ancillary Income", value: "$50,400" },
            { label: "= Gross Potential Income (Current)", value: "$997,375", bold: true },
            { label: "= Gross Potential Income (Stabilized)", value: "$1,195,185", bold: true, color: violetText },
          ] : [
            { label: "Lease-Based Annual Income", value: "$486,000" },
            { label: "+ Other / Ancillary Income", value: "$24,000" },
            { label: "= Gross Potential Income", value: "$510,000", bold: true },
            { label: "- Vacancy (5.0%)", value: "-$25,500", color: destructiveText },
            { label: "= Effective Gross Income", value: "$484,500", bold: true, color: successText },
          ]).map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.bold ? "8px 0" : "2px 0", borderTop: row.bold ? `1px solid ${border}` : "none" }}>
              <span style={{ fontSize: 13, color: row.bold ? text : textMuted, fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
              <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums", fontWeight: row.bold ? 700 : 500, color: row.color || text }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPENSES TAB (with Expense Guidance, Benchmark Ref, Variance, Notes)
   ═══════════════════════════════════════════════════════════════ */
function ExpensesTab({ assetType }) {
  const [expandedNote, setExpandedNote] = useState(null);

  /* Expense benchmarks from RL Comm UW Template (exact values) */
  const benchmarks = {
    multifamily: { taxes: 1650, insurance: 625, utilities: 2350, repairs: 1500, contract: 400, payroll: 1000, marketing: 125, ga: 400, reserve: 375 },
    rv_park: { taxes: 300, insurance: 350, utilities: 650, repairs: 550, contract: 275, payroll: 500, marketing: 300, ga: 225, reserve: 200 },
    mhp: { taxes: 400, insurance: 275, utilities: 550, repairs: 200, contract: 200, payroll: 300, marketing: 50, ga: 125, reserve: 200 },
    hotel: { taxes: 2600, insurance: 1650, utilities: 3200, repairs: 2600, contract: 600, payroll: 3500, marketing: 1250, ga: 550, reserve: 1000 },
  };

  const unitLabel = { multifamily: "unit", rv_park: "site", mhp: "pad", hotel: "room" }[assetType] || "unit";
  const unitCount = assetType === "rv_park" ? 85 : 24;
  const bm = benchmarks[assetType] || benchmarks.multifamily;

  const mgmtFee = 0.08; // 8% of EGI
  const egi = assetType === "rv_park" ? 947375 : 474300; // approximate

  const expenseRows = [
    { cat: "Management Fee", t12: assetType === "rv_park" ? "$62,400" : "$30,600", yr1: `${(mgmtFee * 100).toFixed(0)}% of EGI`, benchmark: `${(mgmtFee * 100).toFixed(0)}% of EGI`, variance: null, isPct: true, source: "guidance", note: null },
    { cat: "Real Estate Taxes", t12: assetType === "rv_park" ? "$22,000" : "$42,000", yr1: `$${(bm.taxes * unitCount).toLocaleString()}`, benchmark: `$${(bm.taxes * unitCount).toLocaleString()}`, benchPer: `$${bm.taxes}/${unitLabel}`, variance: null, source: "guidance", note: assetType === "rv_park" ? "County reassessment pending Q3. Verify with assessor." : null },
    { cat: "Insurance", t12: assetType === "rv_park" ? "$24,000" : "$18,000", yr1: assetType === "rv_park" ? "$35,000" : `$${(bm.insurance * unitCount).toLocaleString()}`, benchmark: `$${(bm.insurance * unitCount).toLocaleString()}`, benchPer: `$${bm.insurance}/${unitLabel}`, variance: assetType === "rv_park" ? { delta: "+$5,250", pct: "+17.6%", dir: "over" } : null, source: assetType === "rv_park" ? "manual" : "guidance", note: assetType === "rv_park" ? "Flood zone, carrier quoted $35K. Guidance doesn't account for flood." : null },
    { cat: "Utilities", t12: assetType === "rv_park" ? "$48,000" : "$21,600", yr1: `$${(bm.utilities * unitCount).toLocaleString()}`, benchmark: `$${(bm.utilities * unitCount).toLocaleString()}`, benchPer: `$${bm.utilities}/${unitLabel}`, variance: null, source: "guidance", note: null },
    { cat: "Repairs & Maintenance", t12: assetType === "rv_park" ? "$38,000" : "$36,000", yr1: assetType === "rv_park" ? "$55,000" : `$${(bm.repairs * unitCount).toLocaleString()}`, benchmark: `$${(bm.repairs * unitCount).toLocaleString()}`, benchPer: `$${bm.repairs}/${unitLabel}`, variance: assetType === "rv_park" ? { delta: "+$8,250", pct: "+17.6%", dir: "over" } : null, source: assetType === "rv_park" ? "manual" : "guidance", note: assetType === "rv_park" ? "Roads need gravel, septic system aged. Using broker estimate." : null },
    { cat: "Contract Services", t12: assetType === "rv_park" ? "$18,000" : "$8,400", yr1: `$${(bm.contract * unitCount).toLocaleString()}`, benchmark: `$${(bm.contract * unitCount).toLocaleString()}`, benchPer: `$${bm.contract}/${unitLabel}`, variance: null, source: "guidance", note: null },
    { cat: "On Site Mgmt (Payroll)", t12: assetType === "rv_park" ? "$36,000" : "$14,400", yr1: `$${(bm.payroll * unitCount).toLocaleString()}`, benchmark: `$${(bm.payroll * unitCount).toLocaleString()}`, benchPer: `$${bm.payroll}/${unitLabel}`, variance: null, source: "guidance", note: null },
    { cat: "Marketing", t12: assetType === "rv_park" ? "$18,000" : "$3,600", yr1: `$${(bm.marketing * unitCount).toLocaleString()}`, benchmark: `$${(bm.marketing * unitCount).toLocaleString()}`, benchPer: `$${bm.marketing}/${unitLabel}`, variance: null, source: "guidance", note: null },
    { cat: "G&A / Other", t12: assetType === "rv_park" ? "$16,000" : "$12,000", yr1: `$${(bm.ga * unitCount).toLocaleString()}`, benchmark: `$${(bm.ga * unitCount).toLocaleString()}`, benchPer: `$${bm.ga}/${unitLabel}`, variance: null, source: "guidance", note: null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Guidance Banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderRadius: 10, background: guidanceMuted, border: `1px solid rgba(5,150,105,0.2)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusDot color={guidanceGreen} />
          <span style={{ fontSize: 12, color: guidanceText }}>Expense Guidance active for <strong>{assetType === "rv_park" ? "RV Park" : "Multifamily"}</strong> ({unitCount} {unitLabel}s). Year 1 defaults auto-populated from benchmarks.</span>
        </div>
        <button style={{ ...actionBtn, borderColor: guidanceGreen, color: guidanceText, fontSize: 11 }}>Reset All to Guidance</button>
      </div>

      {/* Main Expense Table */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Operating Expense Detail</span>
          <button style={actionBtn}>+ Add Line</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 180 }}>CATEGORY</th>
                <th style={{ ...th, color: gold }}>T-12 ACTUAL</th>
                <th style={{ ...th, fontWeight: 700 }}>YR 1</th>
                <th style={{ ...th, color: guidanceText }}>BENCHMARK REF</th>
                <th style={th}>VARIANCE</th>
                <th style={th}>% OF EGI</th>
                <th style={th}>$/{unitLabel.toUpperCase()}</th>
                <th style={th}>SOURCE</th>
                <th style={{ ...th, width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {expenseRows.map((row, i) => (
                <>
                  <tr key={i}>
                    <td style={tdLeft}>{row.cat}</td>
                    <td style={{ ...td, color: gold }}>{row.t12}</td>
                    <td style={{ ...td, fontWeight: 600, cursor: "pointer" }}>{row.yr1}</td>
                    <td style={{ ...td, color: guidanceText, fontSize: 12 }}>
                      {row.benchmark}
                      {row.benchPer && <span style={{ display: "block", fontSize: 10, color: textDim }}>{row.benchPer}</span>}
                    </td>
                    <td style={td}>
                      {row.variance ? (
                        <span style={{ color: row.variance.dir === "over" ? warningText : successText, fontWeight: 500 }}>
                          {row.variance.delta} <span style={{ fontSize: 10 }}>({row.variance.pct})</span>
                        </span>
                      ) : (
                        <span style={{ color: successText }}>&#x2713;</span>
                      )}
                    </td>
                    <td style={{ ...td, color: textMuted }}>{row.isPct ? "8.0%" : "\u2014"}</td>
                    <td style={{ ...td, color: textMuted }}>{row.isPct ? "\u2014" : row.benchPer?.split("/")[0] || "\u2014"}</td>
                    <td style={td}>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: row.source === "guidance" ? guidanceMuted : "rgba(245,158,11,0.1)",
                        color: row.source === "guidance" ? guidanceText : warningText,
                      }}>
                        {row.source === "guidance" ? "Guidance" : "Manual"}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "center" }} onClick={() => setExpandedNote(expandedNote === `exp-${i}` ? null : `exp-${i}`)}>
                      <NoteIcon hasNote={!!row.note} />
                    </td>
                  </tr>
                  {expandedNote === `exp-${i}` && row.note && (
                    <tr><td colSpan={9} style={{ padding: "6px 14px 10px 28px", borderBottom: `1px solid ${border}`, background: "rgba(37,99,235,0.03)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 11, color: accent, fontWeight: 600, whiteSpace: "nowrap", marginTop: 2 }}>Note:</span>
                        <span style={{ fontSize: 12, color: text }}>{row.note}</span>
                      </div>
                    </td></tr>
                  )}
                </>
              ))}

              <tr><td colSpan={9} style={{ height: 4, border: "none" }} /></tr>

              {/* Replacement Reserve */}
              <tr style={{ background: "rgba(255,255,255,0.01)" }}>
                <td style={tdLeft}>Replacement Reserve</td>
                <td style={{ ...td, color: gold }}>{"\u2014"}</td>
                <td style={{ ...td, fontWeight: 600 }}>${(bm.reserve * unitCount).toLocaleString()}</td>
                <td style={{ ...td, color: guidanceText, fontSize: 12 }}>${(bm.reserve * unitCount).toLocaleString()}<span style={{ display: "block", fontSize: 10, color: textDim }}>${bm.reserve}/{unitLabel}</span></td>
                <td style={td}><span style={{ color: successText }}>&#x2713;</span></td>
                <td style={{ ...td, color: textMuted }}>{"\u2014"}</td>
                <td style={{ ...td, color: textMuted }}>${bm.reserve}</td>
                <td style={td}><span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: guidanceMuted, color: guidanceText }}>Guidance</span></td>
                <td style={{ ...td, textAlign: "center" }}><NoteIcon hasNote={false} /></td>
              </tr>

              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>TOTAL EXPENSES</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>{assetType === "rv_park" ? "$282,800" : "$186,600"}</td>
                <td style={{ ...td, fontWeight: 700 }}>{assetType === "rv_park" ? "$260,275" : "$166,680"}</td>
                <td colSpan={6} style={{ border: "none" }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* NOI Summary */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>NOI Summary</span>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Effective Gross Income", value: assetType === "rv_park" ? "$947,375" : "$474,300" },
            { label: "- Total Expenses", value: assetType === "rv_park" ? "-$260,275" : "-$166,680", color: destructiveText },
            { label: "= Net Operating Income (Yr 1)", value: assetType === "rv_park" ? "$687,100" : "$307,620", bold: true, color: successText },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.bold ? "8px 0" : "2px 0", borderTop: row.bold ? `1px solid ${border}` : "none" }}>
              <span style={{ fontSize: 13, color: row.bold ? text : textMuted, fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
              <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums", fontWeight: row.bold ? 700 : 500, color: row.color || text }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAPITAL STACK TAB (Sources & Uses + Financing + Waterfall)
   ═══════════════════════════════════════════════════════════════ */
function CapitalStackTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Sources & Uses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <span style={sectionTitle}>Uses of Capital</span>
            <button style={actionBtn}>+ Add</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: cardAlt }}><th style={thLeft}>USE</th><th style={th}>AMOUNT</th><th style={th}>%</th></tr></thead>
            <tbody>
              {[
                { u: "Purchase Price", a: "$4,800,000", p: "83.5%" },
                { u: "Renovation", a: "$600,000", p: "10.4%" },
                { u: "Closing Costs", a: "$192,000", p: "3.3%" },
                { u: "Reserves", a: "$96,000", p: "1.7%" },
                { u: "Acquisition Fee", a: "$60,000", p: "1.0%" },
              ].map((r, i) => <tr key={i}><td style={tdLeft}>{r.u}</td><td style={td}>{r.a}</td><td style={{ ...td, color: textMuted }}>{r.p}</td></tr>)}
              <tr style={totalRow}><td style={{ ...tdLeft, fontWeight: 700 }}>Total Uses</td><td style={{ ...td, fontWeight: 700 }}>$5,748,000</td><td style={{ ...td, fontWeight: 600 }}>100%</td></tr>
            </tbody>
          </table>
        </div>
        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <span style={sectionTitle}>Sources of Capital</span>
            <button style={actionBtn}>+ Add</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: cardAlt }}><th style={thLeft}>SOURCE</th><th style={th}>AMOUNT</th><th style={th}>%</th></tr></thead>
            <tbody>
              {[
                { s: "Senior Loan", a: "$3,000,000", p: "52.2%" },
                { s: "LP Equity", a: "$2,473,200", p: "43.0%" },
                { s: "GP Co-Invest", a: "$274,800", p: "4.8%" },
              ].map((r, i) => <tr key={i}><td style={tdLeft}>{r.s}</td><td style={td}>{r.a}</td><td style={{ ...td, color: textMuted }}>{r.p}</td></tr>)}
              <tr style={totalRow}><td style={{ ...tdLeft, fontWeight: 700 }}>Total Sources</td><td style={{ ...td, fontWeight: 700 }}>$5,748,000</td><td style={{ ...td, fontWeight: 600 }}>100%</td></tr>
            </tbody>
          </table>
          <div style={{ padding: "10px 24px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot color={success} /><span style={{ fontSize: 12, color: successText }}>Balanced</span>
          </div>
        </div>
      </div>

      {/* Financing */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Financing Structure</span>
          <button style={actionBtn}>+ Add Tranche</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: cardAlt }}><th style={thLeft}>TRANCHE</th><th style={th}>AMOUNT</th><th style={th}>RATE</th><th style={th}>TERM</th><th style={th}>IO</th><th style={th}>AMORT</th><th style={th}>LTV</th><th style={th}>ANNUAL DS</th></tr></thead>
          <tbody>
            <tr>
              <td style={tdLeft}><span style={{ fontWeight: 500 }}>Senior Bridge</span></td>
              <td style={td}>$3,000,000</td><td style={td}>8.5%</td><td style={td}>36 mo</td><td style={td}>24 mo</td><td style={td}>30 yr</td><td style={td}>62.5%</td><td style={td}>$198,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Waterfall */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Distribution Waterfall</span>
          <button style={actionBtn}>+ Add Tier</button>
        </div>
        <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, borderBottom: `1px solid ${border}`, background: cardAlt }}>
          {[
            { label: "LP IRR", value: "15.8%", color: successText },
            { label: "LP Multiple", value: "1.92x", color: successText },
            { label: "GP IRR", value: "28.4%" },
            { label: "GP Multiple", value: "3.1x" },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={{ ...metricLabel, fontSize: 9 }}>{m.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: m.color || text }}>{m.value}</span>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: cardAlt }}><th style={{ ...thLeft, width: 50 }}>TIER</th><th style={thLeft}>DESCRIPTION</th><th style={th}>HURDLE</th><th style={th}>LP</th><th style={th}>GP</th></tr></thead>
          <tbody>
            {[
              { t: 1, d: "Return of Capital", h: "\u2014", lp: "100%", gp: "0%" },
              { t: 2, d: "Preferred Return", h: "8.0%", lp: "100%", gp: "0%" },
              { t: 3, d: "GP Catch-Up", h: "12.0%", lp: "0%", gp: "100%" },
              { t: 4, d: "Above Hurdle", h: "15.0%", lp: "70%", gp: "30%" },
            ].map((r, i) => (
              <tr key={i}><td style={{ ...tdLeft, color: textMuted }}>{r.t}</td><td style={{ ...tdLeft, fontWeight: 500 }}>{r.d}</td><td style={td}>{r.h}</td><td style={td}>{r.lp}</td><td style={td}>{r.gp}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const SUB_TABS = [
  { key: "proforma", label: "Pro Forma" },
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "capital-stack", label: "Capital Stack" },
];

export default function UnderwritingTabV4() {
  const [activeTab, setActiveTab] = useState("expenses"); // start on expenses to show guidance
  const [showImport, setShowImport] = useState(false);
  const [assetType, setAssetType] = useState("multifamily"); // toggle to see both modes

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      {/* Deal Header */}
      <div style={{ padding: "12px 32px", borderBottom: `1px solid ${border}` }}>
        <span style={{ fontSize: 11, color: textMuted }}>Pipeline &rsaquo; Commercial Bridge &rsaquo; RL1127</span>
      </div>
      <div style={{ padding: "16px 32px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#27272A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>&#x1F3E2;</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>221 Riggs Road</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 2 }}>
            <span style={pillBadge(accent, accentMuted)}>COMM DEBT</span>
            <span style={{ fontSize: 13, color: textMuted }}>{assetType === "rv_park" ? "RV Park" : "MF"} (24 units)</span>
            <span style={{ fontSize: 13, color: textMuted, fontVariantNumeric: "tabular-nums" }}>$3,000,000</span>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div style={{ padding: "14px 32px 0", display: "flex", gap: 0, borderBottom: `1px solid ${border}` }}>
        {["Overview", "Property", "Underwriting", "Borrower", "Forms", "Diligence", "Messages"].map((tab) => (
          <button key={tab} style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === "Underwriting" ? 600 : 400, color: tab === "Underwriting" ? text : textMuted, background: "transparent", border: "none", cursor: "pointer", borderBottom: tab === "Underwriting" ? `2px solid ${text}` : "2px solid transparent", marginBottom: -1 }}>{tab}</button>
        ))}
      </div>

      {/* UW Sub-Tabs + Controls */}
      <div style={{ padding: "14px 32px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "inline-flex", gap: 4, background: card, padding: 4, borderRadius: 10, border: `1px solid ${border}` }}>
            {SUB_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(activeTab === tab.key)}>{tab.label}</button>
            ))}
          </div>
          {/* Demo: Asset Type Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8, padding: "4px 10px", borderRadius: 8, border: `1px dashed ${border}`, background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontSize: 10, color: textDim }}>DEMO:</span>
            {["multifamily", "rv_park"].map((at) => (
              <button key={at} onClick={() => setAssetType(at)} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer", border: `1px solid ${assetType === at ? accent : "transparent"}`, background: assetType === at ? accentMuted : "transparent", color: assetType === at ? accent : textMuted }}>
                {at === "rv_park" ? "RV Park" : "MF"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowImport(true)} style={{ ...actionBtnPrimary, gap: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600 }}>&#x2191; Import Financials</button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "24px 32px 48px" }}>
        {activeTab === "proforma" && <ProFormaTab />}
        {activeTab === "income" && <IncomeTab assetType={assetType} />}
        {activeTab === "expenses" && <ExpensesTab assetType={assetType} />}
        {activeTab === "capital-stack" && <CapitalStackTab />}
      </div>
    </div>
  );
}
