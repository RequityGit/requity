"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Link2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/toast";
import type { FormStep } from "@/lib/form-engine/types";

// ─── Types ───

interface FormSubmissionRow {
  id: string;
  form_id: string;
  status: string;
  data: Record<string, unknown>;
  submitted_by_email: string | null;
  created_at: string;
  updated_at: string;
  form_definitions: {
    id: string;
    name: string;
    slug: string;
    steps: FormStep[];
  } | null;
}

interface DealApplicationLinkRow {
  id: string;
  token: string;
  deal_id: string;
  form_id: string;
  contact_id: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  form_definitions: {
    name: string;
    slug: string;
  } | null;
  crm_contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface FormDefinitionOption {
  id: string;
  name: string;
  slug: string;
}

// ─── Submission Filtering ───

const COMPLETED_STATUSES = new Set(["submitted", "reviewed", "processed"]);

/** Count user-entered (non-system) non-empty fields in submission data.
 *  System/internal fields are prefixed with `_` (e.g. `_deal_name`, `_deal_amount_options`). */
function countUserFields(data: Record<string, unknown>): number {
  return Object.entries(data).filter(
    ([k, v]) => !k.startsWith("_") && v !== null && v !== undefined && v !== ""
  ).length;
}

// ─── Status Helpers ───

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  partial: { label: "In Progress", variant: "secondary", icon: Clock },
  pending_borrower: { label: "Pending Borrower", variant: "outline", icon: Clock },
  submitted: { label: "Submitted", variant: "default", icon: CheckCircle2 },
  reviewed: { label: "Reviewed", variant: "default", icon: CheckCircle2 },
  processed: { label: "Processed", variant: "default", icon: CheckCircle2 },
};

function SubmissionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const, icon: AlertCircle };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Field Value Display ───

function FieldValueDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic text-sm">Not provided</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-sm">{value ? "Yes" : "No"}</span>;
  }
  return <span className="text-sm">{String(value)}</span>;
}

// ─── Submission Card ───

