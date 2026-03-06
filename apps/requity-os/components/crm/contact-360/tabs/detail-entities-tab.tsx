"use client";

import { Building2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldRow } from "../contact-detail-shared";
import { formatDate } from "@/lib/format";
import type { EntityData } from "../types";

interface DetailEntitiesTabProps {
  entities: EntityData[];
}

function DocPill({ has, label }: { has: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className="text-[11px] gap-1 px-2 py-0.5 h-auto"
      style={{
        color: has ? "#22A861" : "#E5453D",
        borderColor: has ? "#22A86130" : "#E5453D30",
        backgroundColor: has ? "#22A86108" : "#E5453D08",
      }}
    >
      {has ? <Check size={10} /> : <X size={10} />}
      {label}
    </Badge>
  );
}

export function DetailEntitiesTab({ entities }: DetailEntitiesTabProps) {
  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
          <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No entities
        </h3>
        <p className="text-sm text-muted-foreground">
          No borrowing or investing entities linked.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entities.map((ent) => (
        <Card key={ent.id} className="rounded-xl border-border">
          <CardHeader className="px-5 py-3.5 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <Building2
                  size={16}
                  className="text-muted-foreground"
                  strokeWidth={1.5}
                />
                {ent.entity_name}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[11px] gap-1 px-1.5 py-0 h-5"
                style={{
                  color: ent.kind === "borrower" ? "#3B82F6" : "#22A861",
                  borderColor:
                    ent.kind === "borrower" ? "#3B82F630" : "#22A86130",
                  backgroundColor:
                    ent.kind === "borrower" ? "#3B82F608" : "#22A86108",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      ent.kind === "borrower" ? "#3B82F6" : "#22A861",
                  }}
                />
                {ent.kind === "borrower"
                  ? "Borrowing Entity"
                  : "Investing Entity"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mb-4">
              <FieldRow label="Entity Type" value={ent.entity_type} />
              <FieldRow label="EIN" value={ent.ein || "—"} mono />
              <FieldRow
                label="State of Formation"
                value={ent.state_of_formation}
              />
              {ent.formation_date && (
                <FieldRow
                  label="Formation Date"
                  value={formatDate(ent.formation_date)}
                />
              )}
            </div>

            {/* Documents */}
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Documents
              </div>
              <div className="flex gap-2 flex-wrap">
                {ent.operating_agreement_url !== undefined && (
                  <DocPill
                    has={!!ent.operating_agreement_url}
                    label="Operating Agreement"
                  />
                )}
                {ent.articles_of_org_url !== undefined && (
                  <DocPill
                    has={!!ent.articles_of_org_url}
                    label="Articles of Org"
                  />
                )}
                {ent.certificate_good_standing_url !== undefined && (
                  <DocPill
                    has={!!ent.certificate_good_standing_url}
                    label="Good Standing"
                  />
                )}
                {ent.ein_letter_url !== undefined && (
                  <DocPill has={!!ent.ein_letter_url} label="EIN Letter" />
                )}
                {ent.formation_doc_url !== undefined && (
                  <DocPill
                    has={!!ent.formation_doc_url}
                    label="Formation Doc"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
