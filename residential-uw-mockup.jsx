import { useState } from "react";

/* ─────────────────── text-based icon stand-ins ─────────────────── */
const Icon = ({ children, size = 14, style = {} }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size - 2, lineHeight: 1, flexShrink: 0, ...style }}>{children}</span>
);
const Home = ({ size, style }) => <Icon size={size} style={style}>&#x2302;</Icon>;
const DollarSign = ({ size, style }) => <Icon size={size} style={style}>$</Icon>;
const Calculator = ({ size, style }) => <Icon size={size} style={style}>&#x1F5A9;</Icon>;
const Users = ({ size, style }) => <Icon size={size} style={style}>&#x263A;</Icon>;
const BarChart = ({ size, style }) => <Icon size={size} style={style}>&#x2581;</Icon>;
const CheckCircle = ({ size, style }) => <Icon size={size} style={style}>&#x2713;</Icon>;
const XCircle = ({ size, style }) => <Icon size={size} style={style}>&#x2717;</Icon>;
const ChevronDown = ({ size, style }) => <Icon size={size} style={style}>&#x25BE;</Icon>;
const ArrowRight = ({ size, style }) => <Icon size={size} style={style}>&#x2192;</Icon>;
const Shield = ({ size, style }) => <Icon size={size} style={style}>&#x26E8;</Icon>;
const FileSpreadsheet = ({ size, style }) => <Icon size={size} style={style}>&#x1F4CA;</Icon>;
const MapPin = ({ size, style }) => <Icon size={size} style={style}>&#x1F4CD;</Icon>;
const TrendingUp = ({ size, style }) => <Icon size={size} style={style}>&#x2197;</Icon>;
const AlertTriangle = ({ size, style }) => <Icon size={size} style={style}>&#x26A0;</Icon>;

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

const tdLabel = { ...tdLeft, fontWeight: 500 };

const kpiBox = {
  flex: 1,
  minWidth: 100,
  padding: "12px 16px",
  background: card,
  borderRadius: 10,
  border: `1px solid ${border}`,
};

const kpiValue = {
  fontSize: 18,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: text,
  margin: 0,
};

const kpiLabel = {
  ...microLabel,
  marginTop: 2,
};

const cardStyle = {
  background: card,
  borderRadius: 12,
  border: `1px solid ${border}`,
  overflow: "hidden",
};

