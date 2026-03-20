import { useState } from "react";

/* ─────────────────── simple icon components ─────────────────── */
const Icon = ({ children, size = 14, style = {} }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size - 2, lineHeight: 1, flexShrink: 0, ...style }}>{children}</span>
);

/* ─────────────────────── colour tokens (dark mode) ─────────────────────── */
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

/* ─────────────────────── shared styles ─────────────────────── */
const tabStyle = (active) => ({
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  color: active ? text : textMuted,
  background: active ? "#27272A" : "transparent",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
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

/* ─────────────────────── TOGGLE SWITCH ─────────────────────── */
function Toggle({ on, onToggle, labelOff, labelOn }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "5px 6px", borderRadius: 8,
        border: `1px solid ${on ? violet : border}`,
        background: on ? violetMuted : "transparent",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: on ? textMuted : text }}>{labelOff}</span>
      <span style={{
        width: 36, height: 20, borderRadius: 10, position: "relative",
        background: on ? violet : "#3F3F46", transition: "background 0.2s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: on ? violetText : textMuted }}>{labelOn}</span>
    </button>
  );
}

/* ─────────────────────── SUB-TAB: PRO FORMA (with Takeout Test) ─────────────────────── */
function ProFormaTab() {
  const [showTakeout, setShowTakeout] = useState(false);
  const [takeoutYear, setTakeoutYear] = useState(2); // default: 2-year bridge

  if (showTakeout) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Toggle on={showTakeout} onToggle={() => setShowTakeout(!showTakeout)} labelOff="Operating" labelOn="Takeout Test" />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12 }}>
              <span style={{ fontSize: 12, color: textMuted }}>Refi Year:</span>
              {[1, 2, 3].map((yr) => (
                <button key={yr} onClick={() => setTakeoutYear(yr)} style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${takeoutYear === yr ? violet : border}`,
                  background: takeoutYear === yr ? violetMuted : "transparent",
                  color: takeoutYear === yr ? violetText : textMuted,
                  transition: "all 0.15s",
                }}>Yr {yr}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={actionBtn}>&#x2193; Export .xlsx</button>
          </div>
        </div>

        {/* Takeout Loan Parameters */}
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

        {/* Takeout Test Results - KPI Strip */}
        <div style={cardStyle}>
          <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { label: `Yr ${takeoutYear} NOI`, value: "$344,447", sub: "Stabilized", color: text },
              { label: "Takeout DSCR", value: "1.42x", sub: "Min 1.25x required", color: successText, pass: true },
              { label: "Takeout LTV", value: "66.7%", sub: "Max 75% allowed", color: successText, pass: true },
              { label: "Debt Yield", value: "10.8%", sub: "Min 8.0% required", color: successText, pass: true },
              { label: "Test Result", value: "PASS", sub: "All covenants met", color: success, isBadge: true },
            ].map((m, i) => (
              <div key={i} style={metricBox}>
                <span style={metricLabel}>{m.label}</span>
                {m.isBadge ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 700, background: successMuted, color: successText }}>{m.value}</span>
                  </span>
                ) : (
                  <span style={{ ...metricValue, fontSize: 18, color: m.color || text }}>{m.value}</span>
                )}
                <span style={{ fontSize: 10, color: m.pass ? successText : textDim }}>{m.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-side: Bridge vs Takeout */}
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
                  <th style={{ ...th, fontWeight: 700, color: text }}>Yr {takeoutYear} Pro Forma</th>
                  <th style={{ ...th, color: violetText }}>Takeout Test</th>
                  <th style={{ ...th, width: 100 }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue */}
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>REVENUE</td></tr>
                {[
                  { label: "Gross Potential Rent", t12: "$486,000", yr: "$531,065", takeout: "$531,065", var: "\u2014" },
                  { label: "Other Income", t12: "$24,000", yr: "$26,226", takeout: "$26,226", var: "\u2014" },
                  { label: "Less: Vacancy (4%)", t12: "", yr: "-$21,243", takeout: "-$21,243", var: "\u2014", neg: true },
                  { label: "Less: Credit Loss (1%)", t12: "", yr: "-$5,311", takeout: "-$5,311", var: "\u2014", neg: true },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...tdLeft, color: row.neg ? destructiveText : text }}>{row.label}</td>
                    <td style={{ ...td, color: gold }}>{row.t12}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{row.yr}</td>
                    <td style={{ ...td, color: violetText }}>{row.takeout}</td>
                    <td style={{ ...td, color: textDim }}>{row.var}</td>
                  </tr>
                ))}
                <tr style={subtotalRow}>
                  <td style={{ ...tdLeft, fontWeight: 600 }}>Effective Gross Income</td>
                  <td style={{ ...td, color: gold, fontWeight: 600 }}>$480,300</td>
                  <td style={{ ...td, fontWeight: 700 }}>$530,737</td>
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$530,737</td>
                  <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                </tr>

                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>

                {/* Expenses */}
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>OPERATING EXPENSES</td></tr>
                {[
                  { label: "Property Taxes", t12: "$42,000", yr: "$44,558", takeout: "$44,558" },
                  { label: "Insurance", t12: "$18,000", yr: "$19,096", takeout: "$19,096" },
                  { label: "Management Fee", t12: "$30,600", yr: "$31,844", takeout: "$31,844" },
                  { label: "Repairs & Maint.", t12: "$36,000", yr: "$38,192", takeout: "$38,192" },
                  { label: "Utilities", t12: "$21,600", yr: "$22,915", takeout: "$22,915" },
                  { label: "G&A / Other", t12: "$12,000", yr: "$12,731", takeout: "$12,731" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={tdLeft}>{row.label}</td>
                    <td style={{ ...td, color: gold }}>{row.t12}</td>
                    <td style={td}>{row.yr}</td>
                    <td style={{ ...td, color: violetText }}>{row.takeout}</td>
                    <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                  </tr>
                ))}
                <tr style={subtotalRow}>
                  <td style={{ ...tdLeft, fontWeight: 600 }}>Total Operating Expenses</td>
                  <td style={{ ...td, color: gold, fontWeight: 600 }}>$160,200</td>
                  <td style={{ ...td, fontWeight: 700 }}>$169,336</td>
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$169,336</td>
                  <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                </tr>

                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>

                {/* NOI */}
                <tr style={{ ...totalRow, background: "rgba(34,197,94,0.04)" }}>
                  <td style={{ ...tdLeft, fontWeight: 700, fontSize: 14 }}>Net Operating Income</td>
                  <td style={{ ...td, color: gold, fontWeight: 700, fontSize: 14 }}>$349,800</td>
                  <td style={{ ...td, fontWeight: 700, fontSize: 14, color: successText }}>$344,447</td>
                  <td style={{ ...td, fontWeight: 700, fontSize: 14, color: violetText }}>$344,447</td>
                  <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                </tr>

                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>

                {/* DEBT SERVICE - this is where bridge vs takeout diverge */}
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>DEBT SERVICE</td></tr>
                <tr>
                  <td style={tdLeft}>Annual Debt Service</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  <td style={{ ...td, fontWeight: 500 }}>$198,000</td>
                  <td style={{ ...td, fontWeight: 600, color: violetText }}>$242,688</td>
                  <td style={{ ...td, color: warningText, fontWeight: 600 }}>+$44,688</td>
                </tr>
                <tr style={{ background: "rgba(139,92,246,0.04)" }}>
                  <td style={{ ...tdLeft, fontSize: 11, color: textDim, paddingLeft: 28 }}>
                    Bridge: 8.5% IO on $3.0M &nbsp;|&nbsp; Takeout: 6.5% amort on $3.2M
                  </td>
                  <td colSpan={4} style={{ border: "none" }} />
                </tr>

                <tr><td colSpan={5} style={{ height: 4, border: "none" }} /></tr>

                <tr style={totalRow}>
                  <td style={{ ...tdLeft, fontWeight: 700 }}>Net Cash Flow</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  <td style={{ ...td, fontWeight: 700, color: successText }}>$146,447</td>
                  <td style={{ ...td, fontWeight: 700, color: violetText }}>$101,759</td>
                  <td style={{ ...td, color: warningText, fontWeight: 600 }}>-$44,688</td>
                </tr>

                <tr><td colSpan={5} style={{ height: 8, border: "none" }} /></tr>

                {/* TAKEOUT METRICS */}
                <tr><td colSpan={5} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>TAKEOUT COVENANT TESTS</td></tr>
                {[
                  { label: "DSCR", bridge: "1.74x", takeout: "1.42x", min: "Min 1.25x", pass: true },
                  { label: "LTV at Takeout", bridge: "62.5%", takeout: "66.7%", min: "Max 75%", pass: true },
                  { label: "Debt Yield", bridge: "11.5%", takeout: "10.8%", min: "Min 8.0%", pass: true },
                  { label: "Cash-on-Cash", bridge: "9.8%", takeout: "6.8%", min: "\u2014", pass: true },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={tdLeft}>{row.label}</td>
                    <td style={{ ...td, color: textDim }}>{"\u2014"}</td>
                    <td style={{ ...td, color: successText }}>{row.bridge}</td>
                    <td style={{ ...td, color: row.pass ? violetText : destructiveText, fontWeight: 600 }}>{row.takeout}</td>
                    <td style={{ ...td }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: row.pass ? successMuted : "rgba(239,68,68,0.1)",
                        color: row.pass ? successText : destructiveText,
                      }}>
                        {row.pass ? "Pass" : "Fail"} {row.min !== "\u2014" ? `(${row.min})` : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sensitivity Analysis */}
        <div style={cardStyle}>
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sectionTitle}>Takeout DSCR Sensitivity</span>
            <span style={{ fontSize: 11, color: textMuted }}>What if NOI or rate changes?</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: cardAlt }}>
                  <th style={{ ...thLeft, width: 140 }}>NOI \ RATE</th>
                  <th style={th}>5.50%</th>
                  <th style={th}>6.00%</th>
                  <th style={{ ...th, fontWeight: 700, color: violetText, background: violetMuted }}>6.50%</th>
                  <th style={th}>7.00%</th>
                  <th style={th}>7.50%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { noi: "$310,000 (-10%)", vals: ["1.43x", "1.36x", "1.28x", "1.20x", "1.13x"], base: false },
                  { noi: "$327,000 (-5%)", vals: ["1.51x", "1.43x", "1.35x", "1.27x", "1.19x"], base: false },
                  { noi: "$344,447 (base)", vals: ["1.59x", "1.51x", "1.42x", "1.33x", "1.25x"], base: true },
                  { noi: "$362,000 (+5%)", vals: ["1.67x", "1.59x", "1.49x", "1.40x", "1.32x"], base: false },
                  { noi: "$379,000 (+10%)", vals: ["1.75x", "1.66x", "1.56x", "1.47x", "1.38x"], base: false },
                ].map((row, i) => (
                  <tr key={i} style={row.base ? { background: "rgba(139,92,246,0.04)" } : {}}>
                    <td style={{ ...tdLeft, fontWeight: row.base ? 600 : 400, color: row.base ? violetText : textMuted, fontSize: 12 }}>{row.noi}</td>
                    {row.vals.map((v, j) => {
                      const num = parseFloat(v);
                      const isBase = row.base && j === 2;
                      return (
                        <td key={j} style={{
                          ...td,
                          fontWeight: isBase ? 700 : 400,
                          color: num < 1.25 ? destructiveText : num < 1.35 ? warningText : successText,
                          background: isBase ? violetMuted : "transparent",
                        }}>{v}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "8px 24px", borderTop: `1px solid ${border}`, display: "flex", gap: 16 }}>
              <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={success} /> Above 1.35x</span>
              <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={warning} /> 1.25x - 1.35x</span>
              <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><StatusDot color={destructive} /> Below 1.25x</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Operating Pro Forma (default view) ─── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Toggle on={showTakeout} onToggle={() => setShowTakeout(!showTakeout)} labelOff="Operating" labelOn="Takeout Test" />
          <span style={pillBadge(successText, successMuted)}><StatusDot color={success} /> Synced</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={actionBtn}>&#x2193; Export .xlsx</button>
          <button style={actionBtn}>&#x26F6;</button>
        </div>
      </div>

      {/* Growth Assumptions - inline collapsible */}
      <div style={cardStyle}>
        <div style={{ padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}`, background: cardAlt }}>
          <span style={{ ...microLabel, fontSize: 11 }}>ASSUMPTIONS</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { l: "Hold", v: "5 yr" },
              { l: "Entry Cap", v: "7.2%" },
              { l: "Exit Cap", v: "6.5%" },
              { l: "Rent Growth", v: "3.0%" },
              { l: "Expense Growth", v: "3.0%" },
              { l: "Vacancy", v: "5% > 4%" },
              { l: "Mgmt Fee", v: "6% EGI" },
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
            { label: "Yr 1 DSCR", value: "1.35x", color: successText },
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

      {/* Pro Forma Table */}
      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 220 }}>CASH FLOW PROJECTIONS</th>
                <th style={{ ...th, color: gold }}>T-12</th>
                <th style={th}>YEAR 0</th>
                <th style={{ ...th, fontWeight: 700, color: text }}>YEAR 1</th>
                <th style={th}>YEAR 2</th>
                <th style={th}>YEAR 3</th>
                <th style={th}>YEAR 4</th>
                <th style={th}>YEAR 5</th>
              </tr>
            </thead>
            <tbody>
              {/* Growth rows */}
              {[
                { label: "Income Growth", vals: ["", "", "3.0%", "3.0%", "3.0%", "3.0%", "3.0%"] },
                { label: "Vacancy", vals: ["", "", "5.0%", "4.0%", "4.0%", "4.0%", "4.0%"] },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, color: textMuted, fontSize: 12 }}>{row.label}</td>
                  {row.vals.map((v, j) => <td key={j} style={v ? td : tdMuted}>{v}</td>)}
                </tr>
              ))}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* REVENUE */}
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>REVENUE</td></tr>
              {[
                { label: "Gross Potential Rent", t12: "$486,000", vals: ["$500,580", "$515,597", "$531,065", "$546,997", "$563,407"] },
                { label: "Other Income", t12: "$24,000", vals: ["$24,720", "$25,462", "$26,226", "$27,013", "$27,823"] },
                { label: "Less: Vacancy", t12: "", vals: ["-$25,029", "-$20,624", "-$21,243", "-$21,880", "-$22,537"], neg: true },
                { label: "Less: Credit Loss", t12: "", vals: ["-$10,012", "-$7,734", "-$5,311", "-$5,470", "-$5,634"], neg: true },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, color: row.neg ? destructiveText : text }}>{row.label}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, color: row.neg ? destructiveText : text, fontWeight: j === 0 ? 600 : 400 }}>{v}</td>)}
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Effective Gross Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$510,000</td>
                <td style={tdMuted}>{"\u2014"}</td>
                {["$490,259", "$512,701", "$530,737", "$546,660", "$563,059"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>)}
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* EXPENSES */}
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>OPERATING EXPENSES</td></tr>
              {[
                { label: "Property Taxes", t12: "$42,000", vals: ["$43,260", "$44,558", "$45,895", "$47,271", "$48,689"] },
                { label: "Insurance", t12: "$18,000", vals: ["$18,540", "$19,096", "$19,669", "$20,259", "$20,867"] },
                { label: "Management Fee", t12: "$30,600", vals: ["$29,416", "$30,762", "$31,844", "$32,800", "$33,784"] },
                { label: "Repairs & Maint.", t12: "$36,000", vals: ["$37,080", "$38,192", "$39,338", "$40,518", "$41,734"] },
                { label: "Utilities", t12: "$21,600", vals: ["$22,248", "$22,915", "$23,603", "$24,311", "$25,040"] },
                { label: "G&A / Other", t12: "$12,000", vals: ["$12,360", "$12,731", "$13,113", "$13,506", "$13,911"] },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, fontSize: 13 }}>{row.label}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  <td style={tdMuted}>{"\u2014"}</td>
                  {row.vals.map((v, j) => <td key={j} style={td}>{v}</td>)}
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Total Operating Expenses</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$160,200</td>
                <td style={tdMuted}>{"\u2014"}</td>
                {["$162,904", "$168,254", "$173,462", "$178,665", "$184,025"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>)}
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* NOI */}
              <tr style={{ ...totalRow, background: "rgba(34,197,94,0.04)" }}>
                <td style={{ ...tdLeft, fontWeight: 700, fontSize: 14 }}>Net Operating Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700, fontSize: 14 }}>$349,800</td>
                <td style={tdMuted}>{"\u2014"}</td>
                {["$327,355", "$344,447", "$357,275", "$367,995", "$379,034"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700, fontSize: 14, color: successText }}>{v}</td>)}
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* DEBT SERVICE */}
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>DEBT SERVICE</td></tr>
              <tr>
                <td style={tdLeft}>Senior Debt Service</td>
                <td style={tdMuted}>{"\u2014"}</td><td style={tdMuted}>{"\u2014"}</td>
                {["$198,000", "$198,000", "$198,000", "$198,000", "$198,000"].map((v, i) => <td key={i} style={td}>{v}</td>)}
              </tr>
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Net Cash Flow</td>
                <td style={tdMuted}>{"\u2014"}</td><td style={tdMuted}>{"\u2014"}</td>
                {["$129,355", "$146,447", "$159,275", "$169,995", "$181,034"].map((v, i) => <td key={i} style={{ ...td, fontWeight: 700, color: successText }}>{v}</td>)}
              </tr>

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* RETURN METRICS */}
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>RETURN METRICS</td></tr>
              {[
                { label: "DSCR", vals: ["1.65x", "1.74x", "1.80x", "1.86x", "1.91x"] },
                { label: "Cap Rate", vals: ["6.8%", "7.2%", "7.4%", "7.7%", "7.9%"] },
                { label: "Cash-on-Cash", vals: ["8.6%", "9.8%", "10.6%", "11.3%", "12.1%"] },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.label}</td>
                  <td style={tdMuted}>{"\u2014"}</td><td style={tdMuted}>{"\u2014"}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, color: successText }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── SUB-TAB: INCOME (unchanged from v2) ─── */
function IncomeTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* RENT ROLL */}
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
            { label: "Avg Rent/Unit", value: "$1,688" },
            { label: "Market Rent/Unit", value: "$1,785" },
            { label: "Loss-to-Lease", value: "5.4%", color: warningText },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={{ ...metricLabel, fontSize: 9 }}>{m.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: m.color || text }}>{m.value}</span>
            </div>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                {["UNIT", "TYPE", "SQFT", "STATUS", "TENANT", "CURRENT RENT", "MARKET RENT", "LEASE START", "LEASE END"].map((h, i) => (
                  <th key={i} style={i === 0 || i === 4 ? thLeft : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { unit: "101", type: "2BR/1BA", sqft: "850", status: "occupied", tenant: "J. Martinez", current: "$1,650", market: "$1,750", start: "03/2025", end: "02/2026" },
                { unit: "102", type: "1BR/1BA", sqft: "625", status: "occupied", tenant: "A. Chen", current: "$1,350", market: "$1,425", start: "06/2025", end: "05/2026" },
                { unit: "103", type: "2BR/1BA", sqft: "850", status: "vacant", tenant: "\u2014", current: "\u2014", market: "$1,750", start: "\u2014", end: "\u2014" },
                { unit: "104", type: "Studio", sqft: "450", status: "occupied", tenant: "R. Williams", current: "$1,100", market: "$1,150", start: "01/2026", end: "12/2026" },
                { unit: "105", type: "2BR/2BA", sqft: "975", status: "occupied", tenant: "K. Patel", current: "$1,850", market: "$1,950", start: "09/2025", end: "08/2026" },
                { unit: "106", type: "1BR/1BA", sqft: "625", status: "down", tenant: "\u2014", current: "\u2014", market: "$1,425", start: "\u2014", end: "\u2014" },
              ].map((row, i) => {
                const statusColors = { occupied: success, vacant: warning, down: destructive };
                return (
                  <tr key={i} style={{ cursor: "pointer" }}>
                    <td style={{ ...tdLeft, fontWeight: 600 }}>{row.unit}</td>
                    <td style={td}>{row.type}</td>
                    <td style={td}>{row.sqft}</td>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <StatusDot color={statusColors[row.status]} />
                        <span style={{ fontSize: 12, textTransform: "capitalize" }}>{row.status}</span>
                      </span>
                    </td>
                    <td style={tdLeft}>{row.tenant}</td>
                    <td style={td}>{row.current}</td>
                    <td style={td}>{row.market}</td>
                    <td style={{ ...td, color: textMuted }}>{row.start}</td>
                    <td style={{ ...td, color: textMuted }}>{row.end}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "10px 24px", borderTop: `1px solid ${border}` }}>
            <button style={{ background: "none", border: "none", color: accent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Show 18 more units...</button>
          </div>
        </div>
      </div>

      {/* OTHER INCOME */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Other Income Sources</span>
          <button style={actionBtn}>+ Add Source</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: "30%" }}>SOURCE</th>
              <th style={th}>CURRENT ANNUAL</th>
              <th style={th}>STABILIZED ANNUAL</th>
              <th style={th}>GROWTH RATE</th>
              <th style={th}>$/UNIT</th>
            </tr>
          </thead>
          <tbody>
            {[
              { source: "Parking", current: "$12,000", stabilized: "$14,400", growth: "3.0%", perUnit: "$600" },
              { source: "Laundry", current: "$6,000", stabilized: "$6,000", growth: "2.0%", perUnit: "$250" },
              { source: "Pet Fees", current: "$3,600", stabilized: "$4,800", growth: "0.0%", perUnit: "$200" },
              { source: "Storage Units", current: "$2,400", stabilized: "$3,600", growth: "3.0%", perUnit: "$150" },
            ].map((row, i) => (
              <tr key={i} style={{ cursor: "pointer" }}>
                <td style={tdLeft}>{row.source}</td>
                <td style={td}>{row.current}</td>
                <td style={td}>{row.stabilized}</td>
                <td style={td}>{row.growth}</td>
                <td style={{ ...td, color: textMuted }}>{row.perUnit}</td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Total Other Income</td>
              <td style={{ ...td, fontWeight: 700 }}>$24,000</td>
              <td style={{ ...td, fontWeight: 700 }}>$28,800</td>
              <td style={td}></td>
              <td style={{ ...td, color: textMuted, fontWeight: 600 }}>$1,200</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* T-12 HISTORICAL INCOME */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sectionTitle}>T-12 / Historical Income</span>
            <span style={pillBadge(gold, goldMuted)}>Trailing 12</span>
          </div>
          <button style={actionBtn}>+ Add Line</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: "35%" }}>LINE ITEM</th>
              <th style={{ ...th, color: gold }}>T-12 AMOUNT</th>
              <th style={th}>DEDUCTION</th>
              <th style={th}>$/UNIT</th>
            </tr>
          </thead>
          <tbody>
            {[
              { item: "Gross Potential Rent", amount: "$486,000", deduction: false, perUnit: "$20,250" },
              { item: "Ancillary Income", amount: "$24,000", deduction: false, perUnit: "$1,000" },
              { item: "Less: Vacancy Loss", amount: "$25,500", deduction: true, perUnit: "$1,063" },
              { item: "Less: Concessions", amount: "$4,200", deduction: true, perUnit: "$175" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ ...tdLeft, color: row.deduction ? destructiveText : text }}>{row.item}</td>
                <td style={{ ...td, color: row.deduction ? destructiveText : gold, fontWeight: 600 }}>{row.deduction ? `-$${row.amount.replace("$", "")}` : row.amount}</td>
                <td style={{ ...td, color: textDim }}>{row.deduction ? "Yes" : "\u2014"}</td>
                <td style={{ ...td, color: textMuted }}>{row.perUnit}</td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Effective Gross Income (T-12)</td>
              <td style={{ ...td, fontWeight: 700, color: gold }}>$480,300</td>
              <td style={td}></td>
              <td style={{ ...td, fontWeight: 600, color: textMuted }}>$20,013</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* INCOME SUMMARY */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Income Summary</span>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Gross Potential Rent (from Rent Roll)", value: "$486,000" },
            { label: "+ Other Income", value: "$24,000" },
            { label: "= Gross Potential Income", value: "$510,000", bold: true },
            { label: "- Vacancy (5.0%)", value: "-$25,500", color: destructiveText },
            { label: "- Credit Loss (2.0%)", value: "-$10,200", color: destructiveText },
            { label: "= Effective Gross Income", value: "$474,300", bold: true, color: successText },
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

/* ─────────────────────── SUB-TAB: EXPENSES (unchanged from v2) ─── */
function ExpensesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={sectionTitle}>Operating Expense Detail</span>
            <span style={pillBadge(gold, goldMuted)}>T-12 + Yr 1 Projections</span>
          </div>
          <button style={actionBtn}>+ Add Line</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>CATEGORY</th>
                <th style={{ ...th, color: gold }}>T-12 ACTUAL</th>
                <th style={{ ...th, fontWeight: 700, color: text }}>YR 1 OVERRIDE</th>
                <th style={th}>GROWTH %</th>
                <th style={th}>% OF EGI</th>
                <th style={th}>$/UNIT</th>
                <th style={th}>T12 vs YR 1</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "Property Taxes", t12: "$42,000", yr1: "$43,260", growth: "3.0%", pctEGI: "9.1%", perUnit: "$1,803", var: "+3.0%", vc: warningText },
                { cat: "Insurance", t12: "$18,000", yr1: "$18,540", growth: "3.0%", pctEGI: "3.9%", perUnit: "$773", var: "+3.0%", vc: warningText },
                { cat: "Utilities", t12: "$21,600", yr1: "$22,248", growth: "3.0%", pctEGI: "4.7%", perUnit: "$927", var: "+3.0%", vc: warningText },
                { cat: "Repairs & Maintenance", t12: "$36,000", yr1: "$37,080", growth: "3.0%", pctEGI: "7.8%", perUnit: "$1,545", var: "+3.0%", vc: warningText },
                { cat: "Management Fee", t12: "$30,600", yr1: "6% of EGI", growth: "\u2014", pctEGI: "6.0%", perUnit: "$1,226", var: "\u2014", isPct: true },
                { cat: "Contract Services", t12: "$8,400", yr1: "$8,652", growth: "3.0%", pctEGI: "1.8%", perUnit: "$361", var: "+3.0%", vc: warningText },
                { cat: "Payroll", t12: "$14,400", yr1: "$14,832", growth: "3.0%", pctEGI: "3.1%", perUnit: "$618", var: "+3.0%", vc: warningText },
                { cat: "Marketing", t12: "$3,600", yr1: "$3,708", growth: "3.0%", pctEGI: "0.8%", perUnit: "$155", var: "+3.0%", vc: warningText },
                { cat: "G&A / Other", t12: "$12,000", yr1: "$12,360", growth: "3.0%", pctEGI: "2.6%", perUnit: "$515", var: "+3.0%", vc: warningText },
                { cat: "Replacement Reserve", t12: "\u2014", yr1: "$6,000", growth: "\u2014", pctEGI: "1.3%", perUnit: "$250", var: "\u2014" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.cat}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{row.yr1}</td>
                  <td style={td}>{row.growth}</td>
                  <td style={{ ...td, color: textMuted }}>{row.pctEGI}</td>
                  <td style={{ ...td, color: textMuted }}>{row.perUnit}</td>
                  <td style={{ ...td, color: row.vc || textMuted }}>{row.var}</td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Total Operating Expenses</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$186,600</td>
                <td style={{ ...td, fontWeight: 700 }}>$166,680</td>
                <td style={td}></td>
                <td style={{ ...td, fontWeight: 600 }}>35.1%</td>
                <td style={{ ...td, fontWeight: 600 }}>$6,945</td>
                <td style={{ ...td, color: successText, fontWeight: 600 }}>-10.7%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Expense Ratio", value: "35.1%", sub: "of EGI" },
          { label: "OpEx / Unit", value: "$6,945", sub: "annual" },
          { label: "NOI Margin", value: "64.9%", sub: "of EGI" },
          { label: "T-12 vs Yr 1", value: "-10.7%", sub: "improvement", color: successText },
        ].map((m, i) => (
          <div key={i} style={{ ...cardStyle, padding: "16px 20px" }}>
            <span style={metricLabel}>{m.label}</span>
            <div style={{ ...metricValue, fontSize: 22, color: m.color || text, marginTop: 4 }}>{m.value}</div>
            <span style={{ fontSize: 11, color: textDim }}>{m.sub}</span>
          </div>
        ))}
      </div>

      {/* NOI Summary */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>NOI Summary</span>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Effective Gross Income", value: "$474,300" },
            { label: "- Total Operating Expenses", value: "-$166,680", color: destructiveText },
            { label: "= Net Operating Income (Yr 1)", value: "$307,620", bold: true, color: successText },
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

/* ─────────────────────── SUB-TAB: CAPITAL STACK (merged S&U + Financing + Waterfall) ─── */
function CapitalStackTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ──── SECTION 1: SOURCES & USES ──── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <span style={sectionTitle}>Uses of Capital</span>
            <button style={actionBtn}>+ Add Line</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: cardAlt }}><th style={thLeft}>USE</th><th style={th}>AMOUNT</th><th style={th}>$/UNIT</th><th style={th}>% OF TOTAL</th></tr></thead>
            <tbody>
              {[
                { use: "Purchase Price", amount: "$4,800,000", perUnit: "$200,000", pct: "83.5%" },
                { use: "Renovation / CapEx", amount: "$600,000", perUnit: "$25,000", pct: "10.4%" },
                { use: "Closing Costs", amount: "$192,000", perUnit: "$8,000", pct: "3.3%" },
                { use: "Reserves", amount: "$96,000", perUnit: "$4,000", pct: "1.7%" },
                { use: "Acquisition Fee", amount: "$60,000", perUnit: "$2,500", pct: "1.0%" },
              ].map((row, i) => (
                <tr key={i}><td style={tdLeft}>{row.use}</td><td style={td}>{row.amount}</td><td style={{ ...td, color: textMuted }}>{row.perUnit}</td><td style={{ ...td, color: textMuted }}>{row.pct}</td></tr>
              ))}
              <tr style={totalRow}><td style={{ ...tdLeft, fontWeight: 700 }}>Total Uses</td><td style={{ ...td, fontWeight: 700 }}>$5,748,000</td><td style={{ ...td, fontWeight: 600, color: textMuted }}>$239,500</td><td style={{ ...td, fontWeight: 600 }}>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div style={cardStyle}>
          <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
            <span style={sectionTitle}>Sources of Capital</span>
            <button style={actionBtn}>+ Add Source</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: cardAlt }}><th style={thLeft}>SOURCE</th><th style={th}>AMOUNT</th><th style={th}>% OF TOTAL</th></tr></thead>
            <tbody>
              {[
                { source: "Senior Loan", amount: "$3,000,000", pct: "52.2%" },
                { source: "LP Equity", amount: "$2,473,200", pct: "43.0%" },
                { source: "GP Co-Invest (10%)", amount: "$274,800", pct: "4.8%" },
              ].map((row, i) => (
                <tr key={i}><td style={tdLeft}>{row.source}</td><td style={td}>{row.amount}</td><td style={{ ...td, color: textMuted }}>{row.pct}</td></tr>
              ))}
              <tr style={totalRow}><td style={{ ...tdLeft, fontWeight: 700 }}>Total Sources</td><td style={{ ...td, fontWeight: 700 }}>$5,748,000</td><td style={{ ...td, fontWeight: 600 }}>100%</td></tr>
            </tbody>
          </table>
          <div style={{ padding: "12px 24px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot color={success} />
            <span style={{ fontSize: 12, color: successText }}>Sources = Uses (balanced)</span>
          </div>
        </div>
      </div>

      {/* ──── SECTION 2: FINANCING STRUCTURE ──── */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Financing Structure</span>
          <button style={actionBtn}>+ Add Tranche</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={thLeft}>TRANCHE</th><th style={th}>AMOUNT</th><th style={th}>RATE</th><th style={th}>TERM</th><th style={th}>IO PERIOD</th><th style={th}>AMORT</th><th style={th}>LTV</th><th style={th}>ANNUAL DS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdLeft}><span style={{ fontWeight: 500 }}>Senior Bridge</span> <span style={{ fontSize: 11, color: textMuted }}>First Lien</span></td>
              <td style={td}>$3,000,000</td><td style={td}>8.5%</td><td style={td}>36 mo</td><td style={td}>24 mo</td><td style={td}>30 yr</td><td style={td}>62.5%</td><td style={td}>$198,000</td>
            </tr>
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Total Debt</td>
              <td style={{ ...td, fontWeight: 700 }}>$3,000,000</td>
              <td colSpan={5} style={{ border: "none" }} />
              <td style={{ ...td, fontWeight: 700 }}>$198,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──── SECTION 3: WATERFALL ──── */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Distribution Waterfall</span>
          <button style={actionBtn}>+ Add Tier</button>
        </div>

        {/* Waterfall KPIs inline */}
        <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, borderBottom: `1px solid ${border}`, background: cardAlt }}>
          {[
            { label: "LP IRR", value: "15.8%", color: successText },
            { label: "LP Equity Multiple", value: "1.92x", color: successText },
            { label: "GP IRR", value: "28.4%" },
            { label: "GP Equity Multiple", value: "3.1x" },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={{ ...metricLabel, fontSize: 9 }}>{m.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: m.color || text }}>{m.value}</span>
            </div>
          ))}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: 60 }}>TIER</th><th style={thLeft}>DESCRIPTION</th><th style={th}>HURDLE</th><th style={th}>LP SPLIT</th><th style={th}>GP SPLIT</th><th style={th}>CATCH-UP</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tier: 1, desc: "Return of Capital", hurdle: "\u2014", lp: "100%", gp: "0%", catchup: "\u2014" },
              { tier: 2, desc: "Preferred Return", hurdle: "8.0%", lp: "100%", gp: "0%", catchup: "\u2014" },
              { tier: 3, desc: "GP Catch-Up", hurdle: "12.0%", lp: "0%", gp: "100%", catchup: "Yes" },
              { tier: 4, desc: "Above Hurdle 1", hurdle: "15.0%", lp: "70%", gp: "30%", catchup: "\u2014" },
              { tier: 5, desc: "Above Hurdle 2", hurdle: "20.0%", lp: "60%", gp: "40%", catchup: "\u2014" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ ...tdLeft, color: textMuted }}>{row.tier}</td>
                <td style={{ ...tdLeft, fontWeight: 500 }}>{row.desc}</td>
                <td style={td}>{row.hurdle}</td><td style={td}>{row.lp}</td><td style={td}>{row.gp}</td>
                <td style={{ ...td, color: row.catchup === "Yes" ? warningText : textMuted }}>{row.catchup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──── SECTION 4: PROJECTED DISTRIBUTIONS ──── */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Projected Distributions</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>DISTRIBUTION</th>
                <th style={th}>YR 1</th><th style={th}>YR 2</th><th style={th}>YR 3</th><th style={th}>YR 4</th><th style={th}>YR 5</th><th style={th}>SALE</th><th style={{ ...th, fontWeight: 700, color: text }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Net Cash Flow", vals: ["$129K", "$146K", "$159K", "$170K", "$181K", "\u2014", "$786K"] },
                { label: "Net Sale Proceeds", vals: ["\u2014", "\u2014", "\u2014", "\u2014", "\u2014", "$2.78M", "$2.78M"] },
                { label: "Total Distributable", vals: ["$129K", "$146K", "$159K", "$170K", "$181K", "$2.78M", "$3.57M"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400, color: v === "\u2014" ? textDim : (j === row.vals.length - 1 ? successText : text) }}>{v}</td>)}
                </tr>
              ))}

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>LP DISTRIBUTIONS</td></tr>
              {[
                { label: "Pref Return (8%)", vals: ["$129K", "$146K", "$159K", "$170K", "$181K", "$0", "$786K"] },
                { label: "Residual Split (70%)", vals: ["$0", "$0", "$0", "$0", "$0", "$1.73M", "$1.73M"] },
                { label: "Total to LP", vals: ["$129K", "$146K", "$159K", "$170K", "$181K", "$1.73M", "$2.52M"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400, paddingLeft: row.bold ? 14 : 28 }}>{row.label}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400, color: j === row.vals.length - 1 && row.bold ? successText : text }}>{v}</td>)}
                </tr>
              ))}

              <tr><td colSpan={8} style={{ height: 4, border: "none" }} /></tr>
              <tr><td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>GP DISTRIBUTIONS</td></tr>
              {[
                { label: "Catch-Up", vals: ["$0", "$0", "$0", "$0", "$0", "$308K", "$308K"] },
                { label: "Promote (30%)", vals: ["$0", "$0", "$0", "$0", "$0", "$743K", "$743K"] },
                { label: "Total to GP", vals: ["$0", "$0", "$0", "$0", "$0", "$1.05M", "$1.05M"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400, paddingLeft: row.bold ? 14 : 28 }}>{row.label}</td>
                  {row.vals.map((v, j) => <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400 }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── UPLOAD WIZARD MODAL ─────────────────────── */
function ImportWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [uploadType, setUploadType] = useState(null);

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 };
  const modal = { background: "#1A1A1E", borderRadius: 16, border: `1px solid ${border}`, width: 720, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" };
  const modalHeader = { padding: "18px 24px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" };
  const modalBody = { padding: 24, overflowY: "auto", flex: 1 };
  const modalFooter = { padding: "14px 24px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" };
  const stepDot = (active, done) => ({ width: 8, height: 8, borderRadius: "50%", background: done ? success : active ? accent : "#3F3F46", transition: "all 0.2s" });
  const stepLabelStyle = (active) => ({ fontSize: 11, color: active ? text : textMuted, fontWeight: active ? 600 : 400 });
  const btnPrimary = { ...actionBtn, background: accent, borderColor: accent, color: "#fff", fontWeight: 600 };
  const btnGhost = { ...actionBtn, borderColor: "transparent" };

  const steps = ["Upload", "Map", "Preview", "Confirm"];

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>Import Financial Data</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: textMuted }}>Upload a rent roll, operating statement, or both from a single file</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: textMuted, fontSize: 18, cursor: "pointer", padding: 4 }}>&#x2715;</button>
        </div>

        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={stepDot(step === i + 1, step > i + 1)} />
              <span style={stepLabelStyle(step === i + 1)}>{s}</span>
              {i < steps.length - 1 && <span style={{ color: "#3F3F46", margin: "0 4px" }}>{"\u2192"}</span>}
            </div>
          ))}
        </div>

        <div style={modalBody}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p style={{ ...microLabel, marginBottom: 12 }}>WHAT ARE YOU IMPORTING?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { key: "t12", title: "T-12 Statement", desc: "Operating statement with income and expense line items", icon: "$" },
                    { key: "rentroll", title: "Rent Roll", desc: "Unit-level rent data with tenant, sqft, and lease info", icon: "#" },
                    { key: "both", title: "Both (Combined)", desc: "File contains rent roll and operating statement on separate tabs", icon: "+" },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => setUploadType(opt.key)} style={{ padding: 16, borderRadius: 10, border: `1px solid ${uploadType === opt.key ? accent : border}`, background: uploadType === opt.key ? accentMuted : card, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: uploadType === opt.key ? accent : "#27272A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: uploadType === opt.key ? "#fff" : textMuted, marginBottom: 10, fontWeight: 700 }}>{opt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>{opt.title}</div>
                      <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.4 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {uploadType && (
                <div style={{ border: `2px dashed ${border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x1F4C4;</div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: text, margin: "0 0 4px" }}>Drop your file here or click to browse</p>
                  <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Supports .xlsx, .xls, .csv (max 10MB)</p>
                  <p style={{ fontSize: 11, color: textDim, margin: "8px 0 0" }}>Works with exports from Rent Manager, AppFolio, Buildium, QuickBooks, and custom spreadsheets</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: successMuted, border: `1px solid rgba(34,197,94,0.2)` }}>
                <StatusDot color={success} />
                <span style={{ fontSize: 12, color: successText }}>File parsed successfully: "221_Riggs_T12_2025.xlsx" (2 sheets detected)</span>
              </div>
              <div>
                <p style={{ ...microLabel, marginBottom: 10 }}>SHEET TAB ASSIGNMENT</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { sheet: "Sheet 1: Income & Expenses", mapped: "T-12 Statement", rows: "42 rows detected" },
                    { sheet: "Sheet 2: Unit Detail", mapped: "Rent Roll", rows: "24 rows detected" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, border: `1px solid ${border}`, background: card }}>
                      <span style={{ fontSize: 13, color: text, flex: 1 }}>{s.sheet}</span>
                      <span style={{ fontSize: 11, color: textMuted }}>{s.rows}</span>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: accentMuted, color: accent }}>{s.mapped}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ ...microLabel, marginBottom: 10 }}>T-12 COLUMN MAPPING (sample)</p>
                <div style={cardStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: cardAlt }}>
                        <th style={thLeft}>YOUR COLUMN</th><th style={th}>AUTO-MAPPED TO</th><th style={th}>CONFIDENCE</th><th style={{ ...th, width: 80 }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { col: "Gross Rental Income", mapped: "Gross Potential Rent", conf: "98%", confColor: successText },
                        { col: "Vacancy/Credit Loss", mapped: "Vacancy Loss", conf: "72%", confColor: warningText },
                        { col: "R.E. Taxes", mapped: "Property Taxes", conf: "95%", confColor: successText },
                        { col: "Maint & Repairs", mapped: "Repairs & Maintenance", conf: "90%", confColor: successText },
                      ].map((row, i) => (
                        <tr key={i}>
                          <td style={{ ...tdLeft, fontWeight: 500 }}>{row.col}</td>
                          <td style={td}><span style={{ padding: "2px 8px", borderRadius: 4, background: accentMuted, color: accent, fontSize: 12 }}>{row.mapped}</span></td>
                          <td style={{ ...td, color: row.confColor }}>{row.conf}</td>
                          <td style={{ ...td, textAlign: "center" }}><span style={{ fontSize: 11, color: accent, cursor: "pointer" }}>Edit</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontSize: 13, color: textMuted, margin: 0 }}>Review parsed data before importing. Editable fields are highlighted.</p>
              <div>
                <p style={{ ...microLabel, marginBottom: 10 }}>T-12 INCOME (4 line items)</p>
                <div style={cardStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: cardAlt }}><th style={thLeft}>LINE ITEM</th><th style={th}>AMOUNT</th><th style={th}>TYPE</th></tr></thead>
                    <tbody>
                      {[
                        { item: "Gross Potential Rent", amount: "$486,000", type: "Income" },
                        { item: "Ancillary Income", amount: "$24,000", type: "Income" },
                        { item: "Vacancy Loss", amount: "$25,500", type: "Deduction" },
                        { item: "Concessions", amount: "$4,200", type: "Deduction" },
                      ].map((r, i) => (
                        <tr key={i}><td style={tdLeft}>{r.item}</td><td style={{ ...td, color: r.type === "Deduction" ? destructiveText : successText }}>{r.type === "Deduction" ? `-${r.amount}` : r.amount}</td><td style={{ ...td, color: textMuted }}>{r.type}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p style={{ ...microLabel, marginBottom: 10 }}>RENT ROLL (24 units, showing 4)</p>
                <div style={cardStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: cardAlt }}><th style={thLeft}>UNIT</th><th style={th}>TYPE</th><th style={th}>SQFT</th><th style={th}>STATUS</th><th style={th}>CURRENT</th><th style={th}>MARKET</th></tr></thead>
                    <tbody>
                      {[
                        { unit: "101", type: "2BR/1BA", sqft: "850", status: "Occupied", current: "$1,650", market: "$1,750" },
                        { unit: "102", type: "1BR/1BA", sqft: "625", status: "Occupied", current: "$1,350", market: "$1,425" },
                        { unit: "103", type: "2BR/1BA", sqft: "850", status: "Vacant", current: "\u2014", market: "$1,750" },
                        { unit: "104", type: "Studio", sqft: "450", status: "Occupied", current: "$1,100", market: "$1,150" },
                      ].map((r, i) => (
                        <tr key={i}><td style={{ ...tdLeft, fontWeight: 600 }}>{r.unit}</td><td style={td}>{r.type}</td><td style={td}>{r.sqft}</td><td style={{ ...td, color: r.status === "Vacant" ? warningText : successText }}>{r.status}</td><td style={td}>{r.current}</td><td style={td}>{r.market}</td></tr>
                      ))}
                      <tr><td colSpan={6} style={{ padding: "8px 14px", borderBottom: `1px solid ${border}`, fontSize: 12, color: accent, cursor: "pointer" }}>+ 20 more units...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: successMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>&#x2713;</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: text }}>Import Complete</h3>
              <p style={{ fontSize: 13, color: textMuted, textAlign: "center", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
                Successfully imported 24 rent roll units, 4 income line items, and 9 expense categories from "221_Riggs_T12_2025.xlsx"
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, width: "100%", maxWidth: 480, marginTop: 8 }}>
                {[
                  { label: "Rent Roll", value: "24 units", sub: "22 occupied, 1 vacant, 1 down" },
                  { label: "T-12 Income", value: "$480,300", sub: "EGI after deductions" },
                  { label: "T-12 Expenses", value: "$186,600", sub: "38.8% expense ratio" },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${border}`, background: card, textAlign: "center" }}>
                    <div style={{ ...metricLabel, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: successText }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: textDim, marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: textMuted, margin: "8px 0 0" }}>Pro Forma will recalculate automatically using imported data.</p>
            </div>
          )}
        </div>

        <div style={modalFooter}>
          <button onClick={step === 4 ? onClose : () => setStep(Math.max(1, step - 1))} style={btnGhost}>
            {step === 1 ? "Cancel" : step === 4 ? "Close" : "Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {step < 4 && (
              <button onClick={() => setStep(Math.min(4, step + 1))} style={{ ...btnPrimary, opacity: step === 1 && !uploadType ? 0.5 : 1 }}>
                {step === 3 ? "Import Data" : "Continue"}
                <span style={{ marginLeft: 4 }}>{"\u2192"}</span>
              </button>
            )}
            {step === 4 && (
              <button onClick={onClose} style={btnPrimary}>Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
const SUB_TABS = [
  { key: "proforma", label: "Pro Forma" },
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "capital-stack", label: "Capital Stack" },
];

export default function UnderwritingTabV3() {
  const [activeTab, setActiveTab] = useState("proforma");
  const [showImport, setShowImport] = useState(false);

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      {showImport && <ImportWizard onClose={() => setShowImport(false)} />}

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
            <span style={{ fontSize: 13, color: textMuted }}>MHC</span>
            <span style={{ fontSize: 13, color: textMuted, fontVariantNumeric: "tabular-nums" }}>$3,000,000</span>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div style={{ padding: "14px 32px 0", display: "flex", gap: 0, borderBottom: `1px solid ${border}` }}>
        {["Overview", "Property", "Underwriting", "Borrower", "Forms", "Diligence", "Messages"].map((tab) => (
          <button key={tab} style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === "Underwriting" ? 600 : 400, color: tab === "Underwriting" ? text : textMuted, background: "transparent", border: "none", cursor: "pointer", borderBottom: tab === "Underwriting" ? `2px solid ${text}` : "2px solid transparent", marginBottom: -1 }}>
            {tab}
          </button>
        ))}
      </div>

      {/* UW Sub-Tab Navigation + Import Button */}
      <div style={{ padding: "14px 32px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "inline-flex", gap: 4, background: card, padding: 4, borderRadius: 10, border: `1px solid ${border}` }}>
          {SUB_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(activeTab === tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowImport(true)} style={{ ...actionBtnPrimary, gap: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600 }}>
          &#x2191; Import Financials
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "24px 32px 48px" }}>
        {activeTab === "proforma" && <ProFormaTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "capital-stack" && <CapitalStackTab />}
      </div>
    </div>
  );
}