function SubmissionCard({ submission }: { submission: FormSubmissionRow }) {
  const [expanded, setExpanded] = useState(false);
  const formDef = submission.form_definitions;
  const steps = formDef?.steps ?? [];

  const submitterName = (() => {
    const data = submission.data;
    const first = data.borrower_first_name ?? data.first_name ?? "";
    const last = data.borrower_last_name ?? data.last_name ?? "";
    if (first || last) return `${first} ${last}`.trim();
    return submission.submitted_by_email ?? "Unknown";
  })();

  const stepsWithData = steps.filter((step) => {
    if (!step.fields?.length) return false;
    return step.fields.some((f) => {
      const val = submission.data[f.id];
      return val !== null && val !== undefined && val !== "";
    });
  });

  return (
    <div className="border rounded-lg bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {formDef?.name ?? "Unknown Form"}
            </p>
            <p className="text-xs text-muted-foreground">
              {submitterName} &middot;{" "}
              {formatDate(submission.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SubmissionStatusBadge status={submission.status} />
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4">
          {stepsWithData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No data submitted yet.</p>
          ) : (
            stepsWithData.map((step) => (
              <div key={step.id} className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {step.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {step.fields
                    .filter((f) => {
                      const val = submission.data[f.id];
                      return val !== null && val !== undefined && val !== "";
                    })
                    .map((field) => (
                      <div key={field.id} className="py-1">
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        <FieldValueDisplay value={submission.data[field.id]} />
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Application Link Card ───

function ApplicationLinkCard({ link }: { link: DealApplicationLinkRow }) {
  const isExpired = new Date(link.expires_at) < new Date();
  const isActive = link.status === "active" && !isExpired;
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/forms/${link.form_definitions?.slug ?? "unknown"}?dt=${link.token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    showSuccess("Link copied to clipboard");
  };

  const contactName = (() => {
    const c = link.crm_contacts;
    if (!c) return null;
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    return name || c.email;
  })();

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-muted/40">
      <div className="flex items-center gap-2 min-w-0">
        <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm truncate">
            {link.form_definitions?.name ?? "Unknown Form"}
            {contactName && (
              <span className="text-muted-foreground"> &middot; {contactName}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {isActive ? "Active" : isExpired ? "Expired" : link.status}
            {" \u00B7 Expires "}
            {formatDateShort(link.expires_at)}
          </p>
        </div>
      </div>
      {isActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs shrink-0"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
          Copy
        </Button>
      )}
    </div>
  );
}

// ─── Send Form Modal ───

function SendFormModal({
  open,
  onOpenChange,
  dealId,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  onSent: () => void;
}) {
  const [forms, setForms] = useState<FormDefinitionOption[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("form_definitions")
      .select("id, name, slug")
      .eq("status", "published")
      .then(({ data }) => {
        if (data) setForms(data);
      });
  }, [open]);

  const handleGenerate = async () => {
    if (!selectedFormId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from("deal_application_links")
        .insert({
          token,
          deal_id: dealId,
          form_id: selectedFormId,
          status: "active",
          expires_at: expiresAt.toISOString(),
        })
        .select("id, token")
        .single();

      if (error) throw error;

      const selectedForm = forms.find((f) => f.id === selectedFormId);
      const url = `${window.location.origin}/forms/${selectedForm?.slug ?? "unknown"}?dt=${data.token}`;
      setGeneratedUrl(url);
      showSuccess("Application link generated");
      onSent();
    } catch (err) {
      showError("Could not generate link", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      showSuccess("Link copied to clipboard");
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setSelectedFormId("");
    setExpiryDays("7");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Form to Borrower</DialogTitle>
          <DialogDescription>
            Generate a pre-filled application link for this deal. The borrower
            can complete the form and their responses will be linked here.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Application Link</Label>
            <div className="flex gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the borrower. It expires in {expiryDays} days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Form</Label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link Expiry</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedUrl ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!selectedFormId || loading}>
              {loading ? "Generating..." : "Generate Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Forms Section (main export) ───

interface FormsSectionProps {
  dealId: string;
}

export function FormsSection({ dealId }: FormsSectionProps) {
  const [submissions, setSubmissions] = useState<FormSubmissionRow[]>([]);
  const [links, setLinks] = useState<DealApplicationLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [subsRes, linksRes] = await Promise.all([
      supabase
        .from("form_submissions")
        .select(`
          id, form_id, status, data, submitted_by_email, created_at, updated_at,
          form_definitions (id, name, slug, steps)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false }),

      supabase
        .from("deal_application_links")
        .select(`
          id, token, deal_id, form_id, contact_id, status, expires_at, created_at,
          form_definitions (name, slug),
          crm_contacts (first_name, last_name, email)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false }),
    ]);

    if (subsRes.data) {
      setSubmissions(subsRes.data as unknown as FormSubmissionRow[]);
    }
    if (linksRes.data) {
      setLinks(linksRes.data as unknown as DealApplicationLinkRow[]);
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hide partial submissions with no user-entered data (auto-created on form open, only contain system _-prefixed fields)
  const visibleSubmissions = submissions.filter(
    (sub) =>
      COMPLETED_STATUSES.has(sub.status) ||
      countUserFields(sub.data) >= 1
  );

  const hasSubmissions = visibleSubmissions.length > 0;
  const hasLinks = links.length > 0;
  const isEmpty = !hasSubmissions && !hasLinks;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Forms & Applications</h3>
          <p className="text-xs text-muted-foreground">
            Borrower submissions and application links for this deal.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setSendModalOpen(true)}
        >
          <Send className="h-3.5 w-3.5" />
          Send Form
        </Button>
      </div>

      {/* Active Links */}
      {hasLinks && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Application Links
          </h4>
          <div className="space-y-1.5">
            {links.map((link) => (
              <ApplicationLinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      )}

      {/* Submissions */}
      {hasSubmissions && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Submissions ({visibleSubmissions.length})
          </h4>
          <div className="space-y-2">
            {visibleSubmissions.map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="border rounded-lg bg-muted/20 py-12 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No forms sent yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            Send a loan application or other form to the borrower. Their
            responses will appear here, linked to this deal.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setSendModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Send First Form
          </Button>
        </div>
      )}

      {/* Send Form Modal */}
      <SendFormModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        dealId={dealId}
        onSent={fetchData}
      />
    </div>
  );
}