const cardHeader = {
  padding: "14px 20px",
  borderBottom: `1px solid ${border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const cardBody = {
  padding: 20,
};

const toggleBtn = (active) => ({
  padding: "5px 14px",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  color: active ? text : textMuted,
  background: active ? accent : "transparent",
  border: `1px solid ${active ? accent : border}`,
  borderRadius: 6,
  cursor: "pointer",
  transition: "all 0.15s",
});

const inlineInput = {
  background: "transparent",
  border: `1px solid transparent`,
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 13,
  color: text,
  fontVariantNumeric: "tabular-nums",
  minWidth: 90,
  textAlign: "right",
  outline: "none",
  transition: "all 0.15s",
};

const fieldRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: `1px solid ${border}`,
};

const fieldLabel = {
  fontSize: 13,
  color: textMuted,
  fontWeight: 400,
};

const fieldValue = {
  fontSize: 13,
  color: text,
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
};

const badge = (color, bgColor) => ({
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "2px 8px",
  borderRadius: 4,
  color,
  background: bgColor,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
});

/* ─────────────────────── helper functions ─────────────────────── */
const fmt = (n) => {
  if (n === null || n === undefined) return "--";
  return "$" + Math.round(n).toLocaleString("en-US");
};

const fmtPct = (n, dec = 1) => {
  if (n === null || n === undefined) return "--";
  return n.toFixed(dec) + "%";
};

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function ResidentialUnderwritingMockup() {
  const [activeTab, setActiveTab] = useState("deal-analysis");
  const [program, setProgram] = useState("Premier");
  const [dealType, setDealType] = useState("rtl"); // rtl | dscr

  // ── Mock RTL Deal Data ──
  const deal = {
    purchasePrice: 185000,
    arv: 285000,
    rehabBudget: 52000,
    totalProjectCost: 185000 + 52000,
    loanAmount: 213300, // Computed from min(LTV, LTC, LTP)
    interestRate: 0.115,
    originationPts: 0.02,
    loanTermMonths: 12,
    holdingPeriodMonths: 6,
    exitSalePrice: 278000,
    dispositionPct: 0.06,
    fico: 720,
    experience: 8,
    citizenship: "US Citizen",
  };

  // ── Computed Values ──
  const totalCost = deal.purchasePrice + deal.rehabBudget;
  const ltv = (deal.loanAmount / deal.arv) * 100;
  const ltc = (deal.loanAmount / totalCost) * 100;
  const ltp = (deal.loanAmount / deal.purchasePrice) * 100;
  const originationFee = deal.loanAmount * deal.originationPts;
  const monthlyInterest = (deal.loanAmount * deal.interestRate) / 12;
  const totalInterest = monthlyInterest * deal.holdingPeriodMonths;
  const holdingCosts = totalInterest + 1800 + 900 + 600; // interest + insurance + taxes + utilities
  const totalProjectCost = totalCost + originationFee + holdingCosts + 3500; // + legal/closing
  const grossSaleProceeds = deal.exitSalePrice;
  const dispositionCosts = deal.exitSalePrice * deal.dispositionPct;
  const netSaleProceeds = grossSaleProceeds - dispositionCosts;
  const netProfit = netSaleProceeds - totalProjectCost;
  const roi = (netProfit / (totalProjectCost - deal.loanAmount)) * 100;
  const annualizedRoi = (roi / deal.holdingPeriodMonths) * 12;

  // ── Max loan sizing waterfall ──
  const maxLTV_val = deal.arv * 0.75;
  const maxLTC_val = totalCost * 0.90;
  const maxLTP_val = deal.purchasePrice * 0.90;
  const maxLoan = Math.min(maxLTV_val, maxLTC_val, maxLTP_val);
  const bindingConstraint = maxLoan === maxLTV_val ? "LTV" : maxLoan === maxLTC_val ? "LTC" : "LTP";

  // ── DSCR Mock Data ──
  const dscr = {
    monthlyRent: 2100,
    annualTaxes: 3600,
    annualInsurance: 1800,
    monthlyHOA: 0,
    loanAmount: 180000,
    interestRate: 0.0725,
    loanTermYears: 30,
  };

  const dscrMonthlyPI = (dscr.loanAmount * (dscr.interestRate / 12)) / (1 - Math.pow(1 + dscr.interestRate / 12, -dscr.loanTermYears * 12));
  const dscrMonthlyTaxes = dscr.annualTaxes / 12;
  const dscrMonthlyInsurance = dscr.annualInsurance / 12;
  const dscrPITIA = dscrMonthlyPI + dscrMonthlyTaxes + dscrMonthlyInsurance + dscr.monthlyHOA;
  const dscrRatio = dscr.monthlyRent / dscrPITIA;

  // ── Sub-tabs ──
  const TABS = [
    { key: "deal-analysis", label: "Deal Analysis", icon: Calculator },
    { key: "borrower", label: "Borrower & Eligibility", icon: Users },
    { key: "costs-returns", label: "Costs & Returns", icon: DollarSign },
    { key: "comps", label: "Comp Analysis", icon: MapPin },
  ];

  // ── Leverage Adjusters ──
  const [adjusters, setAdjusters] = useState({
    foreignNational: false,
    lowCredit: false,
    noExperience: false,
    rural: false,
    floodZone: false,
    cashOut: false,
    condoTownhouse: false,
    highRehab: false,
    extendedTerm: false,
    lowARVConfidence: false,
  });

  const adjusterList = [
    { key: "foreignNational", label: "Foreign National", condition: "Borrower lives outside US", impact: -5 },
    { key: "lowCredit", label: "Low Credit Score", condition: "FICO below 600", impact: -5 },
    { key: "noExperience", label: "No Experience", condition: "0 deals completed", impact: -5 },
    { key: "rural", label: "Rural Property", condition: "USDA Rural designation", impact: -5 },
    { key: "floodZone", label: "Flood Zone", condition: "FEMA flood zone", impact: -5 },
    { key: "cashOut", label: "Cash-Out / Refinance", condition: "Not an acquisition", impact: -5 },
    { key: "condoTownhouse", label: "Condo / Townhouse", condition: "Non-SFR property", impact: -3 },
    { key: "highRehab", label: "High Rehab-to-PP", condition: "Rehab > 50% of PP", impact: -5 },
    { key: "extendedTerm", label: "Extended Term", condition: "Term > 12 months", impact: -3 },
    { key: "lowARVConfidence", label: "Low ARV Confidence", condition: "Weak comp support", impact: -5 },
  ];

  const totalAdj = adjusterList.reduce((sum, a) => sum + (adjusters[a.key] ? a.impact : 0), 0);

  // ── Comp Data ──
  const comps = [
    { address: "142 Elm St", salePrice: 279000, saleDate: "Feb 2026", sqft: 1450, beds: 3, baths: 2, distance: "0.3 mi", condition: "Renovated", adj: 0 },
    { address: "88 Oak Ave", salePrice: 265000, saleDate: "Jan 2026", sqft: 1320, beds: 3, baths: 1.5, distance: "0.5 mi", condition: "Renovated", adj: +5000 },
    { address: "310 Pine Dr", salePrice: 291000, saleDate: "Dec 2025", sqft: 1510, beds: 3, baths: 2, distance: "0.8 mi", condition: "Renovated", adj: -3000 },
    { address: "17 Maple Ct", salePrice: 272000, saleDate: "Nov 2025", sqft: 1380, beds: 3, baths: 2, distance: "1.1 mi", condition: "Updated", adj: +8000 },
  ];

  const avgCompPrice = comps.reduce((s, c) => s + c.salePrice + c.adj, 0) / comps.length;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: bg, color: text, padding: 24, minHeight: "100vh" }}>

      {/* ── Deal Type Toggle ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ ...microLabel, marginTop: 0 }}>DEAL TYPE</span>
        <div style={{ display: "flex", gap: 4, background: cardAlt, borderRadius: 8, padding: 3, border: `1px solid ${border}` }}>
          <button style={toggleBtn(dealType === "rtl")} onClick={() => setDealType("rtl")}>Fix & Flip</button>
          <button style={toggleBtn(dealType === "dscr")} onClick={() => setDealType("dscr")}>DSCR Rental</button>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ ...toggleBtn(false), display: "flex", alignItems: "center", gap: 5, background: accent, color: "#fff", border: `1px solid ${accent}` }}>
          <FileSpreadsheet size={13} /> Export .xlsx
        </button>
      </div>

      {/* ── KPI Strip ── */}
      {dealType === "rtl" ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmtPct(ltv, 1)}</p>
            <p style={kpiLabel}>LTV (ARV)</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmtPct(ltc, 1)}</p>
            <p style={kpiLabel}>LTC</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmt(maxLoan)}</p>
            <p style={kpiLabel}>MAX LOAN ({bindingConstraint})</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmtPct(deal.interestRate * 100, 1)}</p>
            <p style={kpiLabel}>RATE</p>
          </div>
          <div style={kpiBox}>
            <p style={{ ...kpiValue, color: netProfit > 0 ? successText : destructiveText }}>{fmt(netProfit)}</p>
            <p style={kpiLabel}>NET PROFIT</p>
          </div>
          <div style={kpiBox}>
            <p style={{ ...kpiValue, color: annualizedRoi > 15 ? successText : warningText }}>{fmtPct(annualizedRoi, 1)}</p>
            <p style={kpiLabel}>ANN. ROI</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmtPct((dscr.loanAmount / deal.arv) * 100, 1)}</p>
            <p style={kpiLabel}>LTV</p>
          </div>
          <div style={kpiBox}>
            <p style={{ ...kpiValue, color: dscrRatio >= 1.25 ? successText : dscrRatio >= 1.0 ? warningText : destructiveText }}>{dscrRatio.toFixed(2)}x</p>
            <p style={kpiLabel}>DSCR</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmt(dscr.loanAmount)}</p>
            <p style={kpiLabel}>LOAN AMOUNT</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmtPct(dscr.interestRate * 100, 2)}</p>
            <p style={kpiLabel}>RATE</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmt(dscr.monthlyRent)}</p>
            <p style={kpiLabel}>MONTHLY RENT</p>
          </div>
          <div style={kpiBox}>
            <p style={kpiValue}>{fmt(dscr.monthlyRent - dscrPITIA)}</p>
            <p style={kpiLabel}>MONTHLY CASH FLOW</p>
          </div>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, marginBottom: 20, border: `1px solid ${border}` }}>
        {TABS.map((tab) => (
          <button key={tab.key} style={tabStyle(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: DEAL ANALYSIS
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "deal-analysis" && dealType === "rtl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Program Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: cardAlt, borderRadius: 10, border: `1px solid ${border}` }}>
            <Shield size={16} style={{ color: accent }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loan Program</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
              <button style={toggleBtn(program === "Premier")} onClick={() => setProgram("Premier")}>Premier</button>
              <button style={toggleBtn(program === "Balance Sheet")} onClick={() => setProgram("Balance Sheet")}>Balance Sheet</button>
            </div>
            {program === "Balance Sheet" && totalAdj !== 0 && (
              <span style={badge(warningText, warningMuted)}>
                <AlertTriangle size={10} /> {totalAdj}% adj applied
              </span>
            )}
          </div>

          {/* Two-column layout: Deal Inputs + Loan Sizing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Left: Deal Inputs */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={sectionTitle}>Deal Inputs</span>
              </div>
              <div style={cardBody}>
                {[
                  ["Purchase Price", fmt(deal.purchasePrice)],
                  ["After Repair Value (ARV)", fmt(deal.arv)],
                  ["Rehab Budget", fmt(deal.rehabBudget)],
                  ["Total Project Cost", fmt(totalCost)],
                  ["Loan Term", `${deal.loanTermMonths} months`],
                  ["Holding Period", `${deal.holdingPeriodMonths} months`],
                ].map(([label, value], i, arr) => (
                  <div key={label} style={{ ...fieldRow, borderBottom: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
                    <span style={fieldLabel}>{label}</span>
                    <input defaultValue={value} style={inlineInput} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Loan Sizing Waterfall */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={sectionTitle}>Loan Sizing</span>
                <span style={badge(accent, accentMuted)}>Binding: {bindingConstraint}</span>
              </div>
              <div style={cardBody}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Constraint</th>
                      <th style={th}>Max %</th>
                      <th style={th}>Basis</th>
                      <th style={th}>Max Loan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["LTV (ARV)", "75.0%", fmt(deal.arv), fmt(maxLTV_val), maxLoan === maxLTV_val],
                      ["LTC", "90.0%", fmt(totalCost), fmt(maxLTC_val), maxLoan === maxLTC_val],
                      ["LTP (Purchase)", "90.0%", fmt(deal.purchasePrice), fmt(maxLTP_val), maxLoan === maxLTP_val],
                    ].map(([label, pct, basis, loan, isBinding]) => (
                      <tr key={label} style={{ background: isBinding ? accentMuted : "transparent" }}>
                        <td style={{ ...tdLeft, fontWeight: isBinding ? 600 : 400, color: isBinding ? accent : text }}>{label} {isBinding && " *"}</td>
                        <td style={td}>{pct}</td>
                        <td style={td}>{basis}</td>
                        <td style={{ ...td, fontWeight: isBinding ? 700 : 400 }}>{loan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 16, padding: "14px 16px", background: accentMuted, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>Maximum Loan Amount</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: accent }}>{fmt(maxLoan)}</span>
                </div>

                {/* Program Terms Summary */}
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={microLabel}>PROGRAM TERMS ({program.toUpperCase()})</span>
                  {[
                    ["Interest Rate", fmtPct(deal.interestRate * 100, 1) + " Fixed"],
                    ["Origination Points", fmtPct(deal.originationPts * 100, 1)],
                    ["Origination Fee", fmt(originationFee)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: textMuted }}>{label}</span>
                      <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet Leverage Adjusters (only when Balance Sheet selected) */}
          {program === "Balance Sheet" && (
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={sectionTitle}>Leverage Adjusters</span>
                <span style={{ fontSize: 11, color: textMuted }}>Each adjuster reduces max LTC and LTV by the shown amount</span>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Risk Factor</th>
                      <th style={{ ...thLeft, width: 200 }}>Condition</th>
                      <th style={{ ...th, width: 80 }}>Applies?</th>
                      <th style={{ ...th, width: 100 }}>LTC / LTV Adj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjusterList.map((adj) => (
                      <tr key={adj.key}>
                        <td style={tdLabel}>{adj.label}</td>
                        <td style={{ ...tdLeft, color: textMuted, fontSize: 12 }}>{adj.condition}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <button
                            onClick={() => setAdjusters((prev) => ({ ...prev, [adj.key]: !prev[adj.key] }))}
                            style={{
                              width: 28, height: 28, borderRadius: 6,
                              border: `1px solid ${adjusters[adj.key] ? destructive : border}`,
                              background: adjusters[adj.key] ? destructiveMuted : "transparent",
                              color: adjusters[adj.key] ? destructiveText : textDim,
                              cursor: "pointer", fontSize: 13, fontWeight: 600,
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {adjusters[adj.key] ? "Y" : "N"}
                          </button>
                        </td>
                        <td style={{ ...td, color: adjusters[adj.key] ? destructiveText : textDim }}>
                          {adjusters[adj.key] ? `${adj.impact}%` : "--"}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr style={{ borderTop: `2px solid ${border}` }}>
                      <td style={{ ...tdLabel, fontWeight: 700 }}>Total Adjustment</td>
                      <td style={tdLeft} />
                      <td style={td} />
                      <td style={{ ...td, fontWeight: 700, color: totalAdj < 0 ? destructiveText : successText }}>
                        {totalAdj !== 0 ? `${totalAdj}%` : "--"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DSCR Deal Analysis ── */}
      {activeTab === "deal-analysis" && dealType === "dscr" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: Property & Loan */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Loan Terms</span>
            </div>
            <div style={cardBody}>
              {[
                ["Purchase Price", fmt(deal.purchasePrice)],
                ["Appraised Value", fmt(deal.arv)],
                ["Loan Amount", fmt(dscr.loanAmount)],
                ["LTV", fmtPct((dscr.loanAmount / deal.arv) * 100, 1)],
                ["Interest Rate", fmtPct(dscr.interestRate * 100, 2)],
                ["Loan Term", `${dscr.loanTermYears} years`],
                ["Monthly P&I", fmt(dscrMonthlyPI)],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{ ...fieldRow, borderBottom: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
                  <span style={fieldLabel}>{label}</span>
                  <input defaultValue={value} style={inlineInput} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: DSCR Analysis */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>DSCR Analysis</span>
              <span style={badge(dscrRatio >= 1.25 ? successText : warningText, dscrRatio >= 1.25 ? successMuted : warningMuted)}>
                {dscrRatio.toFixed(2)}x
              </span>
            </div>
            <div style={cardBody}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Item</th>
                    <th style={th}>Monthly</th>
                    <th style={th}>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tdLabel, color: successText }}>Gross Rental Income</td>
                    <td style={{ ...td, color: successText }}>{fmt(dscr.monthlyRent)}</td>
                    <td style={{ ...td, color: successText }}>{fmt(dscr.monthlyRent * 12)}</td>
                  </tr>
                  <tr style={{ borderTop: `2px solid ${border}` }}>
                    <td style={tdLabel}>Principal & Interest</td>
                    <td style={td}>{fmt(dscrMonthlyPI)}</td>
                    <td style={td}>{fmt(dscrMonthlyPI * 12)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabel}>Property Taxes</td>
                    <td style={td}>{fmt(dscrMonthlyTaxes)}</td>
                    <td style={td}>{fmt(dscr.annualTaxes)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabel}>Insurance</td>
                    <td style={td}>{fmt(dscrMonthlyInsurance)}</td>
                    <td style={td}>{fmt(dscr.annualInsurance)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabel}>HOA</td>
                    <td style={td}>{fmt(dscr.monthlyHOA) === "$0" ? "--" : fmt(dscr.monthlyHOA)}</td>
                    <td style={td}>{fmt(dscr.monthlyHOA * 12) === "$0" ? "--" : fmt(dscr.monthlyHOA * 12)}</td>
                  </tr>
                  <tr style={{ borderTop: `2px solid ${border}`, background: "rgba(255,255,255,0.02)" }}>
                    <td style={{ ...tdLabel, fontWeight: 700 }}>Total PITIA</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(dscrPITIA)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(dscrPITIA * 12)}</td>
                  </tr>
                  <tr style={{ background: dscrRatio >= 1.25 ? successMuted : warningMuted }}>
                    <td style={{ ...tdLabel, fontWeight: 700, color: dscrRatio >= 1.25 ? successText : warningText }}>
                      DSCR (Rent / PITIA)
                    </td>
                    <td colSpan={2} style={{ ...td, fontWeight: 700, fontSize: 18, color: dscrRatio >= 1.25 ? successText : warningText }}>
                      {dscrRatio.toFixed(2)}x
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Cash Flow Summary */}
              <div style={{ marginTop: 16, padding: "14px 16px", background: successMuted, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: successText }}>Monthly Cash Flow</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: successText }}>
                  {fmt(dscr.monthlyRent - dscrPITIA)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: BORROWER & ELIGIBILITY
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "borrower" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Left: Borrower Profile */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Borrower Profile</span>
            </div>
            <div style={cardBody}>
              {[
                ["Credit Score (FICO)", deal.fico.toString()],
                ["Experience (deals in 24mo)", deal.experience.toString()],
                ["Citizenship / Residency", deal.citizenship],
                ["Entity Type", "LLC"],
                ["Personal Guarantee", "Full Recourse"],
                ["Liquidity Verified", "$85,000"],
                ["Net Worth", "$420,000"],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{ ...fieldRow, borderBottom: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
                  <span style={fieldLabel}>{label}</span>
                  <input defaultValue={value} style={inlineInput} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Eligibility Check */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Eligibility Check ({program})</span>
              <span style={badge(successText, successMuted)}>
                <CheckCircle size={10} /> All Passed
              </span>
            </div>
            <div style={cardBody}>
              {[
                { label: "Minimum Credit Score", requirement: program === "Premier" ? "660 FICO" : "None", actual: deal.fico.toString(), pass: program === "Premier" ? deal.fico >= 660 : true },
                { label: "Minimum Experience", requirement: program === "Premier" ? "3 deals" : "None", actual: `${deal.experience} deals`, pass: program === "Premier" ? deal.experience >= 3 : true },
                { label: "Citizenship", requirement: "US Citizen / PR", actual: deal.citizenship, pass: true },
                { label: "Entity Required", requirement: program === "Premier" ? "LLC / Corp" : "Preferred", actual: "LLC", pass: true },
                { label: "Personal Guarantee", requirement: "Required", actual: "Full Recourse", pass: true },
                { label: "Appraisal", requirement: program === "Premier" ? "Full Appraisal" : "BPO Accepted", actual: "Ordered", pass: true },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: item.pass ? successMuted : destructiveMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.pass
                      ? <CheckCircle size={13} style={{ color: successText }} />
                      : <XCircle size={13} style={{ color: destructiveText }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>Requires: {item.requirement}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: item.pass ? successText : destructiveText }}>{item.actual}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3: COSTS & RETURNS
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "costs-returns" && dealType === "rtl" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Left: All Costs */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Project Costs</span>
            </div>
            <div style={cardBody}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Cost Item</th>
                    <th style={th}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Acquisition */}
                  <tr><td colSpan={2} style={{ ...td, borderBottom: `2px solid ${border}`, paddingTop: 14 }}><span style={microLabel}>ACQUISITION</span></td></tr>
                  <tr><td style={tdLabel}>Purchase Price</td><td style={td}>{fmt(deal.purchasePrice)}</td></tr>
                  <tr><td style={tdLabel}>Rehab Budget</td><td style={td}>{fmt(deal.rehabBudget)}</td></tr>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <td style={{ ...tdLabel, fontWeight: 700 }}>Total Basis</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(totalCost)}</td>
                  </tr>

                  {/* Loan Costs */}
                  <tr><td colSpan={2} style={{ ...td, borderBottom: `2px solid ${border}`, paddingTop: 14 }}><span style={microLabel}>LOAN COSTS</span></td></tr>
                  <tr><td style={tdLabel}>Origination Fee ({fmtPct(deal.originationPts * 100, 1)})</td><td style={td}>{fmt(originationFee)}</td></tr>
                  <tr><td style={tdLabel}>Legal / Doc Prep</td><td style={td}>{fmt(1500)}</td></tr>
                  <tr><td style={tdLabel}>Title / Closing / Escrow</td><td style={td}>{fmt(2000)}</td></tr>

                  {/* Holding Costs */}
                  <tr><td colSpan={2} style={{ ...td, borderBottom: `2px solid ${border}`, paddingTop: 14 }}><span style={microLabel}>HOLDING COSTS ({deal.holdingPeriodMonths} MO)</span></td></tr>
                  <tr><td style={tdLabel}>Interest ({fmtPct(deal.interestRate * 100, 1)} on {fmt(deal.loanAmount)})</td><td style={td}>{fmt(totalInterest)}</td></tr>
                  <tr><td style={tdLabel}>Insurance</td><td style={td}>{fmt(1800)}</td></tr>
                  <tr><td style={tdLabel}>Property Taxes</td><td style={td}>{fmt(900)}</td></tr>
                  <tr><td style={tdLabel}>Utilities</td><td style={td}>{fmt(600)}</td></tr>

                  {/* Total */}
                  <tr style={{ borderTop: `3px solid ${border}`, background: "rgba(255,255,255,0.03)" }}>
                    <td style={{ ...tdLabel, fontWeight: 700, fontSize: 14 }}>Total Project Cost</td>
                    <td style={{ ...td, fontWeight: 700, fontSize: 16 }}>{fmt(totalProjectCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Exit & Returns */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={sectionTitle}>Exit Analysis</span>
              </div>
              <div style={cardBody}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr><td style={tdLabel}>Projected Sale Price</td><td style={td}>{fmt(deal.exitSalePrice)}</td></tr>
                    <tr><td style={tdLabel}>Disposition Costs ({fmtPct(deal.dispositionPct * 100, 0)})</td><td style={{ ...td, color: destructiveText }}>({fmt(dispositionCosts)})</td></tr>
                    <tr style={{ borderTop: `2px solid ${border}` }}>
                      <td style={{ ...tdLabel, fontWeight: 700 }}>Net Sale Proceeds</td>
                      <td style={{ ...td, fontWeight: 700 }}>{fmt(netSaleProceeds)}</td>
                    </tr>
                    <tr>
                      <td style={tdLabel}>Less: Total Project Cost</td>
                      <td style={{ ...td, color: destructiveText }}>({fmt(totalProjectCost)})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profit Summary */}
            <div style={{ ...cardStyle, background: netProfit > 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${netProfit > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Net Profit</span>
                  <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: netProfit > 0 ? successText : destructiveText }}>{fmt(netProfit)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={kpiLabel}>CASH INVESTED</p>
                    <p style={{ ...fieldValue, fontSize: 15 }}>{fmt(totalProjectCost - deal.loanAmount)}</p>
                  </div>
                  <div>
                    <p style={kpiLabel}>ROI</p>
                    <p style={{ ...fieldValue, fontSize: 15, color: roi > 0 ? successText : destructiveText }}>{fmtPct(roi, 1)}</p>
                  </div>
                  <div>
                    <p style={kpiLabel}>ANNUALIZED ROI</p>
                    <p style={{ ...fieldValue, fontSize: 15, color: annualizedRoi > 15 ? successText : warningText }}>{fmtPct(annualizedRoi, 1)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Toggle: RTL + DSCR Takeout */}
            <div style={{ ...cardStyle, borderStyle: "dashed", background: "transparent" }}>
              <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dual Scenario: Bridge + DSCR Takeout</p>
                <p style={{ fontSize: 11, color: textMuted, marginBottom: 12 }}>Model a stabilized rental takeout alongside this fix & flip</p>
                <button style={{ ...toggleBtn(false), background: accentMuted, color: accent, border: `1px solid ${accent}` }}>
                  <TrendingUp size={13} style={{ marginRight: 4 }} /> Add DSCR Takeout Scenario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DSCR Costs & Returns ── */}
      {activeTab === "costs-returns" && dealType === "dscr" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Annual Cash Flow</span>
            </div>
            <div style={cardBody}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Item</th>
                    <th style={th}>Monthly</th>
                    <th style={th}>Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ ...tdLabel, color: successText }}>Gross Rental Income</td><td style={{ ...td, color: successText }}>{fmt(dscr.monthlyRent)}</td><td style={{ ...td, color: successText }}>{fmt(dscr.monthlyRent * 12)}</td></tr>
                  <tr><td style={tdLabel}>Less: Vacancy (5%)</td><td style={{ ...td, color: textMuted }}>({fmt(dscr.monthlyRent * 0.05)})</td><td style={{ ...td, color: textMuted }}>({fmt(dscr.monthlyRent * 12 * 0.05)})</td></tr>
                  <tr style={{ borderTop: `2px solid ${border}` }}>
                    <td style={{ ...tdLabel, fontWeight: 700 }}>Effective Gross Income</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(dscr.monthlyRent * 0.95)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(dscr.monthlyRent * 12 * 0.95)}</td>
                  </tr>
                  <tr><td style={tdLabel}>Property Taxes</td><td style={td}>({fmt(dscrMonthlyTaxes)})</td><td style={td}>({fmt(dscr.annualTaxes)})</td></tr>
                  <tr><td style={tdLabel}>Insurance</td><td style={td}>({fmt(dscrMonthlyInsurance)})</td><td style={td}>({fmt(dscr.annualInsurance)})</td></tr>
                  <tr><td style={tdLabel}>Management (8%)</td><td style={td}>({fmt(dscr.monthlyRent * 0.08)})</td><td style={td}>({fmt(dscr.monthlyRent * 12 * 0.08)})</td></tr>
                  <tr><td style={tdLabel}>Maintenance Reserve</td><td style={td}>({fmt(100)})</td><td style={td}>({fmt(1200)})</td></tr>
                  <tr style={{ borderTop: `2px solid ${border}`, background: "rgba(255,255,255,0.02)" }}>
                    <td style={{ ...tdLabel, fontWeight: 700 }}>Net Operating Income</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt((dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100) * 12)}</td>
                  </tr>
                  <tr><td style={tdLabel}>Debt Service (P&I)</td><td style={{ ...td, color: destructiveText }}>({fmt(dscrMonthlyPI)})</td><td style={{ ...td, color: destructiveText }}>({fmt(dscrMonthlyPI * 12)})</td></tr>
                  <tr style={{ borderTop: `3px solid ${border}`, background: successMuted }}>
                    <td style={{ ...tdLabel, fontWeight: 700, color: successText }}>Cash Flow After Debt</td>
                    <td style={{ ...td, fontWeight: 700, color: successText }}>{fmt(dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100 - dscrMonthlyPI)}</td>
                    <td style={{ ...td, fontWeight: 700, color: successText }}>{fmt((dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100 - dscrMonthlyPI) * 12)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Return Metrics */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Return Metrics</span>
            </div>
            <div style={cardBody}>
              {(() => {
                const downPayment = deal.arv - dscr.loanAmount;
                const closingCosts = 5000;
                const totalCashIn = downPayment + closingCosts;
                const annualCF = (dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100 - dscrMonthlyPI) * 12;
                const cashOnCash = (annualCF / totalCashIn) * 100;
                const capRate = ((dscr.monthlyRent * 0.95 - dscrMonthlyTaxes - dscrMonthlyInsurance - dscr.monthlyRent * 0.08 - 100) * 12 / deal.arv) * 100;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      ["Cash Invested", fmt(totalCashIn), null],
                      ["Annual Cash Flow", fmt(annualCF), annualCF > 0 ? successText : destructiveText],
                      ["Cash-on-Cash Return", fmtPct(cashOnCash, 1), cashOnCash > 8 ? successText : warningText],
                      ["Cap Rate", fmtPct(capRate, 1), null],
                      ["DSCR", dscrRatio.toFixed(2) + "x", dscrRatio >= 1.25 ? successText : warningText],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: cardAlt, borderRadius: 8 }}>
                        <span style={{ fontSize: 13, color: textMuted }}>{label}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: color || text }}>{value}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4: COMP ANALYSIS
         ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "comps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Subject Property */}
          <div style={{ ...cardStyle, border: `1px solid ${accent}` }}>
            <div style={{ ...cardHeader, background: accentMuted }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Home size={14} style={{ color: accent }} />
                <span style={{ ...sectionTitle, color: accent }}>Subject Property</span>
              </div>
              <span style={badge(accent, accentMuted)}>ARV Target: {fmt(deal.arv)}</span>
            </div>
            <div style={{ ...cardBody, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              {[
                ["Address", "221 Riggs Road"],
                ["Sqft", "1,420"],
                ["Beds / Baths", "3 / 2"],
                ["Year Built", "1985"],
                ["Condition (Post-Rehab)", "Renovated"],
                ["Your ARV", fmt(deal.arv)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={kpiLabel}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comp Grid */}
          <div style={cardStyle}>
            <div style={cardHeader}>
              <span style={sectionTitle}>Comparable Sales</span>
              <button style={{ ...toggleBtn(false), fontSize: 11 }}>+ Add Comp</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Address</th>
                    <th style={th}>Sale Price</th>
                    <th style={th}>Date</th>
                    <th style={th}>Sqft</th>
                    <th style={th}>$/Sqft</th>
                    <th style={th}>Beds</th>
                    <th style={th}>Baths</th>
                    <th style={th}>Distance</th>
                    <th style={th}>Condition</th>
                    <th style={th}>Adjustment</th>
                    <th style={th}>Adj. Value</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((comp, i) => (
                    <tr key={i}>
                      <td style={{ ...tdLeft, fontWeight: 500 }}>{comp.address}</td>
                      <td style={td}>{fmt(comp.salePrice)}</td>
                      <td style={{ ...td, color: textMuted }}>{comp.saleDate}</td>
                      <td style={td}>{comp.sqft.toLocaleString()}</td>
                      <td style={td}>{fmt(Math.round(comp.salePrice / comp.sqft))}</td>
                      <td style={td}>{comp.beds}</td>
                      <td style={td}>{comp.baths}</td>
                      <td style={{ ...td, color: textMuted }}>{comp.distance}</td>
                      <td style={td}>{comp.condition}</td>
                      <td style={{ ...td, color: comp.adj > 0 ? successText : comp.adj < 0 ? destructiveText : textMuted }}>
                        {comp.adj > 0 ? `+${fmt(comp.adj)}` : comp.adj < 0 ? fmt(comp.adj) : "--"}
                      </td>
                      <td style={{ ...td, fontWeight: 500 }}>{fmt(comp.salePrice + comp.adj)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div style={{ padding: "16px 20px", borderTop: `2px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <p style={kpiLabel}>AVG ADJUSTED COMP</p>
                  <p style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: 0 }}>{fmt(avgCompPrice)}</p>
                </div>
                <div>
                  <p style={kpiLabel}>YOUR ARV</p>
                  <p style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: 0 }}>{fmt(deal.arv)}</p>
                </div>
                <div>
                  <p style={kpiLabel}>VARIANCE</p>
                  <p style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: 0, color: Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.05 ? successText : warningText }}>
                    {fmtPct(((deal.arv - avgCompPrice) / avgCompPrice) * 100, 1)}
                  </p>
                </div>
              </div>

              {/* ARV Confidence */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: textMuted }}>ARV Confidence:</span>
                <span style={badge(
                  Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.03 ? successText :
                  Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.07 ? warningText : destructiveText,
                  Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.03 ? successMuted :
                  Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.07 ? warningMuted : destructiveMuted,
                )}>
                  {Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.03 ? "STRONG" :
                   Math.abs(deal.arv - avgCompPrice) / avgCompPrice < 0.07 ? "MODERATE" : "WEAK"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
