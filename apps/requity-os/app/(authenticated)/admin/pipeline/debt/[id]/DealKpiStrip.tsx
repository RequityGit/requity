"use client";

import { T, toNum, fmt, fP } from "./components";

interface DealKpiStripProps {
  loanAmount?: number | null;
  ltv?: number | null;
  currentDSCR?: number | null;
  proFormaDSCR?: number | null;
  interestRate?: number | null;
  termMonths?: number | null;
}

function dscrColor(v?: number | null): string | null {
  if (v == null) return null;
  if (v >= 1.25) return "#1B7A44";
  if (v >= 1.1) return "#B8822A";
  return "#E54D42";
}

function ltvColor(v?: number | null): string | null {
  if (v == null) return null;
  const pct = v > 1 ? v : v * 100;
  if (pct <= 65) return "#1B7A44";
  if (pct <= 75) return "#B8822A";
  return "#E54D42";
}

export function DealKpiStrip({
  loanAmount,
  ltv,
  currentDSCR,
  proFormaDSCR,
  interestRate,
  termMonths,
}: DealKpiStripProps) {
  const kpis: { label: string; value: string; color: string | null }[] = [
    {
      label: "Loan Amount",
      value: fmt(loanAmount),
      color: null,
    },
    {
      label: "LTV",
      value: fP(ltv),
      color: ltvColor(toNum(ltv)),
    },
    {
      label: "Current DSCR",
      value: currentDSCR != null ? `${Number(currentDSCR).toFixed(2)}x` : "\u2014",
      color: dscrColor(toNum(currentDSCR)),
    },
    {
      label: "Pro Forma DSCR",
      value: proFormaDSCR != null ? `${Number(proFormaDSCR).toFixed(2)}x` : "\u2014",
      color: dscrColor(toNum(proFormaDSCR)),
    },
    {
      label: "Interest Rate",
      value: fP(interestRate),
      color: null,
    },
    {
      label: "Term",
      value: termMonths ? `${termMonths} mo` : "\u2014",
      color: null,
    },
  ];

  return (
    <div
      className="grid grid-cols-6 gap-px overflow-hidden rounded-xl"
      style={{
        backgroundColor: T.bg.border,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      {kpis.map(({ label, value, color }) => (
        <div
          key={label}
          className="px-4 py-3"
          style={{ backgroundColor: T.bg.surface }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.05em] font-semibold mb-1"
            style={{ color: T.text.muted }}
          >
            {label}
          </div>
          <div
            className="num text-lg font-bold tracking-tight"
            style={{ color: color ?? T.text.primary }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
