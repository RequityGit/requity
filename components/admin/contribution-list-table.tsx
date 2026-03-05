"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

interface ContributionRow {
  id: string;
  fund_name: string;
  investor_name: string;
  call_amount: number | null;
  due_date: string;
  paid_date: string | null;
  status: string;
  commitment_amount: number | null;
}

interface ContributionListTableProps {
  data: ContributionRow[];
}

export function ContributionListTable({ data }: ContributionListTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  async function markAsPaid(contributionId: string) {
    setProcessing(contributionId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("capital_calls")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", contributionId);

      if (error) throw error;

      toast({ title: "Contribution marked as paid" });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  }

  const columns: Column<ContributionRow>[] = [
    {
      key: "fund_name",
      header: "Investment",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.fund_name}</span>
      ),
    },
    {
      key: "investor_name",
      header: "Investor",
      cell: (row) => row.investor_name,
    },
    {
      key: "call_amount",
      header: "Amount",
      cell: (row) => <span className="num">{formatCurrency(row.call_amount)}</span>,
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => <span className="num">{formatDate(row.due_date)}</span>,
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) => <span className="num">{formatDate(row.paid_date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => {
        if (row.status === "paid") return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            disabled={processing === row.id}
            onClick={(e) => {
              e.stopPropagation();
              markAsPaid(row.id);
            }}
          >
            <Check className="h-3 w-3" />
            Mark Paid
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable<ContributionRow>
      columns={columns}
      data={data}
      emptyMessage="No contributions found."
    />
  );
}
