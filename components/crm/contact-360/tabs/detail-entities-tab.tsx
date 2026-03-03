"use client";

import { Building2, Check, X, Paperclip } from "lucide-react";
import { SectionCard, FieldRow, DotPill, MonoValue } from "../contact-detail-shared";
import { formatDate } from "@/lib/format";
import type { EntityData } from "../types";

interface DetailEntitiesTabProps {
  entities: EntityData[];
}

function DocPill({ has, label }: { has: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: has ? "#22A86114" : "#E5453D14",
        color: has ? "#22A861" : "#E5453D",
      }}
    >
      {has ? <Check size={10} /> : <X size={10} />}
      {label}
    </span>
  );
}

export function DetailEntitiesTab({ entities }: DetailEntitiesTabProps) {
  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F8] mb-4">
          <Building2 className="h-6 w-6 text-[#9A9A9A]" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">No entities</h3>
        <p className="text-sm text-[#6B6B6B]">No borrowing or investing entities linked.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entities.map((ent) => (
        <SectionCard
          key={ent.id}
          title={ent.entity_name}
          icon={Building2}
          action={
            <DotPill
              color={ent.kind === "borrower" ? "#3B82F6" : "#22A861"}
              label={ent.kind === "borrower" ? "Borrowing Entity" : "Investing Entity"}
              small
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mb-4">
            <FieldRow label="Entity Type" value={ent.entity_type} />
            <FieldRow label="EIN" value={ent.ein || "—"} mono />
            <FieldRow label="State of Formation" value={ent.state_of_formation} />
            {ent.formation_date && (
              <FieldRow label="Formation Date" value={formatDate(ent.formation_date)} />
            )}
          </div>

          {/* Documents */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wide mb-2">
              Documents
            </div>
            <div className="flex gap-2 flex-wrap">
              {ent.operating_agreement_url !== undefined && (
                <DocPill has={!!ent.operating_agreement_url} label="Operating Agreement" />
              )}
              {ent.articles_of_org_url !== undefined && (
                <DocPill has={!!ent.articles_of_org_url} label="Articles of Org" />
              )}
              {ent.certificate_good_standing_url !== undefined && (
                <DocPill has={!!ent.certificate_good_standing_url} label="Good Standing" />
              )}
              {ent.ein_letter_url !== undefined && (
                <DocPill has={!!ent.ein_letter_url} label="EIN Letter" />
              )}
              {ent.formation_doc_url !== undefined && (
                <DocPill has={!!ent.formation_doc_url} label="Formation Doc" />
              )}
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
