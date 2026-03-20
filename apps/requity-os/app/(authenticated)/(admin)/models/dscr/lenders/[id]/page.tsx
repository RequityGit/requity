import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LenderDetail } from "@/components/admin/dscr/lender-detail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function LenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: lender } = await (admin as any)
    .from("dscr_lenders")
    .select("*")
    .eq("id", id)
    .single();

  if (!lender) notFound();

  const [productsRes, uploadsRes] = await Promise.all([
    (admin as any)
      .from("dscr_lender_products")
      .select("*")
      .eq("lender_id", id)
      .order("product_name"),
    (admin as any)
      .from("dscr_rate_sheet_uploads")
      .select("*")
      .eq("lender_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const products = productsRes.data ?? [];
  const uploads = uploadsRes.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={lender.name}
        description={`${lender.short_name}${lender.nmls_id ? ` | NMLS: ${lender.nmls_id}` : ""}${lender.account_executive ? ` | AE: ${lender.account_executive}` : ""}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/models/dscr?tab=lenders">
              <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Back to Lenders
            </Link>
          </Button>
        }
      />
      <LenderDetail lender={lender} products={products} uploads={uploads} />
    </div>
  );
}
