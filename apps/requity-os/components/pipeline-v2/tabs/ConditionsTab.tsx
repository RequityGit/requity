"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Ban,
  Upload,
  Shield,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type DealCondition } from "@/components/pipeline-v2/pipeline-types";
import { updateConditionStatusAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  deleteDealDocumentV2,
  getDocumentSignedUrl,
} from "@/app/(authenticated)/admin/pipeline-v2/[id]/actions";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { createClient } from "@/lib/supabase/client";

// ─── Category grouping ───

const CATEGORY_GROUPS: Record<string, string[]> = {
  ptf: [
    "borrower_documents",
    "non_us_citizen",
    "entity_documents",
    "deal_level_items",
    "appraisal_request",
    "insurance_request",
    "title_request",
    "title_fraud_protection",
    "fundraising",
    "prior_to_funding",
  ],
  ptc: ["closing_prep", "lender_package"],
  ptd: ["prior_to_approval"],
  post_closing: ["post_closing_items", "note_sell_process", "post_loan_payoff"],
};

function getCategoryGroup(category: string): string {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group;
  }
  return "ptf";
}

const GROUP_LABELS: Record<string, string> = {
  all: "All",
  ptf: "PTF",
  ptc: "PTC",
  ptd: "PTD",
  post_closing: "POST CLOSING",
};

