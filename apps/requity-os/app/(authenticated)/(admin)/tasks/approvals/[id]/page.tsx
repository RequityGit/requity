import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApprovalDetailView } from "@/components/approvals/approval-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function ApprovalDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch approval
  const { data: approval, error } = await admin
    .from("approval_requests" as any)
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !approval) notFound();

  const appr = approval as any;

  // Get profiles for submitter and approver
  const [submitterRes, approverRes] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", appr.submitted_by).single(),
    admin.from("profiles").select("full_name, email").eq("id", appr.assigned_to).single(),
  ]);

  // Get audit log
  const { data: auditLog } = await admin
    .from("approval_audit_log" as any)
    .select("*")
    .eq("approval_id", params.id)
    .order("created_at", { ascending: true });

  // Get performer names
  const performerIds = Array.from(new Set((auditLog ?? []).map((e: any) => e.performed_by)));
  const { data: performers } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", performerIds.length > 0 ? performerIds : ["00000000-0000-0000-0000-000000000000"]);

  const performerMap: Record<string, string> = {};
  (performers ?? []).forEach((p: any) => {
    performerMap[p.id] = p.full_name || "Unknown";
  });

  const enrichedAuditLog = (auditLog ?? []).map((entry: any) => ({
    ...entry,
    performer_name: performerMap[entry.performed_by] || "Unknown",
  }));

  // Check if current user is the approver or admin
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "super_admin");
  const isApprover = appr.assigned_to === user.id;
  const isSubmitter = appr.submitted_by === user.id;

  return (
    <ApprovalDetailView
      approval={{
        ...appr,
        submitter_name: submitterRes.data?.full_name || submitterRes.data?.email || "Unknown",
        submitter_email: submitterRes.data?.email || null,
        approver_name: approverRes.data?.full_name || approverRes.data?.email || "Unknown",
        approver_email: approverRes.data?.email || null,
      }}
      auditLog={enrichedAuditLog}
      currentUserId={user.id}
      isApprover={isApprover || isAdmin}
      isSubmitter={isSubmitter}
    />
  );
}
