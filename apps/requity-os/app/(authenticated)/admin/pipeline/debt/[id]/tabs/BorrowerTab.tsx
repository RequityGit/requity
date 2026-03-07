"use client";

import { Building2, Users, History } from "lucide-react";
import { T, SectionCard, FieldRow, fmt, cap } from "../components";
import type { DealData } from "../components";

interface BorrowerTabProps {
  deal: DealData;
}

export function BorrowerTab({ deal }: BorrowerTabProps) {
  const d = deal;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Borrower Entity ── */}
      <SectionCard title="Borrower Entity" icon={Building2}>
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Entity Name" value={d._entity_name} />
          <FieldRow label="Entity Type" value={cap(d._entity_type)} />
          <FieldRow label="State of Formation" value={d.property_state} />
          <FieldRow label="Borrower Name" value={d._borrower_name} />
        </div>
      </SectionCard>

      {/* ── Guarantors ── */}
      <SectionCard title="Guarantors" icon={Users}>
        {d._borrower_name ? (
          <div
            className="overflow-hidden rounded-lg"
            style={{ border: `1px solid ${T.bg.borderSubtle}` }}
          >
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ backgroundColor: T.bg.elevated }}>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Name</th>
                  <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Role</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>FICO</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Liquidity</th>
                  <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Experience</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                  <td className="px-3 py-2 font-medium" style={{ color: T.text.primary }}>
                    {d._borrower_name}
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text.secondary }}>Primary Guarantor</td>
                  <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                    {d._borrower_credit_score ?? "\u2014"}
                  </td>
                  <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                    {fmt(d._borrower_liquidity)}
                  </td>
                  <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                    {d._borrower_experience != null ? `${d._borrower_experience} properties` : "\u2014"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm" style={{ color: T.text.muted }}>
            No guarantor information available.
          </div>
        )}
      </SectionCard>

      {/* ── Track Record ── */}
      <SectionCard title="Track Record" icon={History}>
        {d._borrower_experience != null && d._borrower_experience > 0 ? (
          <div className="grid grid-cols-2 gap-x-8">
            <FieldRow
              label="Total Transactions"
              value={d._borrower_experience != null ? `${d._borrower_experience}` : null}
              mono
            />
            <FieldRow label="Default Count" value="0" mono />
          </div>
        ) : (
          <div className="py-8 text-center text-sm" style={{ color: T.text.muted }}>
            No track record data available.
          </div>
        )}
      </SectionCard>

      {/* ── Referral Source ── */}
      <SectionCard title="Referral Source">
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Source" value={cap(d.funding_channel)} />
          <FieldRow label="Strategy" value={cap(d.strategy ?? d.investment_strategy)} />
        </div>
      </SectionCard>
    </div>
  );
}
