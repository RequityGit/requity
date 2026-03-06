"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";

interface PaymentWithLoan {
  id: string;
  loan_id: string;
  amount: number;
  principal_amount: number | null;
  interest_amount: number | null;
  late_fee: number | null;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  loans: {
    property_address: string | null;
    loan_number: string | null;
  } | null;
}

interface LoanOption {
  id: string;
  property_address: string | null;
}

interface PaymentsTableProps {
  payments: PaymentWithLoan[];
  loans: LoanOption[];
}

export function PaymentsTable({ payments, loans }: PaymentsTableProps) {
  const [loanFilter, setLoanFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredPayments = useMemo(() => {
    let result = payments;

    if (loanFilter !== "all") {
      result = result.filter((p) => p.loan_id === loanFilter);
    }

    if (dateFrom) {
      result = result.filter((p) => p.payment_date >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((p) => p.payment_date <= dateTo);
    }

    return result;
  }, [payments, loanFilter, dateFrom, dateTo]);

  const columns: Column<PaymentWithLoan>[] = [
    {
      key: "payment_date",
      header: "Payment Date",
      cell: (row) => formatDate(row.payment_date),
    },
    {
      key: "loan",
      header: "Loan",
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">
            {row.loans?.property_address ?? "Unknown"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrencyDetailed(row.amount),
    },
    {
      key: "principal",
      header: "Principal",
      cell: (row) => formatCurrencyDetailed(row.principal_amount),
    },
    {
      key: "interest",
      header: "Interest",
      cell: (row) => formatCurrencyDetailed(row.interest_amount),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Filter by Loan</Label>
          <Select value={loanFilter} onValueChange={setLoanFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All loans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loans</SelectItem>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>
                  {loan.property_address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        emptyMessage="No payments found matching your filters."
      />
    </div>
  );
}
