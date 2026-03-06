"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, FileText } from "lucide-react";
import {
  addProductAction,
  toggleProductActiveAction,
  type ProductInput,
} from "@/app/(authenticated)/admin/models/dscr/actions";
import { formatDate, formatCurrency } from "@/lib/format";
import { US_STATES } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LenderDetail({
  lender,
  products,
  uploads,
}: {
  lender: any;
  products: any[];
  uploads: any[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [productOpen, setProductOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProductInput>>({
    lender_id: lender.id,
    product_name: "",
    product_type: "dscr",
    lock_period_days: 45,
    floor_rate: undefined,
    max_price: undefined,
    max_ltv_purchase: 80,
    max_ltv_rate_term: 80,
    max_ltv_cashout: 75,
  });

  async function handleAddProduct() {
    if (!form.product_name) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result = await addProductAction({
        lender_id: lender.id,
        product_name: form.product_name!,
        product_type: form.product_type,
        lock_period_days: form.lock_period_days,
        floor_rate: form.floor_rate,
        max_price: form.max_price,
        max_ltv_purchase: form.max_ltv_purchase,
        max_ltv_rate_term: form.max_ltv_rate_term,
        max_ltv_cashout: form.max_ltv_cashout,
        min_loan_amount: form.min_loan_amount,
        max_loan_amount: form.max_loan_amount,
        funding_fee: form.funding_fee,
        underwriting_fee: form.underwriting_fee,
        processing_fee: form.processing_fee,
        desk_review_fee: form.desk_review_fee,
        entity_review_fee: form.entity_review_fee,
        state_restrictions: form.state_restrictions,
        eligible_property_types: form.eligible_property_types,
        eligible_borrower_types: form.eligible_borrower_types,
      });
      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Product added" });
      setProductOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(id: string, current: boolean) {
    const result = await toggleProductActiveAction(id, !current);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  function setField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Tabs defaultValue="products">
      <TabsList>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="uploads">Rate Sheet History</TabsTrigger>
        <TabsTrigger value="details">Lender Details</TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={productOpen} onOpenChange={setProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Product for {lender.short_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={form.product_name || ""}
                      onChange={(e) => setField("product_name", e.target.value)}
                      placeholder="Invest Star Income"
                    />
                  </div>
                  <div>
                    <Label>Lock Period (days)</Label>
                    <Input
                      type="number"
                      value={form.lock_period_days || ""}
                      onChange={(e) => setField("lock_period_days", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Floor Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.125"
                      value={form.floor_rate ?? ""}
                      onChange={(e) => setField("floor_rate", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="6.000"
                    />
                  </div>
                  <div>
                    <Label>Max Price</Label>
                    <Input
                      type="number"
                      step="0.125"
                      value={form.max_price ?? ""}
                      onChange={(e) => setField("max_price", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="102.000"
                    />
                  </div>
                  <div>
                    <Label>Min Loan Amount</Label>
                    <Input
                      type="number"
                      value={form.min_loan_amount ?? ""}
                      onChange={(e) => setField("min_loan_amount", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="100000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Max LTV Purchase (%)</Label>
                    <Input
                      type="number"
                      value={form.max_ltv_purchase ?? ""}
                      onChange={(e) => setField("max_ltv_purchase", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label>Max LTV R&T (%)</Label>
                    <Input
                      type="number"
                      value={form.max_ltv_rate_term ?? ""}
                      onChange={(e) => setField("max_ltv_rate_term", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label>Max LTV Cash Out (%)</Label>
                    <Input
                      type="number"
                      value={form.max_ltv_cashout ?? ""}
                      onChange={(e) => setField("max_ltv_cashout", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                <h4 className="font-medium pt-2">Lender Fees</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Underwriting Fee ($)</Label>
                    <Input
                      type="number"
                      value={form.underwriting_fee ?? ""}
                      onChange={(e) => setField("underwriting_fee", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="1699"
                    />
                  </div>
                  <div>
                    <Label>Processing Fee ($)</Label>
                    <Input
                      type="number"
                      value={form.processing_fee ?? ""}
                      onChange={(e) => setField("processing_fee", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="695"
                    />
                  </div>
                  <div>
                    <Label>Funding Fee ($)</Label>
                    <Input
                      type="number"
                      value={form.funding_fee ?? ""}
                      onChange={(e) => setField("funding_fee", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="735"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Desk Review Fee ($)</Label>
                    <Input
                      type="number"
                      value={form.desk_review_fee ?? ""}
                      onChange={(e) => setField("desk_review_fee", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="125"
                    />
                  </div>
                  <div>
                    <Label>Entity Review Fee ($)</Label>
                    <Input
                      type="number"
                      value={form.entity_review_fee ?? ""}
                      onChange={(e) => setField("entity_review_fee", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="450"
                    />
                  </div>
                </div>
                <Button onClick={handleAddProduct} disabled={saving} className="w-full">
                  {saving ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No products configured for this lender yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{p.product_name}</h3>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-x-4">
                        <span>Lock: {p.lock_period_days}d</span>
                        {p.floor_rate && <span>Floor: {p.floor_rate}%</span>}
                        {p.max_price && <span>Max Price: {p.max_price}</span>}
                        {p.rate_sheet_date && (
                          <span>Rate Sheet: {formatDate(p.rate_sheet_date)}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-x-4">
                        <span>Max LTV: P={p.max_ltv_purchase || "—"}% / R&T={p.max_ltv_rate_term || "—"}% / CO={p.max_ltv_cashout || "—"}%</span>
                      </div>
                      {(p.underwriting_fee || p.processing_fee || p.funding_fee) && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Fees: {[
                            p.underwriting_fee && `UW ${formatCurrency(p.underwriting_fee)}`,
                            p.processing_fee && `Proc ${formatCurrency(p.processing_fee)}`,
                            p.funding_fee && `Fund ${formatCurrency(p.funding_fee)}`,
                            p.desk_review_fee && `Desk ${formatCurrency(p.desk_review_fee)}`,
                            p.entity_review_fee && `Entity ${formatCurrency(p.entity_review_fee)}`,
                          ].filter(Boolean).join(" | ")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProduct(p.id, p.is_active)}
                      >
                        {p.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="uploads">
        <Card>
          <CardHeader>
            <CardTitle>Rate Sheet Upload History</CardTitle>
          </CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No rate sheets uploaded yet.{" "}
                <a href="/admin/models/dscr?tab=rate-sheets" className="text-teal-600 hover:underline">
                  Upload a rate sheet
                </a>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {uploads.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{u.file_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(u.created_at)}
                          {u.effective_date && ` | Effective: ${formatDate(u.effective_date)}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      u.parsing_status === "success" ? "default" :
                      u.parsing_status === "error" ? "destructive" :
                      u.parsing_status === "review_needed" ? "outline" :
                      "secondary"
                    }>
                      {u.parsing_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>Lender Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                <dd>{lender.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Short Name</dt>
                <dd>{lender.short_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">NMLS ID</dt>
                <dd>{lender.nmls_id || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Account Executive</dt>
                <dd>{lender.account_executive || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">AE Email</dt>
                <dd>{lender.ae_email || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">AE Phone</dt>
                <dd>{lender.ae_phone || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                <dd>{lender.notes || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
