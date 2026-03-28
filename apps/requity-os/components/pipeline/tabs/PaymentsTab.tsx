"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { showInfo, showError } from "@/lib/toast";
import { CreditCard, Download, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface Payment {
  id: string;
  payment_number: number;
  due_date: string;
  amount_due: number;
  status: string;
  paid_date: string | null;
  amount_paid: number | null;
  payment_method: string | null;
}

interface PaymentsTabProps {
  dealId: string;
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    case "due":
      return { label: "Due", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    case "overdue":
      return { label: "Overdue", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
    case "partial":
      return { label: "Partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    case "scheduled":
      return { label: "Scheduled", className: "bg-muted text-muted-foreground border-border" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground border-border" };
  }
}

export function PaymentsTab({ dealId }: PaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("deal_payments")
        .select("id, payment_number, due_date, amount_due, status, paid_date, amount_paid, payment_method")
        .eq("deal_id", dealId)
        .order("payment_number", { ascending: true });

      if (error) {
        showError("Could not load payments");
      } else {
        setPayments(data ?? []);
      }
      setLoading(false);
    }
    fetchPayments();
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rq-tab-content">
        <EmptyState
          icon={CreditCard}
          title="No payment schedule"
          description="No payment schedule has been generated for this loan yet."
          action={{
            label: "Generate Schedule",
            onClick: () => showInfo("Coming soon"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="rq-tab-content space-y-4">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <h3 className="rq-section-title">Payment Schedule</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => showInfo("Coming soon")}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Payment table */}
      <div className="rq-card-wrapper overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="rq-th text-left">#</th>
                <th className="rq-th text-left">Due Date</th>
                <th className="rq-th text-right">Amount Due</th>
                <th className="rq-th text-center">Status</th>
                <th className="rq-th text-left">Paid Date</th>
                <th className="rq-th text-right">Amount Paid</th>
                <th className="rq-th text-left">Method</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const statusBadge = getPaymentStatusBadge(payment.status);
                return (
                  <tr key={payment.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 rq-transition">
                    <td className="rq-td text-left num">{payment.payment_number}</td>
                    <td className="rq-td text-left">{formatDate(payment.due_date)}</td>
                    <td className="rq-td text-right num">{formatCurrency(payment.amount_due)}</td>
                    <td className="rq-td text-center">
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", statusBadge.className)}>
                        {statusBadge.label}
                      </Badge>
                    </td>
                    <td className="rq-td text-left">{formatDate(payment.paid_date)}</td>
                    <td className="rq-td text-right num">{formatCurrency(payment.amount_paid)}</td>
                    <td className="rq-td text-left capitalize">{payment.payment_method ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
