"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { formatRelativeTime } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalPriority } from "@/lib/approvals/types";
import { APPROVAL_PRIORITY_COLORS } from "@/lib/approvals/types";

interface PendingApproval {
  id: string;
  entity_type: string;
  status: string;
  priority: string;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  deal_snapshot: Record<string, any>;
}

export function PendingApprovalsWidget() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPending() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is super_admin — super admins see ALL pending approvals
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isSuperAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");

      let query = (supabase as any)
        .from("approval_requests")
        .select("id, entity_type, status, priority, sla_deadline, sla_breached, created_at, deal_snapshot")
        .eq("status", "pending")
        .order("sla_deadline", { ascending: true, nullsFirst: false })
        .limit(5);

      // Super admins see all pending approvals; others see only assigned to them
      if (!isSuperAdmin) {
        query = query.eq("assigned_to", user.id);
      }

      const { data } = await query;

      setApprovals(data ?? []);
      setLoading(false);
    }

    fetchPending();
  }, []);

  if (loading) return null;
  if (approvals.length === 0) return null;

  const breachedCount = approvals.filter((a) => a.sla_breached).length;

  return (
    <Card className={cn("", breachedCount > 0 && "border-red-200")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-foreground" />
          Pending My Approval
        </CardTitle>
        <Badge variant={breachedCount > 0 ? "destructive" : "secondary"} className="text-xs">
          {approvals.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {approvals.slice(0, 3).map((approval) => {
            const snapshot = approval.deal_snapshot;
            const priorityColors = APPROVAL_PRIORITY_COLORS[approval.priority as ApprovalPriority];

            return (
              <div
                key={approval.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/tasks/approvals/${approval.id}`)}
              >
                {approval.sla_breached ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {snapshot?.borrower_name || "Unknown"}{" "}
                    {snapshot?.loan_amount ? `- ${formatCurrency(Number(snapshot.loan_amount))}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(approval.created_at)}
                  </p>
                </div>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", priorityColors?.badge)}>
                  {approval.priority}
                </span>
              </div>
            );
          })}
        </div>

        {approvals.length > 3 && (
          <p className="text-xs text-muted-foreground mt-2">
            +{approvals.length - 3} more pending
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-foreground"
          onClick={() => router.push("/tasks/approvals")}
        >
          View All Approvals
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
