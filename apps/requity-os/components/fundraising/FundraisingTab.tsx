"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type Column } from "@/components/shared/data-table";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Copy,
  Check,
  Plus,
  Download,
  Settings2,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  Users,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import type { SoftCommitment, CommitmentStatus } from "@/lib/fundraising/types";
import {
  COMMITMENT_STATUS_OPTIONS,
  COMMITMENT_STATUS_COLORS,
} from "@/lib/fundraising/types";
import {
  updateCommitmentStatus,
  updateFundraiseSettings,
  addManualCommitment,
} from "@/lib/fundraising/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface FundraisingTabProps {
  dealId: string;
  dealName: string;
  fundraiseSlug: string | null;
  fundraiseEnabled: boolean;
  fundraiseTarget: number | null;
  fundraiseDescription: string | null;
  fundraiseAmountOptions: number[] | null;
}

export function FundraisingTab({
  dealId,
  dealName,
  fundraiseSlug,
  fundraiseEnabled,
  fundraiseTarget,
  fundraiseDescription,
  fundraiseAmountOptions,
}: FundraisingTabProps) {
  if (!fundraiseEnabled) {
    return (
      <FundraiseSetupScreen
        dealId={dealId}
        dealName={dealName}
        initialSlug={fundraiseSlug}
        initialTarget={fundraiseTarget}
        initialDescription={fundraiseDescription}
        initialAmountOptions={fundraiseAmountOptions}
      />
    );
  }

  return (
    <FundraiseDashboard
      dealId={dealId}
      dealName={dealName}
      fundraiseSlug={fundraiseSlug!}
      fundraiseTarget={fundraiseTarget}
      fundraiseDescription={fundraiseDescription}
      fundraiseAmountOptions={fundraiseAmountOptions}
    />
  );
}

// ─── Setup Screen (when fundraise_enabled = false) ───

