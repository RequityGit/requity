"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, FileText, AlertCircle } from "lucide-react";
import type { DashboardTask, PendingApproval, DealLogEntry } from "../actions";

interface BriefingItem {
  icon: typeof Clock;
  label: string;
  color: string;
  urgent: boolean;
}

interface MorningBriefingProps {
  tasks: DashboardTask[];
  approvals: PendingApproval[];
  dealLog: DealLogEntry[];
}

export function MorningBriefing({ tasks, approvals, dealLog }: MorningBriefingProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = `briefing-dismissed-${new Date().toISOString().slice(0, 10)}`;
      if (sessionStorage.getItem(key)) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    const key = `briefing-dismissed-${new Date().toISOString().slice(0, 10)}`;
    sessionStorage.setItem(key, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  // Build briefing items from real data
  const items: BriefingItem[] = [];

  const agingApprovals = approvals.filter((a) => a.wait_days >= 3).length;
  if (agingApprovals > 0) {
    items.push({
      icon: Clock,
      label: `${agingApprovals} approval${agingApprovals !== 1 ? "s" : ""} aging past SLA`,
      color: "text-[#B8822A]",
      urgent: true,
    });
  }

  const missingDocs = dealLog.filter((d) => d.action === "missing_doc").length;
  if (missingDocs > 0) {
    items.push({
      icon: FileText,
      label: `${missingDocs} document${missingDocs !== 1 ? "s" : ""} missing across active deals`,
      color: "text-[#B23225]",
      urgent: true,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const pastDueTasks = tasks.filter(
    (t) => t.due_date != null && t.due_date < today && t.status !== "Complete"
  ).length;
  if (pastDueTasks > 0) {
    items.push({
      icon: AlertCircle,
      label: `${pastDueTasks} task${pastDueTasks !== 1 ? "s" : ""} past due`,
      color: "text-[#B23225]",
      urgent: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-6 flex overflow-hidden rounded-lg border bg-card">
      <div className="w-1 shrink-0 bg-[#B8822A]" />
      <div className="flex-1 px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-[#B8822A]" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-foreground">
              Your Morning Briefing
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[11px] font-medium text-dash-text-faint hover:text-muted-foreground"
          >
            Dismiss
          </button>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${item.color}`} strokeWidth={1.5} />
                <span
                  className={`text-[13px] ${
                    item.urgent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
