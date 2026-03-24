"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, HandCoins } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SoftCommitment, CommitmentStatus } from "@/lib/fundraising/types";
import { COMMITMENT_STATUS_COLORS } from "@/lib/fundraising/types";
import Link from "next/link";

interface Props {
  contactId: string;
}

export function ContactCommitmentsSection({ contactId }: Props) {
  const [commitments, setCommitments] = useState<SoftCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("soft_commitments" as never)
      .select(
        "*, deal:unified_deals!soft_commitments_deal_id_fkey(id, name, fundraise_slug)" as never
      )
      .eq("contact_id" as never, contactId as never)
      .order("submitted_at" as never, { ascending: false } as never)
      .then(({ data }) => {
        setCommitments((data ?? []) as unknown as SoftCommitment[]);
        setLoading(false);
      });
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (commitments.length === 0) {
    return null;
  }

  const columns: Column<SoftCommitment>[] = [
    {
      key: "deal",
      header: "Deal",
      cell: (row) => (
        <Link
          href={`/pipeline/${row.deal_id}?tab=fundraising`}
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          {row.deal?.name ?? "Unknown"}
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="num text-sm font-medium">
          {formatCurrency(row.commitment_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={cn(
            "text-xs capitalize",
            COMMITMENT_STATUS_COLORS[row.status as CommitmentStatus]
          )}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.submitted_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="rq-section-title flex items-center gap-2">
        <HandCoins className="h-4 w-4" />
        Soft Commitments
      </h3>
      <DataTable columns={columns} data={commitments} />
    </div>
  );
}