const CATEGORY_LABELS: Record<string, string> = {
  borrower_documents: "Borrower Documents",
  non_us_citizen: "Non-US Citizen",
  entity_documents: "Entity Documents",
  deal_level_items: "Deal Level Items",
  appraisal_request: "Appraisal",
  insurance_request: "Insurance",
  title_request: "Title",
  title_fraud_protection: "Title / Fraud Protection",
  fundraising: "Fundraising",
  prior_to_funding: "Prior to Funding",
  closing_prep: "Closing Prep",
  lender_package: "Lender Package",
  prior_to_approval: "Prior to Approval",
  post_closing_items: "Post Closing",
  note_sell_process: "Note Sell",
  post_loan_payoff: "Post Loan Payoff",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-600", icon: FileText },
  under_review: { label: "Under Review", color: "bg-amber-500/10 text-amber-600", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  waived: { label: "Waived", color: "bg-slate-500/10 text-slate-500", icon: Ban },
  not_applicable: { label: "N/A", color: "bg-slate-500/10 text-slate-400", icon: Ban },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600", icon: AlertTriangle },
};

const STATUS_OPTIONS = ["pending", "submitted", "under_review", "approved", "waived", "not_applicable", "rejected"];

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ConditionsTabProps {
  conditions: DealCondition[];
  dealId: string;
}

export function ConditionsTab({ conditions, dealId }: ConditionsTabProps) {
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [cpOnly, setCpOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filtered = conditions.filter((c) => {
    if (groupFilter !== "all" && getCategoryGroup(c.category) !== groupFilter) return false;
    if (cpOnly && !c.critical_path_item) return false;
    return true;
  });

  const cleared = conditions.filter(
    (c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable"
  ).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  // Group by category
  const byCategory = new Map<string, DealCondition[]>();
  for (const c of filtered) {
    const cat = c.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Expand all categories by default on first render
  const allExpanded = expandedCategories.size === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold num">
            {cleared} of {total} cleared ({pct}%)
          </span>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="num">{conditions.filter((c) => c.status === "pending").length} pending</span>
            <span className="num">{conditions.filter((c) => c.status === "submitted").length} submitted</span>
            <span className="num">{conditions.filter((c) => c.status === "under_review").length} in review</span>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: pct + "%" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setGroupFilter(key)}
            className={cn(
              "cursor-pointer rounded-lg border px-3.5 py-1 text-xs font-medium transition-colors",
              groupFilter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <button
          className="ml-2 flex cursor-pointer items-center gap-1.5 bg-transparent border-0"
          onClick={() => setCpOnly(!cpOnly)}
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              cpOnly ? "border-primary bg-primary" : "border-border"
            )}
          >
            {cpOnly && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">Critical Path</span>
        </button>
      </div>

      {/* Condition cards grouped by category */}
      {filtered.length === 0 && (
        <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No conditions match the current filter.
        </div>
      )}

      {Array.from(byCategory.entries()).map(([category, items]) => {
        const catLabel = CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
        const catCleared = items.filter(
          (c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable"
        ).length;
        const isExpanded = allExpanded || expandedCategories.has(category);

        return (
          <div key={category} className="rounded-xl border bg-card overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between px-5 py-3 bg-transparent border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold capitalize">{catLabel}</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {getCategoryGroup(category)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground num">
                {catCleared}/{items.length}
              </span>
            </button>

            {/* Condition rows */}
            {isExpanded && (
              <div className="border-t divide-y">
                {items.map((c) => (
                  <ConditionRow
                    key={c.id}
                    condition={c}
                    dealId={dealId}
                    isExpanded={expandedRows.has(c.id)}
                    onToggleExpand={() => toggleRow(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Condition Row ───

interface ConditionDocument {
  id: string;
  document_name: string;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

function ConditionRow({
  condition: c,
  dealId,
  isExpanded,
  onToggleExpand,
}: {
  condition: DealCondition;
  dealId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const isOverdue = c.status === "pending" && c.due_date && new Date(c.due_date) < new Date();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateConditionStatusAction(c.id, newStatus);
      if (result.error) {
        toast.error(`Failed to update: ${result.error}`);
      } else {
        const msg = (result as { message?: string }).message;
        toast.success(msg ?? `Condition ${newStatus === "approved" ? "approved" : "updated"}`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div
        className="flex items-center gap-3.5 px-5 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggleExpand}
      >
        {/* Expand toggle */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0">
          <StatusIcon
            className={cn(
              "h-[18px] w-[18px]",
              c.status === "approved" && "text-green-500",
              c.status === "waived" && "text-slate-400",
              c.status === "rejected" && "text-red-500",
              c.status === "submitted" && "text-blue-500",
              c.status === "under_review" && "text-amber-500",
              c.status === "pending" && "text-muted-foreground",
              c.status === "not_applicable" && "text-slate-400"
            )}
            strokeWidth={1.5}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                (c.status === "approved" || c.status === "waived" || c.status === "not_applicable") &&
                  "line-through opacity-60"
              )}
            >
              {c.condition_name}
            </span>
            {c.critical_path_item && (
              <Badge variant="destructive" className="text-[10px]">
                Critical
              </Badge>
            )}
            {c.requires_approval && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 bg-violet-500/10 border border-violet-500/20 rounded-full px-1.5 py-px">
                <Shield className="h-2.5 w-2.5" strokeWidth={2} />
                Approval Required
              </span>
            )}
            {c.status === "under_review" && c.requires_approval && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-px">
                <Clock className="h-2.5 w-2.5" strokeWidth={2} />
                Awaiting Approval
              </span>
            )}
            {c.responsible_party && (
              <span className="text-[10px] text-muted-foreground uppercase">
                {c.responsible_party}
              </span>
            )}
          </div>
          <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
            <span className="capitalize">{c.required_stage.replace(/_/g, " ")}</span>
            {c.due_date && (
              <span
                className={cn("num", isOverdue && "text-red-500 font-medium")}
              >
                Due: {formatDate(c.due_date)}
                {isOverdue ? " (OVERDUE)" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Badge className={cn("text-[10px] border-0", statusCfg.color)}>
            {statusCfg.label}
          </Badge>
          <Select
            value={c.status}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_CONFIG[s]?.label ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expanded section: Documents + Notes */}
      {isExpanded && (
        <div className="border-t bg-muted/20 px-5 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents */}
            <ConditionDocuments conditionId={c.id} dealId={dealId} />

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Notes
              </h4>
              <UnifiedNotes
                entityType="unified_condition"
                entityId={c.id}
                loanId={dealId}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Condition Documents ───

function ConditionDocuments({
  conditionId,
  dealId,
}: {
  conditionId: string;
  dealId: string;
}) {
  const [docs, setDocs] = useState<ConditionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("unified_deal_documents" as never)
      .select("id, document_name, file_url, storage_path, file_size_bytes, created_at" as never)
      .eq("condition_id" as never, conditionId as never)
      .order("created_at" as never, { ascending: false });

    if (error) {
      console.error("Error fetching condition documents:", error);
    } else {
      setDocs((data as unknown as ConditionDocument[]) ?? []);
    }
    setLoading(false);
  }, [conditionId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get a signed upload URL from the server
      const urlResult = await createDealDocumentUploadUrl(dealId, file.name, conditionId);
      if (urlResult.error || !urlResult.signedUrl || !urlResult.storagePath || !urlResult.token) {
        toast.error(`Upload failed: ${urlResult.error ?? "Could not create upload URL"}`);
        return;
      }

      // 2. Upload file directly to Supabase storage (bypasses Netlify 6MB limit)
      const uploadRes = await fetch(urlResult.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => "Unknown error");
        toast.error(`Upload failed: ${errorText}`);
        return;
      }

      // 3. Save the document record in the database
      const saveResult = await saveDealDocumentRecord({
        dealId,
        storagePath: urlResult.storagePath,
        documentName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        conditionId,
      });

      if (saveResult.error) {
        toast.error(`Upload failed: ${saveResult.error}`);
      } else {
        toast.success(`${file.name} uploaded`);
        fetchDocs();
      }
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : "Upload failed"}`
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDownload(doc: ConditionDocument) {
    if (!doc.storage_path) {
      window.open(doc.file_url, "_blank");
      return;
    }
    const result = await getDocumentSignedUrl(doc.storage_path);
    if (result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error("Failed to generate download link");
    }
  }

  async function handleDelete(docId: string) {
    const result = await deleteDealDocumentV2(docId);
    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
    } else {
      toast.success("Document deleted");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    }
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Documents
        </h4>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={uploading}
            asChild
          >
            <span>
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="h-10 rounded-lg bg-muted animate-pulse" />
      ) : docs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">No documents attached.</p>
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <span className="text-xs font-medium truncate">{doc.document_name}</span>
                {doc.file_size_bytes && (
                  <span className="text-[10px] text-muted-foreground num shrink-0">
                    {formatBytes(doc.file_size_bytes)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
