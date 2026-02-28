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

interface CapitalCallRow {
  id: string;
  fund_name: string;
  investor_name: string;
  call_amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  commitment_amount: number | null;
}

interface CapitalCallListTableProps {
  data: CapitalCallRow[];
}

export function CapitalCallListTable({ data }: CapitalCallListTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  async function markAsPaid(callId: string) {
    setProcessing(callId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("capital_calls")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", callId);

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

  const columns: Column<CapitalCallRow>[] = [
    {
      key: "fund_name",
      header: "Investment",
      cell: (row) => (
        <span className="font-medium text-[#1a2b4a]">{row.fund_name}</span>
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
      cell: (row) => formatCurrency(row.call_amount),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => formatDate(row.due_date),
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) => formatDate(row.paid_date),
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
            className="h-7 gap-1 text-green-700 hover:text-green-800"
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
    <DataTable<CapitalCallRow>
      columns={columns}
      data={data}
      emptyMessage="No contributions found."
    />
  );
}
