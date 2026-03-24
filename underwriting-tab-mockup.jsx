import { useState } from "react";

/* ─────────────────── simple text-based icon stand-ins ─────────────────── */
const Icon = ({ children, size = 14, style = {} }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size - 2, lineHeight: 1, flexShrink: 0, ...style }}>{children}</span>
);
const TrendingUp = ({ size, style }) => <Icon size={size} style={style}>&#x2197;</Icon>;
const DollarSign = ({ size, style }) => <Icon size={size} style={style}>$</Icon>;
const Building2 = ({ size, style }) => <Icon size={size} style={style}>&#x1F3E2;</Icon>;
const Settings2 = ({ size, style }) => <Icon size={size} style={style}>&#x2699;</Icon>;
const Layers = ({ size, style }) => <Icon size={size} style={style}>&#x25A7;</Icon>;
const PieChart = ({ size, style }) => <Icon size={size} style={style}>&#x25D4;</Icon>;
const ExternalLink = ({ size, style }) => <Icon size={size} style={style}>&#x2197;</Icon>;
const Plus = ({ size, style }) => <Icon size={size} style={style}>+</Icon>;
const FileSpreadsheet = ({ size, style }) => <Icon size={size} style={style}>&#x1F4CA;</Icon>;
const Info = ({ size, style }) => <Icon size={size} style={style}>&#x24D8;</Icon>;
const BarChart3 = ({ size, style }) => <Icon size={size} style={style}>&#x2581;</Icon>;
const Calculator = ({ size, style }) => <Icon size={size} style={style}>&#x1F5A9;</Icon>;
const ArrowUpRight = ({ size, style }) => <Icon size={size} style={style}>&#x2197;</Icon>;
const Link2 = ({ size, style }) => <Icon size={size} style={style}>&#x1F517;</Icon>;
const Maximize2 = ({ size, style }) => <Icon size={size} style={style}>&#x26F6;</Icon>;
const RefreshCw = ({ size, style }) => <Icon size={size} style={style}>&#x21BB;</Icon>;

/* ─────────────────────── colour tokens (dark mode) ─────────────────────── */
const bg = "#0D0D0D";
const card = "#171717";
const cardAlt = "#1C1C1C";
const border = "#292929";
const borderFocus = "#3F3F3F";
const text = "#F5F5F5";
const textMuted = "#8A8A8A";
const textDim = "#6A6A6A";
const primary = "#F5F5F5";
const accent = "#2563EB";
const accentMuted = "rgba(37,99,235,0.12)";
const success = "#22C55E";
const successMuted = "rgba(34,197,94,0.12)";
const successText = "#4ADE80";
const warning = "#F59E0B";
const warningMuted = "rgba(245,158,11,0.12)";
const warningText = "#FBBF24";
const destructive = "#EF4444";
const destructiveMuted = "rgba(239,68,68,0.1)";
const destructiveText = "#F87171";
const gold = "#C5975B";
const goldMuted = "rgba(197,151,91,0.12)";

/* ─────────────────────── shared styles ─────────────────────── */
const tabStyle = (active) => ({
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  color: active ? text : textMuted,
  background: active ? "#292929" : "transparent",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
});

const sectionTitle = {
  fontSize: 13,
  fontWeight: 600,
  color: text,
  margin: 0,
  letterSpacing: "0.01em",
};

const microLabel = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: textMuted,
};

const th = {
  ...microLabel,
  padding: "9px 14px",
  borderBottom: `2px solid ${border}`,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const thLeft = { ...th, textAlign: "left" };

const td = {
  padding: "9px 14px",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  color: text,
  textAlign: "right",
  verticalAlign: "middle",
  borderBottom: `1px solid ${border}`,
};

const tdLeft = { ...td, textAlign: "left" };

const tdMuted = { ...td, color: textMuted };

const totalRow = {
  borderTop: `2px solid ${border}`,
  background: "rgba(255,255,255,0.02)",
  fontWeight: 600,
};

const pillBadge = (color, bgColor) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  color,
  background: bgColor,
});

const cardStyle = {
  background: card,
  borderRadius: 12,
  border: `1px solid ${border}`,
  overflow: "hidden",
};

const panelPad = { padding: 24 };

const actionBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: 8,
  border: `1px solid ${border}`,
  background: "transparent",
  color: textMuted,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
};

const metricBox = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const metricValue = {
  fontSize: 20,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: text,
};

const metricLabel = {
  ...microLabel,
};

const divider = { borderTop: `1px solid ${border}`, margin: 0 };

/* ─────────────────────── sub-tab content ─────────────────────── */

function ProFormaTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={pillBadge(successText, successMuted)}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: success, display: "inline-block" }} />
            Synced
          </span>
          <button style={actionBtn}><RefreshCw size={13} /> Refresh</button>
          <button style={actionBtn}><Link2 size={13} /> Link Google Sheet</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={actionBtn}><FileSpreadsheet size={13} /> Export .xlsx</button>
          <button style={actionBtn}><Maximize2 size={13} /></button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ ...cardStyle }}>
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {[
            { label: "Going-In Cap", value: "7.2%", trend: null },
            { label: "Exit Cap", value: "6.5%", trend: null },
            { label: "Yr 1 DSCR", value: "1.35x", trend: "up" },
            { label: "Avg Cash-on-Cash", value: "9.8%", trend: "up" },
            { label: "5-Yr IRR", value: "18.2%", trend: "up" },
            { label: "Equity Multiple", value: "2.1x", trend: null },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={metricLabel}>{m.label}</span>
              <span style={{ ...metricValue, fontSize: 18, color: m.trend === "up" ? successText : text }}>
                {m.value}
                {m.trend === "up" && <ArrowUpRight size={14} style={{ marginLeft: 2, verticalAlign: "middle" }} />}
              </span>
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
              {/* Growth assumptions row */}
              <tr>
                <td style={{ ...tdLeft, color: textMuted, fontSize: 12 }}>Income Growth</td>
                <td style={tdMuted}></td>
                <td style={tdMuted}></td>
                {["3.0%", "3.0%", "3.0%", "3.0%", "3.0%"].map((v, i) => (
                  <td key={i} style={td}>{v}</td>
                ))}
              </tr>
              <tr>
                <td style={{ ...tdLeft, color: textMuted, fontSize: 12 }}>Vacancy</td>
                <td style={tdMuted}></td>
                <td style={tdMuted}></td>
                {["5.0%", "4.0%", "4.0%", "4.0%", "4.0%"].map((v, i) => (
                  <td key={i} style={td}>{v}</td>
                ))}
              </tr>

              {/* Spacer */}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* REVENUE section */}
              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>
                  <TrendingUp size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  REVENUE
                </td>
              </tr>
              {[
                { label: "Gross Potential Rent", t12: "$486,000", vals: ["$500,580", "$515,597", "$531,065", "$546,997", "$563,407"] },
                { label: "Other Income", t12: "$24,000", vals: ["$24,720", "$25,462", "$26,226", "$27,013", "$27,823"] },
                { label: "Less: Vacancy", t12: "", vals: ["-$25,029", "-$20,624", "-$21,243", "-$21,880", "-$22,537"], negative: true },
                { label: "Less: Credit Loss", t12: "", vals: ["-$10,012", "-$7,734", "-$5,311", "-$5,470", "-$5,634"], negative: true },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, color: row.negative ? destructiveText : text, fontSize: 13 }}>{row.label}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  <td style={tdMuted}>—</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, color: row.negative ? destructiveText : text, fontWeight: j === 0 ? 600 : 400 }}>{v}</td>
                  ))}
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Effective Gross Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$510,000</td>
                <td style={tdMuted}>—</td>
                {["$490,259", "$512,701", "$530,737", "$546,660", "$563,059"].map((v, i) => (
                  <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>
                ))}
              </tr>

              {/* Spacer */}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* EXPENSES section */}
              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>
                  <DollarSign size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  OPERATING EXPENSES
                </td>
              </tr>
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
                  <td style={tdMuted}>—</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={td}>{v}</td>
                  ))}
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Total Operating Expenses</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$160,200</td>
                <td style={tdMuted}>—</td>
                {["$162,904", "$168,254", "$173,462", "$178,665", "$184,025"].map((v, i) => (
                  <td key={i} style={{ ...td, fontWeight: 700 }}>{v}</td>
                ))}
              </tr>

              {/* Spacer */}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* NOI */}
              <tr style={{ ...totalRow, background: "rgba(34,197,94,0.04)" }}>
                <td style={{ ...tdLeft, fontWeight: 700, fontSize: 14 }}>Net Operating Income</td>
                <td style={{ ...td, color: gold, fontWeight: 700, fontSize: 14 }}>$349,800</td>
                <td style={tdMuted}>—</td>
                {["$327,355", "$344,447", "$357,275", "$367,995", "$379,034"].map((v, i) => (
                  <td key={i} style={{ ...td, fontWeight: 700, fontSize: 14, color: successText }}>{v}</td>
                ))}
              </tr>

              {/* Spacer */}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* DEBT SERVICE */}
              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>
                  <Layers size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  DEBT SERVICE
                </td>
              </tr>
              <tr>
                <td style={{ ...tdLeft, fontSize: 13 }}>Senior Debt Service</td>
                <td style={tdMuted}>—</td>
                <td style={tdMuted}>—</td>
                {["$198,000", "$198,000", "$198,000", "$198,000", "$198,000"].map((v, i) => (
                  <td key={i} style={td}>{v}</td>
                ))}
              </tr>
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Net Cash Flow</td>
                <td style={tdMuted}>—</td>
                <td style={tdMuted}>—</td>
                {["$129,355", "$146,447", "$159,275", "$169,995", "$181,034"].map((v, i) => (
                  <td key={i} style={{ ...td, fontWeight: 700, color: successText }}>{v}</td>
                ))}
              </tr>

              {/* Spacer */}
              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              {/* RETURN METRICS */}
              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>
                  <BarChart3 size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  RETURN METRICS
                </td>
              </tr>
              {[
                { label: "DSCR", vals: ["1.65x", "1.74x", "1.80x", "1.86x", "1.91x"] },
                { label: "Cap Rate", vals: ["6.8%", "7.2%", "7.4%", "7.7%", "7.9%"] },
                { label: "Cash-on-Cash", vals: ["8.6%", "9.8%", "10.6%", "11.3%", "12.1%"] },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ ...tdLeft, fontSize: 13 }}>{row.label}</td>
                  <td style={tdMuted}>—</td>
                  <td style={tdMuted}>—</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, color: parseFloat(v) > 1.25 || parseFloat(v) > 7 ? successText : text }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IncomeTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Source callout - rent roll lives on Property tab */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: accentMuted, border: `1px solid rgba(37,99,235,0.2)` }}>
        <Info size={15} style={{ color: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: text }}>
          Rent roll data is managed on the <strong>Property</strong> tab.
          Income projections below are derived from rent roll + ancillary sources.
        </span>
        <button style={{ ...actionBtn, marginLeft: "auto", borderColor: "rgba(37,99,235,0.3)", color: accent, fontSize: 11 }}>
          <ExternalLink size={12} /> Go to Property Tab
        </button>
      </div>

      {/* Rent Roll Summary (read-only, pulled from Property tab) */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={15} style={{ color: textMuted }} />
            <span style={sectionTitle}>Rent Roll Summary</span>
            <span style={pillBadge(textMuted, "rgba(255,255,255,0.05)")}>From Property Tab</span>
          </div>
          <span style={{ fontSize: 12, color: textMuted }}>24 units</span>
        </div>
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {[
            { label: "Monthly Rent", value: "$40,500" },
            { label: "Annual GPR", value: "$486,000" },
            { label: "Occupancy", value: "92%" },
            { label: "Avg Rent/Unit", value: "$1,688" },
            { label: "Market Rent/Unit", value: "$1,785" },
            { label: "Loss-to-Lease", value: "5.4%" },
          ].map((m, i) => (
            <div key={i} style={metricBox}>
              <span style={metricLabel}>{m.label}</span>
              <span style={{ ...metricValue, fontSize: 16 }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ancillary / Other Income (editable) */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign size={15} style={{ color: textMuted }} />
            <span style={sectionTitle}>Other Income Sources</span>
          </div>
          <button style={actionBtn}><Plus size={13} /> Add Source</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: "35%" }}>SOURCE</th>
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

      {/* Gross Income Waterfall */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Income Summary</span>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Gross Potential Rent (from Rent Roll)", value: "$486,000", color: text },
            { label: "+ Other Income", value: "$24,000", color: text },
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

function ExpensesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Source callout */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: goldMuted, border: `1px solid rgba(197,151,91,0.2)` }}>
        <Info size={15} style={{ color: gold, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: text }}>
          T-12 actuals are sourced from the <strong>Property</strong> tab.
          Year 1 overrides and growth rates are editable here.
        </span>
        <button style={{ ...actionBtn, marginLeft: "auto", borderColor: "rgba(197,151,91,0.3)", color: gold, fontSize: 11 }}>
          <ExternalLink size={12} /> Go to Property Tab
        </button>
      </div>

      {/* Expense Detail Table */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Operating Expense Detail</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={actionBtn}><Plus size={13} /> Add Line</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>CATEGORY</th>
                <th style={{ ...th, color: gold }}>T-12 ACTUAL</th>
                <th style={{ ...th, fontWeight: 700, color: text }}>YR 1 OVERRIDE</th>
                <th style={th}>GROWTH %</th>
                <th style={th}>% OF EGI</th>
                <th style={th}>$/UNIT</th>
                <th style={th}>VARIANCE</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "Property Taxes", t12: "$42,000", yr1: "$43,260", growth: "3.0%", pctEGI: "9.1%", perUnit: "$1,803", variance: "+3.0%", varColor: warningText },
                { cat: "Insurance", t12: "$18,000", yr1: "$18,540", growth: "3.0%", pctEGI: "3.9%", perUnit: "$773", variance: "+3.0%", varColor: warningText },
                { cat: "Utilities", t12: "$21,600", yr1: "$22,248", growth: "3.0%", pctEGI: "4.7%", perUnit: "$927", variance: "+3.0%", varColor: warningText },
                { cat: "Repairs & Maintenance", t12: "$36,000", yr1: "$37,080", growth: "3.0%", pctEGI: "7.8%", perUnit: "$1,545", variance: "+3.0%", varColor: warningText },
                { cat: "Management Fee", t12: "$30,600", yr1: "6% of EGI", growth: "—", pctEGI: "6.0%", perUnit: "$1,226", variance: "—", isPct: true },
                { cat: "Contract Services", t12: "$8,400", yr1: "$8,652", growth: "3.0%", pctEGI: "1.8%", perUnit: "$361", variance: "+3.0%", varColor: warningText },
                { cat: "G&A / Other", t12: "$12,000", yr1: "$12,360", growth: "3.0%", pctEGI: "2.6%", perUnit: "$515", variance: "+3.0%", varColor: warningText },
                { cat: "Replacement Reserve", t12: "—", yr1: "$6,000", growth: "—", pctEGI: "1.3%", perUnit: "$250", variance: "—" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.cat}</td>
                  <td style={{ ...td, color: gold }}>{row.t12}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{row.yr1}</td>
                  <td style={td}>{row.growth}</td>
                  <td style={{ ...td, color: textMuted }}>{row.pctEGI}</td>
                  <td style={{ ...td, color: textMuted }}>{row.perUnit}</td>
                  <td style={{ ...td, color: row.varColor || textMuted }}>{row.variance}</td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>Total Operating Expenses</td>
                <td style={{ ...td, color: gold, fontWeight: 700 }}>$168,600</td>
                <td style={{ ...td, fontWeight: 700 }}>$148,140</td>
                <td style={td}></td>
                <td style={{ ...td, fontWeight: 600 }}>37.2%</td>
                <td style={{ ...td, fontWeight: 600 }}>$7,400</td>
                <td style={td}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Ratio KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Expense Ratio", value: "37.2%", sub: "of EGI" },
          { label: "OpEx / Unit", value: "$7,400", sub: "annual" },
          { label: "NOI Margin", value: "62.8%", sub: "of EGI" },
          { label: "T-12 vs Yr 1 OpEx", value: "-12.1%", sub: "improvement", color: successText },
        ].map((m, i) => (
          <div key={i} style={{ ...cardStyle, padding: "16px 20px" }}>
            <span style={metricLabel}>{m.label}</span>
            <div style={{ ...metricValue, fontSize: 22, color: m.color || text, marginTop: 4 }}>{m.value}</div>
            <span style={{ fontSize: 11, color: textDim }}>{m.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssumptionsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Deal Assumptions */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Deal Assumptions</span>
        </div>
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px 32px" }}>
          {[
            { label: "Hold Period", value: "5 years" },
            { label: "Entry Cap Rate", value: "7.2%" },
            { label: "Exit Cap Rate", value: "6.5%" },
            { label: "Disposition Cost", value: "2.0%" },
            { label: "Going-In Basis", value: "$4,800,000" },
            { label: "Price / Unit", value: "$200,000" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: textMuted }}>{f.label}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: text, padding: "4px 8px", borderRadius: 6, border: `1px solid transparent`, cursor: "pointer" }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Rate Arrays */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Growth Assumptions by Year</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>ASSUMPTION</th>
                <th style={th}>YEAR 1</th>
                <th style={th}>YEAR 2</th>
                <th style={th}>YEAR 3</th>
                <th style={th}>YEAR 4</th>
                <th style={th}>YEAR 5</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Rent Growth", vals: ["3.0%", "3.0%", "3.0%", "3.0%", "3.0%"] },
                { label: "Expense Growth", vals: ["3.0%", "3.0%", "3.0%", "3.0%", "3.0%"] },
                { label: "Vacancy", vals: ["5.0%", "4.0%", "4.0%", "4.0%", "4.0%"] },
                { label: "Credit Loss / Bad Debt", vals: ["2.0%", "1.5%", "1.0%", "1.0%", "1.0%"] },
                { label: "Management Fee", vals: ["6.0%", "6.0%", "6.0%", "6.0%", "6.0%"] },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, cursor: "pointer" }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financing */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Financing Structure</span>
          <button style={actionBtn}><Plus size={13} /> Add Tranche</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft }}>TRANCHE</th>
                <th style={th}>AMOUNT</th>
                <th style={th}>RATE</th>
                <th style={th}>TERM</th>
                <th style={th}>IO PERIOD</th>
                <th style={th}>AMORTIZATION</th>
                <th style={th}>LTV</th>
                <th style={th}>ANNUAL DS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdLeft}>
                  <span style={{ fontWeight: 500 }}>Senior Bridge</span>
                  <span style={{ fontSize: 11, color: textMuted, marginLeft: 8 }}>First Lien</span>
                </td>
                <td style={td}>$3,000,000</td>
                <td style={td}>8.5%</td>
                <td style={td}>36 mo</td>
                <td style={td}>24 mo</td>
                <td style={td}>30 yr</td>
                <td style={td}>62.5%</td>
                <td style={td}>$198,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SourcesUsesTab() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* USES */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Uses of Capital</span>
          <button style={actionBtn}><Plus size={13} /> Add Line</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={thLeft}>USE</th>
              <th style={th}>AMOUNT</th>
              <th style={th}>$/UNIT</th>
              <th style={th}>% OF TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {[
              { use: "Purchase Price", amount: "$4,800,000", perUnit: "$200,000", pct: "83.5%" },
              { use: "Renovation / CapEx", amount: "$600,000", perUnit: "$25,000", pct: "10.4%" },
              { use: "Closing Costs", amount: "$192,000", perUnit: "$8,000", pct: "3.3%" },
              { use: "Reserves", amount: "$96,000", perUnit: "$4,000", pct: "1.7%" },
              { use: "Acquisition Fee", amount: "$60,000", perUnit: "$2,500", pct: "1.0%" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={tdLeft}>{row.use}</td>
                <td style={td}>{row.amount}</td>
                <td style={{ ...td, color: textMuted }}>{row.perUnit}</td>
                <td style={{ ...td, color: textMuted }}>{row.pct}</td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Total Uses</td>
              <td style={{ ...td, fontWeight: 700 }}>$5,748,000</td>
              <td style={{ ...td, fontWeight: 600, color: textMuted }}>$239,500</td>
              <td style={{ ...td, fontWeight: 600 }}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SOURCES */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Sources of Capital</span>
          <button style={actionBtn}><Plus size={13} /> Add Source</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={thLeft}>SOURCE</th>
              <th style={th}>AMOUNT</th>
              <th style={th}>% OF TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {[
              { source: "Senior Loan", amount: "$3,000,000", pct: "52.2%" },
              { source: "LP Equity", amount: "$2,473,200", pct: "43.0%" },
              { source: "GP Co-Invest (10%)", amount: "$274,800", pct: "4.8%" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={tdLeft}>{row.source}</td>
                <td style={td}>{row.amount}</td>
                <td style={{ ...td, color: textMuted }}>{row.pct}</td>
              </tr>
            ))}
            <tr style={totalRow}>
              <td style={{ ...tdLeft, fontWeight: 700 }}>Total Sources</td>
              <td style={{ ...td, fontWeight: 700 }}>$5,748,000</td>
              <td style={{ ...td, fontWeight: 600 }}>100%</td>
            </tr>
          </tbody>
        </table>

        {/* Balance check */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: success }} />
          <span style={{ fontSize: 12, color: successText }}>Sources = Uses (balanced)</span>
        </div>
      </div>
    </div>
  );
}

function WaterfallTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Return Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "LP IRR", value: "15.8%", color: successText },
          { label: "LP Equity Multiple", value: "1.92x", color: successText },
          { label: "GP IRR", value: "28.4%", color: text },
          { label: "GP Equity Multiple", value: "3.1x", color: text },
        ].map((m, i) => (
          <div key={i} style={{ ...cardStyle, padding: "16px 20px" }}>
            <span style={metricLabel}>{m.label}</span>
            <div style={{ ...metricValue, fontSize: 24, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Waterfall Tiers */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Distribution Waterfall Structure</span>
          <button style={actionBtn}><Plus size={13} /> Add Tier</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: cardAlt }}>
              <th style={{ ...thLeft, width: 60 }}>TIER</th>
              <th style={thLeft}>DESCRIPTION</th>
              <th style={th}>HURDLE</th>
              <th style={th}>LP SPLIT</th>
              <th style={th}>GP SPLIT</th>
              <th style={th}>CATCH-UP</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tier: 1, desc: "Return of Capital", hurdle: "—", lp: "100%", gp: "0%", catchup: "—" },
              { tier: 2, desc: "Preferred Return", hurdle: "8.0%", lp: "100%", gp: "0%", catchup: "—" },
              { tier: 3, desc: "GP Catch-Up", hurdle: "12.0%", lp: "0%", gp: "100%", catchup: "Yes" },
              { tier: 4, desc: "Above Hurdle 1", hurdle: "15.0%", lp: "70%", gp: "30%", catchup: "—" },
              { tier: 5, desc: "Above Hurdle 2", hurdle: "20.0%", lp: "60%", gp: "40%", catchup: "—" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ ...tdLeft, color: textMuted }}>{row.tier}</td>
                <td style={{ ...tdLeft, fontWeight: 500 }}>{row.desc}</td>
                <td style={td}>{row.hurdle}</td>
                <td style={td}>{row.lp}</td>
                <td style={td}>{row.gp}</td>
                <td style={{ ...td, color: row.catchup === "Yes" ? warningText : textMuted }}>{row.catchup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cash Flow Distribution by Year */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}` }}>
          <span style={sectionTitle}>Projected Distributions</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: cardAlt }}>
                <th style={{ ...thLeft, width: 200 }}>DISTRIBUTION</th>
                <th style={th}>YEAR 1</th>
                <th style={th}>YEAR 2</th>
                <th style={th}>YEAR 3</th>
                <th style={th}>YEAR 4</th>
                <th style={th}>YEAR 5</th>
                <th style={th}>SALE</th>
                <th style={{ ...th, fontWeight: 700, color: text }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Net Cash Flow", vals: ["$129,355", "$146,447", "$159,275", "$169,995", "$181,034", "—", "$786,106"] },
                { label: "Net Sale Proceeds", vals: ["—", "—", "—", "—", "—", "$2,782,000", "$2,782,000"] },
                { label: "Total Distributable", vals: ["$129,355", "$146,447", "$159,275", "$169,995", "$181,034", "$2,782,000", "$3,568,106"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400, color: v === "—" ? textDim : (j === row.vals.length - 1 ? successText : text) }}>{v}</td>
                  ))}
                </tr>
              ))}

              <tr><td colSpan={8} style={{ height: 8, border: "none" }} /></tr>

              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>LP DISTRIBUTIONS</td>
              </tr>
              {[
                { label: "Pref Return (8%)", vals: ["$129,355", "$146,447", "$159,275", "$169,995", "$181,034", "$0", "$786,106"] },
                { label: "Residual Split (70%)", vals: ["$0", "$0", "$0", "$0", "$0", "$1,730,940", "$1,730,940"] },
                { label: "Total to LP", vals: ["$129,355", "$146,447", "$159,275", "$169,995", "$181,034", "$1,730,940", "$2,517,046"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400, paddingLeft: row.bold ? 14 : 28 }}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400, color: j === row.vals.length - 1 && row.bold ? successText : text }}>{v}</td>
                  ))}
                </tr>
              ))}

              <tr><td colSpan={8} style={{ height: 4, border: "none" }} /></tr>

              <tr>
                <td colSpan={8} style={{ ...tdLeft, ...microLabel, paddingTop: 8, paddingBottom: 4, borderBottom: "none" }}>GP DISTRIBUTIONS</td>
              </tr>
              {[
                { label: "Catch-Up", vals: ["$0", "$0", "$0", "$0", "$0", "$308,400", "$308,400"] },
                { label: "Promote (30%)", vals: ["$0", "$0", "$0", "$0", "$0", "$742,660", "$742,660"] },
                { label: "Total to GP", vals: ["$0", "$0", "$0", "$0", "$0", "$1,051,060", "$1,051,060"], bold: true },
              ].map((row, i) => (
                <tr key={i} style={row.bold ? totalRow : {}}>
                  <td style={{ ...tdLeft, fontWeight: row.bold ? 700 : 400, paddingLeft: row.bold ? 14 : 28 }}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} style={{ ...td, fontWeight: row.bold ? 700 : 400, color: j === row.vals.length - 1 && row.bold ? text : text }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── main component ─────────────────────── */

const SUB_TABS = [
  { key: "proforma", label: "Pro Forma", icon: TrendingUp },
  { key: "income", label: "Income", icon: DollarSign },
  { key: "expenses", label: "Expenses", icon: Calculator },
  { key: "assumptions", label: "Assumptions", icon: Settings2 },
  { key: "sources-uses", label: "Sources & Uses", icon: Layers },
  { key: "waterfall", label: "Waterfall", icon: PieChart },
];

export default function UnderwritingTabMockup() {
  const [activeTab, setActiveTab] = useState("proforma");

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Deal Header (simplified) */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 11, color: textMuted }}>Pipeline &rsaquo; Commercial Bridge &rsaquo; RL1127</span>
      </div>
      <div style={{ padding: "20px 32px 0", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#292929", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={20} style={{ color: textMuted }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>221 Riggs Road</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 2 }}>
            <span style={pillBadge(accent, accentMuted)}>COMM DEBT</span>
            <span style={{ fontSize: 13, color: textMuted }}>MHC</span>
            <span style={{ fontSize: 13, color: textMuted, fontVariantNumeric: "tabular-nums" }}>$3,000,000</span>
          </div>
        </div>
      </div>

      {/* Main Tab Bar (simplified - just showing UW active) */}
      <div style={{ padding: "16px 32px 0", display: "flex", gap: 4, borderBottom: `1px solid ${border}` }}>
        {["Overview", "Property", "Underwriting", "Borrower", "Forms", "Diligence", "Messages"].map((tab) => (
          <button key={tab} style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === "Underwriting" ? 600 : 400, color: tab === "Underwriting" ? text : textMuted, background: tab === "Underwriting" ? "#292929" : "transparent", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", borderBottom: tab === "Underwriting" ? `2px solid ${text}` : "2px solid transparent" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* UW Sub-Tab Navigation */}
      <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", gap: 4, background: "#171717", padding: 4, borderRadius: 10 }}>
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(active)}>
                <Icon size={14} style={{ opacity: active ? 1 : 0.5 }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "24px 32px 48px" }}>
        {activeTab === "proforma" && <ProFormaTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "assumptions" && <AssumptionsTab />}
        {activeTab === "sources-uses" && <SourcesUsesTab />}
        {activeTab === "waterfall" && <WaterfallTab />}
      </div>
    </div>
  );
}
