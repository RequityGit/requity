"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Pencil,
  History,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
// Tables pricing_programs / leverage_adjusters / pricing_program_versions may not be in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PricingProgram = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeverageAdjuster = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PricingProgramVersion = Record<string, any>;

interface PricingProgramsManagerProps {
  programs: PricingProgram[];
  adjusters: LeverageAdjuster[];
  versions: PricingProgramVersion[];
}

export function PricingProgramsManager({
  programs,
  adjusters,
  versions,
}: PricingProgramsManagerProps) {
  const currentPrograms = programs.filter((p) => p.is_current);

  return (
    <Tabs defaultValue="programs">
      <TabsList>
        <TabsTrigger value="programs">Programs</TabsTrigger>
        <TabsTrigger value="adjusters">
          Leverage Adjusters ({adjusters.filter((a) => a.is_active).length})
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1">
          <History className="h-3.5 w-3.5" />
          Version History ({versions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="programs" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="adjusters" className="mt-4">
        <AdjustersPanel adjusters={adjusters} />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <VersionHistoryTable versions={versions} />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Program Card
// ---------------------------------------------------------------------------

function ProgramCard({ program }: { program: PricingProgram }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{program.program_name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              v{program.version}
            </Badge>
            {program.is_current && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                Current
              </Badge>
            )}
            <EditProgramDialog program={program} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <Field label="Loan Type" value={program.loan_type ?? "—"} />
          <Field label="Program ID" value={program.program_id} />
          <Field
            label="Interest Rate"
            value={`${program.interest_rate}% ${program.rate_type}`}
          />
          <Field
            label="Origination"
            value={program.points_note ?? `${program.origination_points}%`}
          />
          <Field label="Max LTV" value={`${program.max_ltv}%`} note={program.ltv_note} />
          <Field label="Max LTC" value={`${program.max_ltc}%`} note={program.ltc_note} />
          <Field label="Max LTP" value={`${program.max_ltp}%`} />
          <Field
            label="Term"
            value={program.term_note ?? `${program.loan_term_months} months`}
          />
          <Field label="Exit Points" value={`${program.exit_points}%`} />
          <Field label="Legal/Doc Fee" value={formatCurrency(program.legal_doc_fee)} />
          <Field label="BPO/Appraisal" value={formatCurrency(program.bpo_appraisal_cost)} note={program.bpo_appraisal_note} />
          <Field
            label="Min Credit Score"
            value={program.min_credit_score > 0 ? `${program.min_credit_score}` : "None"}
          />
          <Field
            label="Min Experience"
            value={program.min_deals_24mo > 0 ? `${program.min_deals_24mo} deals` : "None"}
          />
          <Field label="Citizenship" value={program.citizenship === "us_resident" ? "US Resident" : "Any"} />
        </div>
        <Separator className="my-3" />
        <div className="text-xs text-muted-foreground">
          Effective: {formatDate(program.effective_date)}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">
        {value}
        {note && <span className="text-xs text-muted-foreground ml-1">({note})</span>}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Program Dialog
// ---------------------------------------------------------------------------

function EditProgramDialog({ program }: { program: PricingProgram }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    interest_rate: String(program.interest_rate),
    origination_points: String(program.origination_points),
    min_origination_fee: String(program.min_origination_fee),
    max_ltv: String(program.max_ltv),
    max_ltc: String(program.max_ltc),
    max_ltp: String(program.max_ltp),
    loan_term_months: String(program.loan_term_months),
    min_credit_score: String(program.min_credit_score),
    min_deals_24mo: String(program.min_deals_24mo),
    legal_doc_fee: String(program.legal_doc_fee),
    bpo_appraisal_cost: String(program.bpo_appraisal_cost),
    change_description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.change_description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what changed and why",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("create_pricing_version", {
        p_program_id: program.program_id,
        p_changes: {
          interest_rate: parseFloat(form.interest_rate),
          origination_points: parseFloat(form.origination_points),
          min_origination_fee: parseFloat(form.min_origination_fee),
          max_ltv: parseFloat(form.max_ltv),
          max_ltc: parseFloat(form.max_ltc),
          max_ltp: parseFloat(form.max_ltp),
          loan_term_months: parseInt(form.loan_term_months),
          min_credit_score: parseFloat(form.min_credit_score),
          min_deals_24mo: parseFloat(form.min_deals_24mo),
          legal_doc_fee: parseFloat(form.legal_doc_fee),
          bpo_appraisal_cost: parseFloat(form.bpo_appraisal_cost),
          change_description: form.change_description,
        },
        p_changed_by: (await supabase.auth.getUser()).data.user?.id ?? "",
      });

      if (error) throw error;

      toast({ title: `${program.program_name} updated to v${(data as any)?.new_version ?? "new"}` });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {program.program_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.25"
                value={form.interest_rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interest_rate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Origination Pts (%)</Label>
              <Input
                type="number"
                step="0.25"
                value={form.origination_points}
                onChange={(e) =>
                  setForm((f) => ({ ...f, origination_points: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Max LTV (%)</Label>
              <Input
                type="number"
                value={form.max_ltv}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_ltv: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Max LTC (%)</Label>
              <Input
                type="number"
                value={form.max_ltc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_ltc: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Max LTP (%)</Label>
              <Input
                type="number"
                value={form.max_ltp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_ltp: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Term (months)</Label>
              <Input
                type="number"
                value={form.loan_term_months}
                onChange={(e) =>
                  setForm((f) => ({ ...f, loan_term_months: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Min Credit Score</Label>
              <Input
                type="number"
                value={form.min_credit_score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_credit_score: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Min Deals (24mo)</Label>
              <Input
                type="number"
                value={form.min_deals_24mo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_deals_24mo: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">What changed? (required)</Label>
            <Input
              placeholder="e.g. Increased rate by 50bps due to market conditions"
              value={form.change_description}
              onChange={(e) =>
                setForm((f) => ({ ...f, change_description: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create New Version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Adjusters Panel
// ---------------------------------------------------------------------------

function AdjustersPanel({ adjusters }: { adjusters: LeverageAdjuster[] }) {
  const columns: Column<LeverageAdjuster>[] = [
    {
      key: "sort_order",
      header: "#",
      cell: (row) => row.sort_order,
      className: "w-10",
    },
    {
      key: "display_name",
      header: "Risk Factor",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.condition_description}
          </p>
        </div>
      ),
    },
    {
      key: "ltc_adjustment",
      header: "LTC Adj",
      cell: (row) => (
        <span className="text-red-600 font-medium">
          {row.ltc_adjustment}%
        </span>
      ),
    },
    {
      key: "ltv_adjustment",
      header: "LTV Adj",
      cell: (row) => (
        <span className="text-red-600 font-medium">
          {row.ltv_adjustment}%
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (row) =>
        row.is_active ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        ),
    },
    {
      key: "note",
      header: "Note",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.note ?? "—"}</span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Balance Sheet Leverage Adjusters
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            ff_balance only
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<LeverageAdjuster>
          columns={columns}
          data={adjusters}
          emptyMessage="No leverage adjusters configured"
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Version History Table
// ---------------------------------------------------------------------------

function VersionHistoryTable({
  versions,
}: {
  versions: PricingProgramVersion[];
}) {
  const columns: Column<PricingProgramVersion>[] = [
    {
      key: "program_id",
      header: "Program",
      cell: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.program_id}
        </Badge>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (row) => `v${row.version}`,
    },
    {
      key: "change_description",
      header: "Change",
      cell: (row) => (
        <span className="text-sm">{row.change_description ?? "—"}</span>
      ),
    },
    {
      key: "changed_at",
      header: "Date",
      cell: (row) => formatDate(row.changed_at),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<PricingProgramVersion>
          columns={columns}
          data={versions}
          emptyMessage="No version history yet"
        />
      </CardContent>
    </Card>
  );
}