function FundraiseSetupScreen({
  dealId,
  dealName,
  initialSlug,
  initialTarget,
  initialDescription,
  initialAmountOptions,
}: {
  dealId: string;
  dealName: string;
  initialSlug: string | null;
  initialTarget: number | null;
  initialDescription: string | null;
  initialAmountOptions: number[] | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState(
    initialSlug ?? dealName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  );
  const [target, setTarget] = useState(String(initialTarget ?? ""));
  const [description, setDescription] = useState(initialDescription ?? "");
  const [amountOptions, setAmountOptions] = useState(
    (initialAmountOptions ?? [25000, 50000, 100000, 250000]).join(", ")
  );

  const handleEnable = async () => {
    if (!slug.trim()) {
      showError("Slug is required");
      return;
    }
    setSaving(true);
    const result = await updateFundraiseSettings(dealId, {
      fundraise_slug: slug.trim(),
      fundraise_enabled: true,
      fundraise_target: parseFloat(target) || null,
      fundraise_description: description || null,
      fundraise_amount_options: amountOptions
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n) && n > 0),
    });
    if (result.error) {
      showError("Could not enable fundraising", result.error);
    } else {
      showSuccess("Fundraising enabled");
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <div className="rq-tab-content">
      <div className="max-w-xl mx-auto">
        <EmptyState
          icon={Rocket}
          title="Set Up Fundraising"
          description="Configure your fundraise settings to generate a public commitment form and start collecting investor interest."
        />
        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/invest/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-deal-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fundraise Target</Label>
              <Input
                type="number"
                min={0}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 5000000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this investment opportunity for potential investors..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount Options (comma-separated)</Label>
              <Input
                value={amountOptions}
                onChange={(e) => setAmountOptions(e.target.value)}
                placeholder="25000, 50000, 100000, 250000"
              />
              <p className="text-xs text-muted-foreground">
                These appear as radio buttons on the public form. An &quot;Other&quot; option is always included.
              </p>
            </div>
            <Button onClick={handleEnable} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enable Fundraising
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Dashboard (when fundraise_enabled = true) ───

function FundraiseDashboard({
  dealId,
  dealName,
  fundraiseSlug,
  fundraiseTarget,
  fundraiseDescription,
  fundraiseAmountOptions,
}: {
  dealId: string;
  dealName: string;
  fundraiseSlug: string;
  fundraiseTarget: number | null;
  fundraiseDescription: string | null;
  fundraiseAmountOptions: number[] | null;
}) {
  const router = useRouter();
  const [commitments, setCommitments] = useState<SoftCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);

  // Load commitments client-side
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("soft_commitments" as never)
      .select("*" as never)
      .eq("deal_id" as never, dealId as never)
      .order("submitted_at" as never, { ascending: false } as never)
      .then(({ data }) => {
        setCommitments((data ?? []) as unknown as SoftCommitment[]);
        setLoading(false);
      });
  }, [dealId]);

  // Stats
  const stats = useMemo(() => {
    const totalAmount = commitments.reduce(
      (s, c) => s + c.commitment_amount,
      0
    );
    const investorCount = new Set(commitments.map((c) => c.email)).size;
    const avg =
      commitments.length > 0 ? totalAmount / commitments.length : 0;
    const accreditedCount = commitments.filter(
      (c) => c.is_accredited === true
    ).length;
    const accreditedPct =
      commitments.length > 0
        ? ((accreditedCount / commitments.length) * 100).toFixed(0)
        : "0";
    const progress =
      fundraiseTarget && fundraiseTarget > 0
        ? Math.min((totalAmount / fundraiseTarget) * 100, 100)
        : 0;
    return { totalAmount, investorCount, avg, accreditedPct, progress };
  }, [commitments, fundraiseTarget]);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invest/${fundraiseSlug}`
      : `/invest/${fundraiseSlug}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showSuccess("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [publicUrl]);

  const handleExportCsv = useCallback(() => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Amount",
      "Accredited",
      "Status",
      "Source",
      "Submitted",
      "Notes",
    ];
    const rows = commitments.map((c) => [
      c.name,
      c.email,
      c.phone ?? "",
      String(c.commitment_amount),
      c.is_accredited == null ? "" : c.is_accredited ? "Yes" : "No",
      c.status,
      c.source,
      c.submitted_at,
      c.notes ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soft-commitments-${fundraiseSlug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [commitments, fundraiseSlug]);

  const handleStatusChange = useCallback(
    async (id: string, status: CommitmentStatus) => {
      const result = await updateCommitmentStatus(id, status);
      if (result.error) {
        showError("Could not update status", result.error);
      } else {
        showSuccess("Status updated");
        setCommitments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
      }
    },
    []
  );

  const columns: Column<SoftCommitment>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <div className="font-medium text-sm">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="num text-sm font-medium">
          {formatCurrency(row.commitment_amount)}
        </span>
      ),
    },
    {
      key: "accredited",
      header: "Accredited",
      cell: (row) => (
        <span className="text-sm">
          {row.is_accredited == null ? "-" : row.is_accredited ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={cn(
            "text-xs capitalize",
            COMMITMENT_STATUS_COLORS[row.status as CommitmentStatus]
          )}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "source",
      header: "Source",
      cell: (row) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.source}
        </span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.submitted_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COMMITMENT_STATUS_OPTIONS.filter(
              (o) => o.value !== row.status
            ).map((o) => (
              <DropdownMenuItem
                key={o.value}
                onClick={() => handleStatusChange(row.id, o.value)}
              >
                Mark as {o.label}
              </DropdownMenuItem>
            ))}
            {row.contact_id && (
              <DropdownMenuItem asChild>
                <a href={`/contacts/${row.contact_id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View Contact
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="rq-tab-content space-y-6">
      {/* Progress Bar */}
      {fundraiseTarget && fundraiseTarget > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {formatCurrency(stats.totalAmount)} raised
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(fundraiseTarget)} target
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full rq-transition"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.progress.toFixed(1)}% of target
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Raised"
          value={formatCurrency(stats.totalAmount)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Investors"
          value={stats.investorCount}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title="Avg Ticket"
          value={formatCurrency(Math.round(stats.avg))}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="% Accredited"
          value={`${stats.accreditedPct}%`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-3.5 w-3.5 mr-2" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-2" />
          )}
          {copied ? "Copied" : "Copy Form Link"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualDialog(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Add Manual
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={commitments.length === 0}
        >
          <Download className="h-3.5 w-3.5 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Commitment Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={commitments}
          emptyMessage="No commitments yet"
        />
      )}

      {/* Config Panel */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Fundraise Settings
            <ChevronDown
              className={cn(
                "h-4 w-4 rq-transition",
                configOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <FundraiseConfigPanel
            dealId={dealId}
            slug={fundraiseSlug}
            target={fundraiseTarget}
            description={fundraiseDescription}
            amountOptions={fundraiseAmountOptions}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Manual Dialog */}
      <ManualDealCommitmentDialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
        dealId={dealId}
        onSuccess={() => {
          setShowManualDialog(false);
          // Re-fetch commitments
          const supabase = createClient();
          supabase
            .from("soft_commitments" as never)
            .select("*" as never)
            .eq("deal_id" as never, dealId as never)
            .order("submitted_at" as never, { ascending: false } as never)
            .then(({ data }) => {
              setCommitments((data ?? []) as unknown as SoftCommitment[]);
            });
        }}
      />
    </div>
  );
}

// ─── Config Panel ───

function FundraiseConfigPanel({
  dealId,
  slug,
  target,
  description,
  amountOptions,
}: {
  dealId: string;
  slug: string;
  target: number | null;
  description: string | null;
  amountOptions: number[] | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug,
    target: String(target ?? ""),
    description: description ?? "",
    amountOptions: (amountOptions ?? []).join(", "),
  });

  const handleSave = async () => {
    setSaving(true);
    const result = await updateFundraiseSettings(dealId, {
      fundraise_slug: form.slug,
      fundraise_target: parseFloat(form.target) || null,
      fundraise_description: form.description || null,
      fundraise_amount_options: form.amountOptions
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n) && n > 0),
    });
    if (result.error) {
      showError("Could not save settings", result.error);
    } else {
      showSuccess("Settings saved");
      router.refresh();
    }
    setSaving(false);
  };

  const handleDisable = async () => {
    setSaving(true);
    const result = await updateFundraiseSettings(dealId, {
      fundraise_enabled: false,
    });
    if (result.error) {
      showError("Could not disable fundraising", result.error);
    } else {
      showSuccess("Fundraising disabled");
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <Card className="mt-3">
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>URL Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fundraise Target</Label>
            <Input
              type="number"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Amount Options (comma-separated)</Label>
          <Input
            value={form.amountOptions}
            onChange={(e) =>
              setForm({ ...form, amountOptions: e.target.value })
            }
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={saving}
          >
            Disable Fundraising
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Manual Deal Commitment Dialog ───

function ManualDealCommitmentDialog({
  open,
  onOpenChange,
  dealId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await addManualCommitment({
      deal_id: dealId,
      name,
      email,
      phone: phone || undefined,
      commitment_amount: parseFloat(amount) || 0,
    });
    if (result.error) {
      showError("Could not add commitment", result.error);
    } else {
      showSuccess("Commitment added");
      reset();
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Commitment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name || !email || !amount}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Commitment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
