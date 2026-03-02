import { Timer } from "lucide-react";
import { DashCard } from "./dash-card";
import { SectionTitle, ViewAllButton } from "./section-title";
import type { MaturityLoan } from "@/lib/dashboard.server";

function fmtShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    current: { bg: "bg-dash-success/[0.08]", text: "text-dash-success", label: "Current" },
    watchlist: { bg: "bg-dash-warning/[0.08]", text: "text-dash-warning", label: "Watch" },
    overdue: { bg: "bg-dash-danger/[0.06]", text: "text-dash-danger", label: "Overdue" },
  };
  const c = config[status] || { bg: "bg-dash-info/[0.07]", text: "text-dash-info", label: status };

  return (
    <span
      className={`text-[9.5px] font-bold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-[3px] ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

interface MaturityTableProps {
  loans: MaturityLoan[];
}

export function MaturityTable({ loans }: MaturityTableProps) {
  if (loans.length === 0) {
    return (
      <DashCard className="!p-[14px_18px]">
        <SectionTitle sub="Next 60 days" right={<ViewAllButton label="All loans" href="/admin/loans" />}>
          Upcoming Maturities
        </SectionTitle>
        <p className="text-dash-text-mut text-xs py-4 text-center">No upcoming maturities in the next 60 days</p>
      </DashCard>
    );
  }

  return (
    <DashCard className="!p-[14px_18px]">
      <SectionTitle sub="Next 60 days" right={<ViewAllButton label="All loans" href="/admin/loans" />}>
        Upcoming Maturities
      </SectionTitle>
      <div className="flex flex-col gap-0.5">
        {loans.map((loan) => {
          const urgColor =
            loan.daysLeft <= 14
              ? "text-dash-danger"
              : loan.daysLeft <= 30
                ? "text-dash-warning"
                : "text-dash-text-mut";
          const urgBg =
            loan.daysLeft <= 14
              ? "bg-dash-danger/[0.06]"
              : loan.daysLeft <= 30
                ? "bg-dash-warning/[0.08]"
                : "bg-dash-surface-alt";

          return (
            <div
              key={loan.id}
              className="flex items-center gap-2.5 px-2 py-[7px] rounded-[5px] cursor-pointer dash-row-hover"
            >
              <div
                className={`w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0 ${urgBg}`}
              >
                <Timer size={12} className={urgColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {loan.property}
                </div>
                <div className="text-[10.5px] text-dash-text-mut">
                  {loan.borrower} · {loan.rate}%
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono text-xs font-semibold text-foreground">
                  {fmtShort(loan.amount)}
                </div>
                <div className={`font-mono text-[10px] font-semibold ${urgColor}`}>
                  {loan.daysLeft}d · {loan.maturityDate}
                </div>
              </div>
              <StatusBadge status={loan.status} />
            </div>
          );
        })}
      </div>
    </DashCard>
  );
}
