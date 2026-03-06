import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  FileText,
  Landmark,
  ArrowRight,
  Mail,
} from "lucide-react";
import Link from "next/link";

export default async function ControlCenterOverview() {
  const supabase = createClient();
  const admin = createAdminClient();

  // Use admin client to bypass RLS — this is a super-admin-only page
  const [
    profilesResult,
    profilesByStatusResult,
    rolesResult,
    loansResult,
    templatesResult,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("activation_status"),
    admin.from("user_roles").select("role").eq("is_active", true),
    admin
      .from("loans")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    admin
      .from("loan_condition_templates")
      .select("category")
      .eq("is_active", true),
  ]);

  const totalUsers = profilesResult.count ?? 0;

  // Count by activation status
  const statusCounts = (profilesByStatusResult.data ?? []).reduce(
    (acc, p) => {
      const status = p.activation_status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Count roles
  const roleCounts = (rolesResult.data ?? []).reduce(
    (acc, r) => {
      acc[r.role] = (acc[r.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activeLoans = loansResult.count ?? 0;
  const activeTemplates = templatesResult.data?.length ?? 0;
  const categoryCount = new Set(
    (templatesResult.data ?? []).map((t) => t.category)
  ).size;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value={totalUsers.toString()}
          description={`${statusCounts["activated"] ?? 0} activated, ${statusCounts["link_sent"] ?? 0} link sent, ${statusCounts["pending"] ?? 0} pending`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Active Roles"
          value={Object.values(roleCounts)
            .reduce((a, b) => a + b, 0)
            .toString()}
          description={`${roleCounts["super_admin"] ?? 0} super admins, ${roleCounts["admin"] ?? 0} admins, ${roleCounts["investor"] ?? 0} investors, ${roleCounts["borrower"] ?? 0} borrowers`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Active Loans"
          value={activeLoans.toString()}
          description="Non-deleted loans"
          icon={<Landmark className="h-5 w-5" />}
        />
        <KpiCard
          title="Condition Templates"
          value={activeTemplates.toString()}
          description={`Across ${categoryCount} categories`}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/control-center/users" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Manage Users & Roles
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View all portal users, grant or revoke roles, and manage
                activation status.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/control-center/conditions" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Edit Condition Templates
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Configure the master checklist of loan conditions that
                auto-populate for new loans.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/control-center/email-templates" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Email Templates
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage email templates used across the platform.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/control-center/user-email-templates" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                User Email Templates
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage reusable templates for team-composed emails with
                merge fields.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/control-center/term-sheets" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Term Sheet Templates
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Configure how term sheets look for each loan type.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/control-center/payoff-settings" className="group">
          <Card className="hover:border-teal-300 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Payoff Settings
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Configure wire instructions and default fees for payoff
                statements.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
