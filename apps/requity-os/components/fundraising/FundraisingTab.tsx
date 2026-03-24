"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  FileCheck,
  MessageSquare,
  ImageIcon,
  FileText,
  X,
  Upload,
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
  updateCommitmentNotes,
  updateFundraiseSettings,
} from "@/lib/fundraising/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormModal } from "@/components/forms/contexts/FormModal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FundraisingTabProps {
  dealId: string;
  dealName: string;
  fundraiseSlug: string | null;
  fundraiseEnabled: boolean;
  fundraiseTarget: number | null;
  fundraiseDescription: string | null;
  fundraiseAmountOptions: number[] | null;
  fundraiseHeroImageUrl: string | null;
  fundraiseDeckUrl: string | null;
}

export function FundraisingTab({
  dealId,
  dealName,
  fundraiseSlug,
  fundraiseEnabled,
  fundraiseTarget,
  fundraiseDescription,
  fundraiseAmountOptions,
  fundraiseHeroImageUrl,
  fundraiseDeckUrl,
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
      fundraiseHeroImageUrl={fundraiseHeroImageUrl}
      fundraiseDeckUrl={fundraiseDeckUrl}
    />
  );
}

// ─── File Upload Helper ───

const BUCKET = "brand-assets";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function uploadFundraiseFile(
  dealId: string,
  file: File,
  kind: "hero" | "deck"
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filePath = `fundraise/${dealId}/${kind}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  // Cache-bust so browser loads new file
  return `${publicUrl}?t=${Date.now()}`;
}

// ─── Reusable File Upload Field ───

function FileUploadField({
  label,
  accept,
  maxSize,
  currentUrl,
  currentFileName,
  onUpload,
  onClear,
  icon: Icon,
  hint,
}: {
  label: string;
  accept: string;
  maxSize: number;
  currentUrl: string | null;
  currentFileName?: string;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
  icon: typeof ImageIcon;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > maxSize) {
      showError(`File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      showError("Could not upload file", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {currentUrl ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">
            {currentFileName ?? "Uploaded"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-destructive"
            onClick={onClear}
            disabled={uploading}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : `Upload ${label}`}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
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
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);

  const handleHeroUpload = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      showError("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    const url = await uploadFundraiseFile(dealId, file, "hero");
    setHeroImageUrl(url);
    showSuccess("Hero image uploaded");
  };

  const handleDeckUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      showError("Please upload a PDF file");
      return;
    }
    const url = await uploadFundraiseFile(dealId, file, "deck");
    setDeckUrl(url);
    showSuccess("Investment deck uploaded");
  };

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
      fundraise_hero_image_url: heroImageUrl,
      fundraise_deck_url: deckUrl,
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
            <FileUploadField
              label="Hero Image"
              accept="image/jpeg,image/png,image/webp"
              maxSize={MAX_IMAGE_SIZE}
              currentUrl={heroImageUrl}
              currentFileName="hero-image"
              onUpload={handleHeroUpload}
              onClear={() => setHeroImageUrl(null)}
              icon={ImageIcon}
              hint="Property photo shown at top of investor page. JPEG, PNG, or WebP (max 10MB)."
            />
            <FileUploadField
              label="Investment Deck"
              accept="application/pdf"
              maxSize={MAX_PDF_SIZE}
              currentUrl={deckUrl}
              currentFileName="investment-deck.pdf"
              onUpload={handleDeckUpload}
              onClear={() => setDeckUrl(null)}
              icon={FileText}
              hint="PDF downloadable from investor page (max 25MB)."
            />
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
  fundraiseHeroImageUrl,
  fundraiseDeckUrl,
}: {
  dealId: string;
  dealName: string;
  fundraiseSlug: string;
  fundraiseTarget: number | null;
  fundraiseDescription: string | null;
  fundraiseAmountOptions: number[] | null;
  fundraiseHeroImageUrl: string | null;
  fundraiseDeckUrl: string | null;
}) {
  const router = useRouter();
  const [commitments, setCommitments] = useState<SoftCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{
    id: string;
    notes: string;
  } | null>(null);

  // Load commitments client-side
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("soft_commitments" as never)
      .select("*, contact:crm_contacts!soft_commitments_contact_id_fkey(contact_number)" as never)
      .eq("deal_id" as never, dealId as never)
      .order("submitted_at" as never, { ascending: false } as never)
      .then(({ data }) => {
        setCommitments((data ?? []) as unknown as SoftCommitment[]);
        setLoading(false);
      });
  }, [dealId]);

  // Stats
  const stats = useMemo(() => {
    const totalCommitted = commitments
      .filter((c) => c.status === "pending" || c.status === "confirmed")
      .reduce((s, c) => s + c.commitment_amount, 0);
    const totalSubscribed = commitments
      .filter((c) => c.status === "subscribed")
      .reduce((s, c) => s + c.commitment_amount, 0);
    const totalActive = totalCommitted + totalSubscribed;
    const investorCount = new Set(commitments.map((c) => c.email)).size;
    const avg =
      commitments.length > 0 ? totalActive / commitments.length : 0;
    const accreditedCount = commitments.filter(
      (c) => c.is_accredited === true
    ).length;
    const accreditedPct =
      commitments.length > 0
        ? ((accreditedCount / commitments.length) * 100).toFixed(0)
        : "0";
    const subscribedPct =
      fundraiseTarget && fundraiseTarget > 0
        ? Math.min((totalSubscribed / fundraiseTarget) * 100, 100)
        : 0;
    const committedOnlyPct =
      fundraiseTarget && fundraiseTarget > 0
        ? Math.min((totalCommitted / fundraiseTarget) * 100, 100 - subscribedPct)
        : 0;
    const totalPct = subscribedPct + committedOnlyPct;
    return { totalCommitted, totalSubscribed, totalActive, investorCount, avg, accreditedPct, subscribedPct, committedOnlyPct, totalPct };
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

  const handleSaveNotes = useCallback(async () => {
    if (!notesDialog) return;
    const result = await updateCommitmentNotes(notesDialog.id, notesDialog.notes);
    if (result.error) {
      showError("Could not save notes", result.error);
    } else {
      showSuccess("Notes saved");
      setCommitments((prev) =>
        prev.map((c) =>
          c.id === notesDialog.id ? { ...c, notes: notesDialog.notes } : c
        )
      );
      setNotesDialog(null);
    }
  }, [notesDialog]);

  const handleFormComplete = useCallback(() => {
    setShowFormModal(false);
    // Re-fetch commitments
    const supabase = createClient();
    supabase
      .from("soft_commitments" as never)
      .select("*, contact:crm_contacts!soft_commitments_contact_id_fkey(contact_number)" as never)
      .eq("deal_id" as never, dealId as never)
      .order("submitted_at" as never, { ascending: false } as never)
      .then(({ data }) => {
        setCommitments((data ?? []) as unknown as SoftCommitment[]);
      });
  }, [dealId]);

  const columns: Column<SoftCommitment>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => {
        const content = (
          <div>
            <div className="font-medium text-sm">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        );
        return row.contact_id && row.contact?.contact_number ? (
          <Link
            href={`/contacts/${row.contact.contact_number}`}
            className="hover:underline underline-offset-4"
          >
            {content}
          </Link>
        ) : (
          content
        );
      },
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
      key: "questions",
      header: "Questions",
      cell: (row) =>
        row.questions ? (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={row.questions}>
            {row.questions}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">&mdash;</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setNotesDialog({ id: row.id, notes: row.notes ?? "" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rq-transition max-w-[200px]"
        >
          {row.notes ? (
            <span className="truncate" title={row.notes}>{row.notes}</span>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Add</span>
            </>
          )}
        </button>
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
            <DropdownMenuItem
              onClick={() =>
                setNotesDialog({ id: row.id, notes: row.notes ?? "" })
              }
            >
              Edit Notes
            </DropdownMenuItem>
            {row.contact_id && row.contact?.contact_number && (
              <DropdownMenuItem asChild>
                <Link href={`/contacts/${row.contact.contact_number}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View Contact
                </Link>
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
                {formatCurrency(stats.totalActive)} committed
              </span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(fundraiseTarget)} target
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-primary rq-transition"
                style={{ width: `${stats.subscribedPct}%` }}
              />
              <div
                className="h-full bg-primary/35 rq-transition"
                style={{ width: `${stats.committedOnlyPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  Subscribed {formatCurrency(stats.totalSubscribed)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/35" />
                  Committed {formatCurrency(stats.totalCommitted)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {stats.totalPct.toFixed(1)}% of target
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          title="Total Committed"
          value={formatCurrency(stats.totalCommitted)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Subscribed"
          value={formatCurrency(stats.totalSubscribed)}
          icon={<FileCheck className="h-4 w-4" />}
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
          onClick={() => setShowFormModal(true)}
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
            heroImageUrl={fundraiseHeroImageUrl}
            deckUrl={fundraiseDeckUrl}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Manual Commitment Form Modal */}
      <FormModal
        open={showFormModal}
        title="Add Manual Commitment"
        formSlug="soft-commitment"
        dealId={dealId}
        prefillData={{
          _deal_amount_options: fundraiseAmountOptions ?? [25000, 50000, 100000, 250000],
          _deal_name: dealName,
          _source: "manual",
        }}
        onComplete={handleFormComplete}
        onClose={() => setShowFormModal(false)}
      />

      {/* Notes Dialog */}
      <Dialog
        open={!!notesDialog}
        onOpenChange={(open) => !open && setNotesDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesDialog?.notes ?? ""}
            onChange={(e) =>
              notesDialog &&
              setNotesDialog({ ...notesDialog, notes: e.target.value })
            }
            rows={4}
            placeholder="Internal notes about this commitment..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  heroImageUrl,
  deckUrl,
}: {
  dealId: string;
  slug: string;
  target: number | null;
  description: string | null;
  amountOptions: number[] | null;
  heroImageUrl: string | null;
  deckUrl: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug,
    target: String(target ?? ""),
    description: description ?? "",
    amountOptions: (amountOptions ?? []).join(", "),
  });
  const [currentHeroUrl, setCurrentHeroUrl] = useState(heroImageUrl);
  const [currentDeckUrl, setCurrentDeckUrl] = useState(deckUrl);

  const handleHeroUpload = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      showError("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    const url = await uploadFundraiseFile(dealId, file, "hero");
    setCurrentHeroUrl(url);
    // Save immediately
    await updateFundraiseSettings(dealId, { fundraise_hero_image_url: url });
    showSuccess("Hero image uploaded");
    router.refresh();
  };

  const handleDeckUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      showError("Please upload a PDF file");
      return;
    }
    const url = await uploadFundraiseFile(dealId, file, "deck");
    setCurrentDeckUrl(url);
    // Save immediately
    await updateFundraiseSettings(dealId, { fundraise_deck_url: url });
    showSuccess("Investment deck uploaded");
    router.refresh();
  };

  const handleClearHero = async () => {
    setCurrentHeroUrl(null);
    await updateFundraiseSettings(dealId, { fundraise_hero_image_url: null });
    showSuccess("Hero image removed");
    router.refresh();
  };

  const handleClearDeck = async () => {
    setCurrentDeckUrl(null);
    await updateFundraiseSettings(dealId, { fundraise_deck_url: null });
    showSuccess("Investment deck removed");
    router.refresh();
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploadField
            label="Hero Image"
            accept="image/jpeg,image/png,image/webp"
            maxSize={MAX_IMAGE_SIZE}
            currentUrl={currentHeroUrl}
            currentFileName="hero-image"
            onUpload={handleHeroUpload}
            onClear={handleClearHero}
            icon={ImageIcon}
            hint="JPEG, PNG, or WebP (max 10MB)."
          />
          <FileUploadField
            label="Investment Deck"
            accept="application/pdf"
            maxSize={MAX_PDF_SIZE}
            currentUrl={currentDeckUrl}
            currentFileName="investment-deck.pdf"
            onUpload={handleDeckUpload}
            onClear={handleClearDeck}
            icon={FileText}
            hint="PDF (max 25MB)."
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
