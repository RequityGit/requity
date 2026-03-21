"use client";

import { useMemo } from "react";
import { SectionCard, TableShell, TH, fmtCurrency, n } from "@/components/pipeline/tabs/financials/shared";
import { Home, Building2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResidentialDealInputs } from "@/lib/residential-uw/types";

export interface CompAnalysisSectionProps {
  dealInputs: ResidentialDealInputs;
}

const MOCK_COMPS = [
  {
    address: "123 Oak Street",
    salePrice: 285000,
    saleDate: "2025-11-15",
    sqft: 1380,
    beds: 3,
    baths: 2,
    distance: "0.3 mi",
    condition: "Renovated",
    adj: 5000,
  },
  {
    address: "456 Maple Ave",
    salePrice: 272000,
    saleDate: "2025-10-22",
    sqft: 1450,
    beds: 3,
    baths: 2,
    distance: "0.5 mi",
    condition: "Good",
    adj: -3000,
  },
  {
    address: "789 Pine Blvd",
    salePrice: 295000,
    saleDate: "2025-12-01",
    sqft: 1520,
    beds: 4,
    baths: 2,
    distance: "0.8 mi",
    condition: "Excellent",
    adj: -8000,
  },
];

function fmtShortDate(iso: string) {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${m}/${d}/${y}`;
}

function median(nums: number[]) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function CompAnalysisSection({ dealInputs }: CompAnalysisSectionProps) {
  const arv = n(dealInputs.after_repair_value);

  const compRows = useMemo(
    () =>
      MOCK_COMPS.map((c) => ({
        ...c,
        ppsf: c.sqft > 0 ? c.salePrice / c.sqft : 0,
        adjValue: c.salePrice + c.adj,
      })),
    []
  );

  const adjValues = compRows.map((r) => r.adjValue);
  const avgAdj = adjValues.reduce((a, b) => a + b, 0) / (adjValues.length || 1);
  const medAdj = median(adjValues);
  const minAdj = Math.min(...adjValues);
  const maxAdj = Math.max(...adjValues);

  const deltaVsAvgPct = avgAdj > 0 ? ((arv - avgAdj) / avgAdj) * 100 : 0;
  const absDelta = Math.abs(deltaVsAvgPct);

  const confidence =
    absDelta <= 5
      ? { label: "High Confidence", className: "rq-value-positive" }
      : absDelta <= 10
        ? { label: "Moderate Confidence", className: "rq-value-warn" }
        : { label: "Low Confidence - Review Comps", className: "rq-value-negative" };

  return (
    <div className="space-y-4">
      <div className="rounded-xl ring-2 ring-primary ring-offset-0">
        <SectionCard title="Subject Property" icon={Home}>
          <p className="text-xs text-muted-foreground mb-4">
            Property details will auto-populate from the Property tab
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="rq-micro-label">Address</div>
              <div className="text-[13px] font-medium mt-1">Subject Property</div>
            </div>
            <div>
              <div className="rq-micro-label">Sqft</div>
              <div className="text-[13px] font-medium num mt-1">—</div>
            </div>
            <div>
              <div className="rq-micro-label">Beds / Baths</div>
              <div className="text-[13px] font-medium mt-1">—</div>
            </div>
            <div>
              <div className="rq-micro-label">Year Built</div>
              <div className="text-[13px] font-medium mt-1">—</div>
            </div>
            <div>
              <div className="rq-micro-label">Condition (Post-Rehab)</div>
              <div className="text-[13px] font-medium mt-1">—</div>
            </div>
            <div>
              <div className="rq-micro-label">Your ARV</div>
              <div className="text-[13px] font-semibold num mt-1">{fmtCurrency(arv)}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Comparable Sales"
        icon={Building2}
        actions={
          <button type="button" className="rq-action-btn-sm">
            Add Comp
          </button>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <TableShell>
            <thead>
              <tr>
                <TH align="left">Address</TH>
                <TH align="right">Sale Price</TH>
                <TH align="right">Date</TH>
                <TH align="right">Sqft</TH>
                <TH align="right">$/Sqft</TH>
                <TH align="right">Beds</TH>
                <TH align="right">Baths</TH>
                <TH align="left">Distance</TH>
                <TH align="left">Condition</TH>
                <TH align="right">Adjustment</TH>
                <TH align="right">Adj. Value</TH>
              </tr>
            </thead>
            <tbody>
              {compRows.map((c) => (
                <tr key={c.address} className="border-t">
                  <td className="rq-td text-left font-medium">{c.address}</td>
                  <td className="rq-td text-right num">{fmtCurrency(c.salePrice)}</td>
                  <td className="rq-td text-right num whitespace-nowrap">
                    {fmtShortDate(c.saleDate)}
                  </td>
                  <td className="rq-td text-right num">{c.sqft.toLocaleString()}</td>
                  <td className="rq-td text-right num">${Math.round(c.ppsf).toLocaleString()}</td>
                  <td className="rq-td text-right num">{c.beds}</td>
                  <td className="rq-td text-right num">{c.baths}</td>
                  <td className="rq-td text-left">{c.distance}</td>
                  <td className="rq-td text-left">{c.condition}</td>
                  <td
                    className={cn(
                      "rq-td text-right num font-medium",
                      c.adj > 0 && "rq-value-positive",
                      c.adj < 0 && "rq-value-negative"
                    )}
                  >
                    {c.adj === 0
                      ? "—"
                      : c.adj > 0
                        ? `+${fmtCurrency(c.adj)}`
                        : `(${fmtCurrency(Math.abs(c.adj))})`}
                  </td>
                  <td className="rq-td text-right num font-medium">{fmtCurrency(c.adjValue)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      </SectionCard>

      <SectionCard title="ARV Confidence" icon={Target}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="rq-micro-label">Average Adj. Value</div>
            <div className="text-lg font-bold num mt-1">{fmtCurrency(avgAdj)}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="rq-micro-label">Median Adj. Value</div>
            <div className="text-lg font-bold num mt-1">{fmtCurrency(medAdj)}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="rq-micro-label">Range</div>
            <div className="text-lg font-bold num mt-1">
              {fmtCurrency(minAdj)} – {fmtCurrency(maxAdj)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="rq-micro-label">Your ARV vs Average</div>
            <div
              className={cn(
                "text-lg font-bold num mt-1",
                deltaVsAvgPct > 0 ? "rq-value-positive" : deltaVsAvgPct < 0 ? "rq-value-negative" : ""
              )}
            >
              {deltaVsAvgPct >= 0 ? "+" : ""}
              {deltaVsAvgPct.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className={cn("mt-4 text-sm font-medium", confidence.className)}>{confidence.label}</div>
      </SectionCard>
    </div>
  );
}
