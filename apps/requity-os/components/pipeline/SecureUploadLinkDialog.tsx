"use client";

import { useState, useEffect, useTransition } from "react";
import { formatDate } from "@/lib/format";
import {
  Link2,
  Copy,
  Check,
  Loader2,
  LinkIcon,
  X,
  Clock,
  ExternalLink,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import type { DealCondition } from "@/components/pipeline/pipeline-types";
import {
  createSecureUploadLink,
  revokeSecureUploadLink,
  listSecureUploadLinks,
  fetchDealContacts,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { EmptyState } from "@/components/shared/EmptyState";

/** Draft body for "Send by email" when sharing a secure upload link. */
function buildUploadLinkEmailBody(
  dealName: string,
  uploadUrl: string,
  expiresAt: string | null
): string {
  const expiryLine =
    expiresAt &&
    `This link expires on ${formatDate(expiresAt)}.`;
  return [
    "Hello,",
    "",
    `Please use the secure link below to upload your documents for ${dealName}.`,
    "",
    uploadUrl,
    "",
    ...(expiryLine ? [expiryLine, ""] : []),
    "If you have any questions, please reply to this email.",
    "",
    "Best regards",
  ]
    .filter(Boolean)
    .join("\n");
}

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

interface SecureUploadLinkDialogProps {
  dealId: string;
  conditions: DealCondition[];
  trigger: React.ReactNode;
  dealName?: string;
  currentUserId?: string;
  currentUserName?: string;
}

interface UploadLink {
  id: string;
  token: string;
  mode: string;
  label: string | null;
  status: string;
  expires_at: string;
  upload_count: number;
  max_uploads: number | null;
  created_at: string;
}

export function SecureUploadLinkDialog({
  dealId,
  conditions,
  trigger,
  dealName,
  currentUserId,
  currentUserName,
}: SecureUploadLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"create" | "manage">("manage");
  const [links, setLinks] = useState<UploadLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Create form state
  const [mode, setMode] = useState<"general" | "checklist">("general");
  const [label, setLabel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [maxUploads, setMaxUploads] = useState("");
  const [selectedConditionIds, setSelectedConditionIds] = useState<Set<string>>(
    new Set()
  );
  const [includeGeneralUpload, setIncludeGeneralUpload] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [creating, startCreating] = useTransition();
  const [revoking, startRevoking] = useTransition();

  // Deal contacts for "Send to" picker
  const [dealContacts, setDealContacts] = useState<
    { contactId: string; name: string; email: string | null; role: string }[]
  >([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  const outstandingConditions = conditions.filter(
    (c) =>
      ["pending", "submitted", "under_review"].includes(c.status) &&
      c.is_borrower_facing !== false
  );

  useEffect(() => {
    if (open) {
      loadLinks();
      loadContacts();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadContacts() {
    const result = await fetchDealContacts(dealId);
    if (!result.error && result.dealContacts) {
      const mapped = (result.dealContacts as { contact_id: string; role: string; contact?: { id: string; first_name: string | null; last_name: string | null; email: string | null } }[]).map((dc) => ({
        contactId: dc.contact_id,
        name: [dc.contact?.first_name, dc.contact?.last_name].filter(Boolean).join(" ") || "Unknown",
        email: dc.contact?.email ?? null,
        role: dc.role,
      }));
      setDealContacts(mapped);
      // Auto-select primary contact
      const primary = mapped.find((c) => c.role === "primary");
      if (primary) setSelectedContactId(primary.contactId);
    }
  }

  useEffect(() => {
    if (mode === "checklist") {
      setSelectedConditionIds(new Set(outstandingConditions.map((c) => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadLinks() {
    setLoadingLinks(true);
    const result = await listSecureUploadLinks(dealId);
    if (!result.error) setLinks(result.links);
    setLoadingLinks(false);
  }

  function resetForm() {
    setMode("general");
    setLabel("");
    setInstructions("");
    setExpiresInDays("7");
    setMaxUploads("");
    setSelectedConditionIds(new Set());
    setIncludeGeneralUpload(true);
    setGeneratedUrl(null);
    setGeneratedExpiresAt(null);
    setCopied(false);
    // Re-select primary contact
    const primary = dealContacts.find((c) => c.role === "primary");
    if (primary) setSelectedContactId(primary.contactId);
  }

  function handleCreate() {
    startCreating(async () => {
      const result = await createSecureUploadLink(dealId, {
        mode,
        label: label || undefined,
        instructions: instructions || undefined,
        expiresInDays: parseInt(expiresInDays),
        maxUploads: maxUploads ? parseInt(maxUploads) : undefined,
        conditionIds:
          mode === "checklist"
            ? Array.from(selectedConditionIds)
            : undefined,
        includeGeneralUpload,
        contactId: selectedContactId || undefined,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      });

      if (result.error) {
        showError("Could not create upload link", result.error);
      } else if (result.url) {
        setGeneratedUrl(result.url);
        setGeneratedExpiresAt(result.expiresAt ?? null);
        showSuccess("Upload link created");
        loadLinks();
      }
    });
  }

  function handleCopy() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    showSuccess("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(linkId: string) {
    startRevoking(async () => {
      const result = await revokeSecureUploadLink(linkId);
      if (result.error) {
        showError("Could not revoke upload link", result.error);
      } else {
        showSuccess("Upload link revoked");
        loadLinks();
      }
    });
  }

  function toggleCondition(id: string) {
    setSelectedConditionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const conditionsByCategory = outstandingConditions.reduce(
    (acc, c) => {
      const cat = c.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    },
    {} as Record<string, DealCondition[]>
  );

  const activeLinks = links.filter(
    (l) => l.status === "active" && new Date(l.expires_at) > new Date()
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            Upload Links
          </DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => {
              setView("manage");
              setGeneratedUrl(null);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "manage"
                ? "bg-foreground/5 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active Links
            {activeLinks.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/10 text-[10px]">
                {activeLinks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setView("create")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "create"
                ? "bg-foreground/5 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create New
          </button>
        </div>

        {/* ─── Manage view ─── */}
        {view === "manage" && (
          <div className="space-y-2">
            {loadingLinks && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingLinks && activeLinks.length === 0 && (
              <EmptyState
                icon={LinkIcon}
                title="No active upload links"
                action={{
                  label: "Create one",
                  onClick: () => setView("create"),
                }}
                compact
              />
            )}
            {activeLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onRevoke={() => handleRevoke(link.id)}
                revoking={revoking}
              />
            ))}
          </div>
        )}

        {/* ─── Create view ─── */}
        {view === "create" && (
          <div className="space-y-4">
            {generatedUrl ? (
              /* Success state */
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
                  <p className="mb-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Upload link created
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={generatedUrl}
                      className="text-xs bg-white dark:bg-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentUserId && currentUserName && (
                    <button
                      type="button"
                      onClick={() => setEmailSheetOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Send by email
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    Create another link
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                {/* Send to (borrower contact) — placed first so filtering works before mode selection */}
                {dealContacts.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Send to
                    </Label>
                    <Select
                      value={selectedContactId}
                      onValueChange={setSelectedContactId}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select borrower contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealContacts.map((c) => (
                          <SelectItem key={c.contactId} value={c.contactId}>
                            <span>{c.name}</span>
                            {c.role === "primary" && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">(Primary)</span>
                            )}
                            {c.email && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">{c.email}</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Pre-selects this borrower for message attribution. All borrowers see the full condition list.
                    </p>
                  </div>
                )}

                {/* Mode selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Link Type</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("general")}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                        mode === "general"
                          ? "border-foreground/20 bg-foreground/5 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      General Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("checklist")}
                      disabled={outstandingConditions.length === 0}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                        mode === "checklist"
                          ? "border-foreground/20 bg-foreground/5 text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                        outstandingConditions.length === 0 &&
                          "cursor-not-allowed opacity-50"
                      )}
                    >
                      Document Checklist
                    </button>
                  </div>
                </div>

                {/* Checklist condition picker */}
                {mode === "checklist" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        Conditions to include ({selectedConditionIds.size}/
                        {outstandingConditions.length})
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            selectedConditionIds.size ===
                            outstandingConditions.length
                          ) {
                            setSelectedConditionIds(new Set());
                          } else {
                            setSelectedConditionIds(
                              new Set(outstandingConditions.map((c) => c.id))
                            );
                          }
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {selectedConditionIds.size ===
                        outstandingConditions.length
                          ? "Deselect all"
                          : "Select all"}
                      </button>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                      {Object.entries(conditionsByCategory).map(
                        ([category, conds]) => (
                          <div key={category}>
                            <p className="mb-1 rq-micro-label">
                              {CATEGORY_LABELS[category] ??
                                category.replace(/_/g, " ")}
                            </p>
                            {conds.map((c) => (
                              <label
                                key={c.id}
                                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={selectedConditionIds.has(c.id)}
                                  onCheckedChange={() => toggleCondition(c.id)}
                                />
                                <span className="text-xs">
                                  {c.condition_name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={includeGeneralUpload}
                        onCheckedChange={setIncludeGeneralUpload}
                      />
                      <Label className="text-xs text-muted-foreground">
                        Include general upload section
                      </Label>
                    </div>
                  </div>
                )}

                {/* Label */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Tax Returns & Bank Statements"
                    className="text-xs"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Instructions for borrower (optional)
                  </Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Please upload your last 2 years of tax returns..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {/* Expiry & max uploads */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expires in</Label>
                    <Select
                      value={expiresInDays}
                      onValueChange={setExpiresInDays}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max files (optional)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={maxUploads}
                      onChange={(e) => setMaxUploads(e.target.value)}
                      placeholder="Unlimited"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Create button */}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    (mode === "checklist" && selectedConditionIds.size === 0)
                  }
                  className="w-full rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Generate Upload Link"
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
      {currentUserId && currentUserName && (
        <EmailComposeSheet
          open={emailSheetOpen}
          onOpenChange={setEmailSheetOpen}
          toEmail=""
          toName=""
          containerClassName="z-[100]"
          initialSubject={`Document upload link for ${dealName ?? "your deal"}`}
          initialBody={
            generatedUrl
              ? buildUploadLinkEmailBody(
                  dealName ?? "your deal",
                  generatedUrl,
                  generatedExpiresAt
                )
              : ""
          }
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onSendSuccess={() => {
            setEmailSheetOpen(false);
            showSuccess("Email sent");
          }}
        />
      )}
    </Dialog>
  );
}

function LinkCard({
  link,
  onRevoke,
  revoking,
}: {
  link: UploadLink;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://app.requitygroup.com";
  const url = `${appUrl}/upload/${link.token}`;

  const expiresDate = new Date(link.expires_at);
  const daysLeft = Math.max(
    0,
    Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showSuccess("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <LinkIcon className="h-3 w-3 text-muted-foreground" />
            <span className="truncate text-xs font-medium">
              {link.label || (link.mode === "checklist" ? "Document Checklist" : "General Upload")}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {daysLeft}d left
            </span>
            <span>
              {link.upload_count} upload{link.upload_count === 1 ? "" : "s"}
              {link.max_uploads ? ` / ${link.max_uploads}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Open link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onRevoke}
            disabled={revoking}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Revoke link"
          >
            {revoking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
