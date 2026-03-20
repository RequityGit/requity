"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Shield,
  Clock,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPABASE_URL } from "@/lib/supabase/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConditionDoc {
  id: string;
  name: string;
  uploaded_at: string;
  staged: boolean;
}

interface ConditionItem {
  id: string;
  condition_name: string;
  borrower_description: string | null;
  category: string | null;
  status: string;
  document_count: number;
  documents: ConditionDoc[];
  staged_count: number;
  borrower_feedback: string | null;
  feedback_updated_at: string | null;
}

interface LinkData {
  valid: boolean;
  reason?: string;
  dealId?: string;
  dealName?: string;
  mode?: "general" | "checklist";
  label?: string | null;
  instructions?: string | null;
  includeGeneralUpload?: boolean;
  remainingUploads?: number | null;
  conditions?: ConditionItem[];
  contactId?: string | null;
  contactName?: string | null;
  dealContacts?: { id: string; name: string; role: string }[];
}

interface UploadedFile {
  name: string;
  conditionId: string | null;
  status: "uploading" | "done" | "error";
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

type ConditionStatusGroup = "action_needed" | "in_progress" | "cleared";

function getStatusGroup(status: string): ConditionStatusGroup {
  switch (status) {
    case "pending":
    case "rejected":
    case "revision_requested":
      return "action_needed";
    case "submitted":
    case "under_review":
      return "in_progress";
    case "approved":
    case "waived":
    case "not_applicable":
      return "cleared";
    default:
      return "action_needed";
  }
}

function getStatusConfig(status: string): {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
} {
  switch (status) {
    case "pending":
      return { label: "Pending", bgClass: "bg-gray-100", textClass: "text-gray-600", dotClass: "bg-gray-400" };
    case "submitted":
      return { label: "Submitted", bgClass: "bg-blue-50", textClass: "text-blue-700", dotClass: "bg-blue-500" };
    case "under_review":
      return { label: "Under Review", bgClass: "bg-amber-50", textClass: "text-amber-700", dotClass: "bg-amber-500" };
    case "approved":
      return { label: "Approved", bgClass: "bg-emerald-50", textClass: "text-emerald-700", dotClass: "bg-emerald-500" };
    case "waived":
      return { label: "Waived", bgClass: "bg-slate-50", textClass: "text-slate-600", dotClass: "bg-slate-400" };
    case "not_applicable":
      return { label: "Not Applicable", bgClass: "bg-slate-50", textClass: "text-slate-500", dotClass: "bg-slate-400" };
    case "rejected":
    case "revision_requested":
      return { label: "Needs Revision", bgClass: "bg-red-50", textClass: "text-red-700", dotClass: "bg-red-500" };
    default:
      return { label: status, bgClass: "bg-gray-100", textClass: "text-gray-600", dotClass: "bg-gray-400" };
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "approved":
    case "waived":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "submitted":
      return <Clock className="h-5 w-5 text-blue-500" />;
    case "under_review":
      return <Eye className="h-5 w-5 text-amber-500" />;
    case "rejected":
    case "revision_requested":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "not_applicable":
      return (
        <div className="flex h-5 w-5 items-center justify-center">
          <div className="h-1.5 w-3 rounded-full bg-slate-300" />
        </div>
      );
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  }
}

function sortConditions(conditions: ConditionItem[]): ConditionItem[] {
  const groupOrder: Record<ConditionStatusGroup, number> = {
    action_needed: 0,
    in_progress: 1,
    cleared: 2,
  };
  return [...conditions].sort((a, b) => {
    const ga = groupOrder[getStatusGroup(a.status)];
    const gb = groupOrder[getStatusGroup(b.status)];
    return ga - gb;
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const REFRESH_INTERVAL_MS = 60_000;

export function SecureUploadClient({ token }: { token: string }) {
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showCleared, setShowCleared] = useState(false);

  const fetchLinkData = useCallback(async () => {
    try {
      const res = await fetch("/api/upload-link/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const text = await res.text();
      let data: LinkData;
      try {
        data = JSON.parse(text) as LinkData;
      } catch {
        if (process.env.NODE_ENV === "development") {
          console.error("[upload-link] Validate response was not JSON:", res.status, text.slice(0, 200));
        }
        setLinkData({ valid: false, reason: "server_error" });
        return;
      }
      setLinkData(data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[upload-link] Validate fetch failed:", err);
      }
      setLinkData({ valid: false, reason: "server_error" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load + polling
  useEffect(() => {
    fetchLinkData();
    const interval = setInterval(fetchLinkData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchLinkData]);

  // Upload files as staged (for checklist conditions) or final (for general)
  const uploadFiles = useCallback(
    async (files: File[], conditionId: string | null, staged: boolean = false) => {
      for (const file of files) {
        const fileEntry: UploadedFile = {
          name: file.name,
          conditionId,
          status: "uploading",
        };
        setUploadedFiles((prev) => [...prev, fileEntry]);

        try {
          const formData = new FormData();
          formData.append("token", token);
          if (conditionId) formData.append("conditionId", conditionId);
          if (staged) formData.append("staged", "true");
          formData.append("files", file);

          const res = await fetch("/api/upload-link/upload", {
            method: "POST",
            body: formData,
          });

          const result = await res.json();

          if (!res.ok || result.error) {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f === fileEntry
                  ? { ...f, status: "error" as const, error: result.error || "Upload failed" }
                  : f
              )
            );
            continue;
          }

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f === fileEntry ? { ...f, status: "done" as const } : f
            )
          );

          // Refresh data after successful upload
          setTimeout(() => fetchLinkData(), 1000);
        } catch {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f === fileEntry
                ? { ...f, status: "error" as const, error: "Network error" }
                : f
            )
          );
        }
      }
    },
    [token, fetchLinkData]
  );

  // Submit staged files for a condition
  const submitCondition = useCallback(
    async (conditionId: string, comment: string) => {
      const res = await fetch("/api/upload-link/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, conditionId, comment: comment || undefined }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Submit failed");
      }
      // Refresh to get updated statuses
      await fetchLinkData();
      return result;
    },
    [token, fetchLinkData]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!linkData?.valid) {
    return <InvalidLinkPage reason={linkData?.reason} />;
  }

  // Calculate progress for checklist mode
  const conditions = linkData.conditions || [];
  const sorted = sortConditions(conditions);
  const clearedStatuses = ["approved", "waived", "not_applicable"];
  const clearedCount = conditions.filter((c) => clearedStatuses.includes(c.status)).length;
  const totalCount = conditions.length;

  const actionNeeded = sorted.filter((c) => getStatusGroup(c.status) === "action_needed");
  const inProgress = sorted.filter((c) => getStatusGroup(c.status) === "in_progress");
  const cleared = sorted.filter((c) => getStatusGroup(c.status) === "cleared");

  return (
    <div className="h-screen min-h-screen overflow-y-auto overflow-x-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 px-4 pt-6 pb-5 text-center">
        <img
          src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2`}
          alt="Requity Group"
          className="mx-auto mb-4 h-10"
        />
        <h1 className="text-xl font-semibold text-white">Document Upload Portal</h1>
        <p className="mt-1 text-sm text-gray-300">{linkData.dealName}</p>
        {linkData.label && (
          <p className="mt-1 text-sm font-medium text-gray-200">{linkData.label}</p>
        )}
      </div>

      {/* Progress bar (checklist mode only) */}
      {linkData.mode === "checklist" && totalCount > 0 && (
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">
                {clearedCount} of {totalCount} conditions cleared
              </span>
              <span className="text-gray-500">
                {totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (clearedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            {actionNeeded.length > 0 && (
              <p className="mt-2 text-xs text-red-600">
                {actionNeeded.length} item{actionNeeded.length === 1 ? "" : "s"} need{actionNeeded.length === 1 ? "s" : ""} your attention
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:py-8 sm:pb-28">
        {/* Instructions */}
        {linkData.instructions && (
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-800">{linkData.instructions}</p>
          </div>
        )}

        {/* Remaining uploads notice */}
        {linkData.remainingUploads !== null && linkData.remainingUploads !== undefined && (
          <div className="mb-6 text-center text-xs text-gray-500">
            {linkData.remainingUploads} upload{linkData.remainingUploads === 1 ? "" : "s"} remaining
          </div>
        )}

        {/* Mode: Checklist */}
        {linkData.mode === "checklist" && conditions.length > 0 && (
          <div className="space-y-6">
            {/* Action Needed section */}
            {actionNeeded.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Action Needed
                </h3>
                <div className="space-y-3">
                  {actionNeeded.map((condition) => (
                    <ConditionUploadCard
                      key={condition.id}
                      token={token}
                      condition={condition}
                      onUpload={(files) => uploadFiles(files, condition.id, true)}
                      onSubmit={submitCondition}
                      onRefresh={fetchLinkData}
                      uploadingFiles={uploadedFiles.filter(
                        (f) => f.conditionId === condition.id && f.status === "uploading"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress section */}
            {inProgress.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
                  <Clock className="h-3.5 w-3.5" />
                  In Review
                </h3>
                <div className="space-y-3">
                  {inProgress.map((condition) => (
                    <ConditionUploadCard
                      key={condition.id}
                      token={token}
                      condition={condition}
                      onUpload={(files) => uploadFiles(files, condition.id, true)}
                      onSubmit={submitCondition}
                      onRefresh={fetchLinkData}
                      uploadingFiles={uploadedFiles.filter(
                        (f) => f.conditionId === condition.id && f.status === "uploading"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cleared section (collapsible) */}
            {cleared.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCleared(!showCleared)}
                  className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 hover:text-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cleared ({cleared.length})
                  {showCleared ? <ChevronUp className="ml-auto h-3.5 w-3.5" /> : <ChevronDown className="ml-auto h-3.5 w-3.5" />}
                </button>
                {showCleared && (
                  <div className="space-y-3">
                    {cleared.map((condition) => (
                      <ConditionUploadCard
                        key={condition.id}
                        token={token}
                        condition={condition}
                        onUpload={(files) => uploadFiles(files, condition.id, true)}
                        onSubmit={submitCondition}
                        onRefresh={fetchLinkData}
                        uploadingFiles={[]}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* General upload zone */}
        {(linkData.mode === "general" || linkData.includeGeneralUpload) && (
          <div className={linkData.mode === "checklist" ? "mt-6" : ""}>
            {linkData.mode === "checklist" && (
              <h3 className="mb-2 text-sm font-medium text-black">Other Documents</h3>
            )}
            <GeneralUploadZone
              onUpload={(files) => uploadFiles(files, null, false)}
              uploadedFiles={uploadedFiles.filter((f) => !f.conditionId)}
            />
          </div>
        )}

        {/* Messaging section */}
        {linkData.dealId && (
          <BorrowerMessaging token={token} dealId={linkData.dealId} contactName={linkData.contactName ?? undefined} dealContacts={linkData.dealContacts ?? []} />
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Shield className="h-3 w-3" />
          <span>Secured by Requity Group</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Borrower Messaging                                                  */
/* ------------------------------------------------------------------ */

interface BorrowerMessage {
  id: string;
  sender_type: "admin" | "borrower" | "system";
  body: string;
  sender_name: string;
  created_at: string;
  source: string;
}

function BorrowerMessaging({ token, dealId, contactName, dealContacts }: { token: string; dealId: string; contactName?: string; dealContacts: { id: string; name: string; role: string }[] }) {
  const [messages, setMessages] = useState<BorrowerMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [unreadHint, setUnreadHint] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Identity picker: if link has a contact_id, auto-select that borrower.
  // Otherwise, show all deal contacts as clickable chips for the borrower to identify themselves.
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(contactName ?? null);
  const showIdentityPicker = dealContacts.length > 1 && !contactName;

  const fetchMessages = useCallback(async () => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(
        `/api/deal-messages/${dealId}?token=${encodeURIComponent(token)}&limit=50&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return; // guard against HTML redirect responses
      const data = await res.json();
      const fetched = data.messages as BorrowerMessage[];
      // Merge: keep any optimistic messages not yet in server response
      setMessages((prev) => {
        const serverIds = new Set(fetched.map((m) => m.id));
        const optimistic = prev.filter((m) => !serverIds.has(m.id));
        return [...fetched, ...optimistic];
      });
      if (fetched.length > 0 && !expanded) {
        setUnreadHint(true);
      }
    } catch {
      // Silently fail - messaging is supplemental
    } finally {
      setLoadingMsgs(false);
    }
  }, [dealId, token, expanded]);

  // Initial fetch + polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on expand or new messages
  useEffect(() => {
    if (expanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [expanded, messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    setSendError(null);
    setSending(true);
    try {
      const res = await fetch("/api/deal-messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, body: text, token, contactId: selectedContactId || undefined }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const created = (data as { message?: { id: string; created_at: string } }).message;
        if (created) {
          setMessages((prev) => [
            ...prev,
            {
              id: created.id,
              deal_id: dealId,
              sender_type: "borrower",
              sender_id: null,
              contact_id: selectedContactId,
              source: "portal",
              body: text,
              metadata: null,
              created_at: created.created_at,
              sender_name: "You",
            } as BorrowerMessage,
          ]);
        }
        // Small delay before refetch to let DB settle, prevents
        // optimistic message from being wiped by a stale query result
        setTimeout(() => fetchMessages(), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError((data.error as string) || "Message could not be sent. Please try again.");
        setDraft(text);
      }
    } catch {
      setSendError("Message could not be sent. Please check your connection and try again.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => { setExpanded(!expanded); setUnreadHint(false); }}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Messages</span>
          {(selectedName || contactName) && (
            <span className="text-xs text-gray-400">as {selectedName || contactName}</span>
          )}
          {unreadHint && (
            <span className="flex h-2 w-2 rounded-full bg-blue-500" />
          )}
          {messages.length > 0 && (
            <span className="text-xs text-gray-400">{messages.length}</span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-4 py-2 bg-gray-50 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
            <span>
              This is a secure messaging channel for your loan with Requity Group.
              Please do not share passwords, full Social Security numbers, or bank
              login credentials here. Use the upload area above for sensitive documents.
            </span>
          </div>

          {/* Messages list */}
          <div className="max-h-[400px] overflow-y-auto px-4 py-3">
            {loadingMsgs && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Send a message to your loan team
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isBorrower = msg.sender_type === "borrower";
                  const isSystem = msg.sender_type === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1 rounded-full">
                          {msg.body}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isBorrower ? "justify-end" : "justify-start")}
                    >
                      <div className={cn("max-w-[80%] space-y-0.5", isBorrower ? "items-end" : "items-start")}>
                        <div className={cn("flex items-center gap-1.5", isBorrower ? "flex-row-reverse" : "")}>
                          <span className="text-xs font-medium text-gray-700">{msg.sender_name}</span>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            isBorrower
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Identity picker - shown when multiple borrowers and no pre-set contact */}
          {showIdentityPicker && !selectedContactId && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Who are you?</p>
              <div className="flex flex-wrap gap-2">
                {dealContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedContactId(c.id); setSelectedName(c.name); }}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compose - only shown when identity is known */}
          {(selectedContactId || contactName || dealContacts.length <= 1) && (
          <div className="border-t border-gray-100 p-3">
            {/* Show selected identity with ability to change */}
            {showIdentityPicker && selectedContactId && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Messaging as</span>
                <span className="text-xs font-medium text-gray-700">{selectedName}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedContactId(null); setSelectedName(null); }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline underline-offset-2"
                >
                  Switch
                </button>
              </div>
            )}
            {sendError && (
              <p className="mb-2 text-xs text-red-600" role="alert">{sendError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSendError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  draft.trim() && !sending
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-300"
                )}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">Press Enter to send</p>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Invalid link page                                                  */
/* ------------------------------------------------------------------ */

function InvalidLinkPage({ reason }: { reason?: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    expired: { title: "This link has expired", description: "Please contact your loan officer to request a new upload link." },
    revoked: { title: "This link is no longer active", description: "Please contact your loan officer to request a new upload link." },
    max_uploads_reached: { title: "Upload limit reached", description: "The maximum number of files have been uploaded through this link." },
    not_found: { title: "Link not found", description: "This upload link doesn't exist. Please check the URL or contact your loan officer." },
    server_error: { title: "Something went wrong", description: "Please try again later or contact your loan officer." },
  };
  const msg = messages[reason || "not_found"] || messages.not_found;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm text-center">
        <img
          src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20Color.svg`}
          alt="Requity Group"
          className="mx-auto mb-6 h-10"
        />
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-gray-300" />
        <h1 className="text-lg font-semibold text-gray-900">{msg.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{msg.description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Condition upload card (with staged upload + submit flow)           */
/* ------------------------------------------------------------------ */

function ConditionUploadCard({
  token,
  condition,
  onUpload,
  onSubmit,
  onRefresh,
  uploadingFiles,
  compact,
}: {
  token: string;
  condition: ConditionItem;
  onUpload: (files: File[]) => void;
  onSubmit: (conditionId: string, comment: string) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  uploadingFiles: UploadedFile[];
  compact?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [removingDocId, setRemovingDocId] = useState<string | null>(null);

  const isUploading = uploadingFiles.length > 0;
  const statusConfig = getStatusConfig(condition.status);
  const isCleared = getStatusGroup(condition.status) === "cleared";
  const needsRevision = condition.status === "rejected" || condition.status === "revision_requested";

  // Separate staged vs final docs
  const stagedDocs = condition.documents.filter((d) => d.staged);
  const finalDocs = condition.documents.filter((d) => !d.staged);
  const hasStagedFiles = stagedDocs.length > 0;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onUpload(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(condition.id, comment);
      setComment("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveStaged(docId: string) {
    setRemovingDocId(docId);
    try {
      // Delete the staged document via a simple fetch
      await fetch("/api/upload-link/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, documentId: docId }),
      });
      await onRefresh();
    } finally {
      setRemovingDocId(null);
    }
  }

  // Compact card for cleared items
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white/60 px-4 py-2.5">
        {getStatusIcon(condition.status)}
        <span className="flex-1 text-sm text-gray-500">{condition.condition_name}</span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", statusConfig.bgClass, statusConfig.textClass)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dotClass)} />
          {statusConfig.label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-white", needsRevision ? "border-red-200" : hasStagedFiles ? "border-amber-300" : "border-gray-200")}>
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon(condition.status)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-black">{condition.condition_name}</p>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", statusConfig.bgClass, statusConfig.textClass)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dotClass)} />
              {statusConfig.label}
            </span>
          </div>
          {condition.borrower_description && (
            <p className="mt-0.5 text-xs text-gray-500">{condition.borrower_description}</p>
          )}
        </div>
      </div>

      {/* Borrower feedback (revision needed) */}
      {needsRevision && condition.borrower_feedback && (
        <div className="mx-4 mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Revision Requested</p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-700">{condition.borrower_feedback}</p>
              {condition.feedback_updated_at && (
                <p className="mt-1 text-[10px] text-red-400">{formatRelativeDate(condition.feedback_updated_at)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Previously submitted documents (final) */}
      {finalDocs.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          {finalDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 py-1 text-xs text-gray-500">
              <FileText className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate">{doc.name}</span>
              <span className="shrink-0 text-[10px] text-gray-400">{formatRelativeDate(doc.uploaded_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Staged documents (ready to submit) */}
      {stagedDocs.length > 0 && (
        <div className={cn("border-t px-4 py-2", hasStagedFiles ? "border-amber-200 bg-amber-50/50" : "border-gray-100")}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
            Ready to submit ({stagedDocs.length} file{stagedDocs.length === 1 ? "" : "s"})
          </p>
          {stagedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 py-1 text-xs text-amber-700">
              <FileText className="h-3 w-3 shrink-0 text-amber-500" />
              <span className="min-w-0 flex-1 truncate">{doc.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveStaged(doc.id)}
                disabled={removingDocId === doc.id}
                className="shrink-0 text-amber-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                {removingDocId === doc.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}

          {/* Comment field */}
          <div className="mt-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note (optional) e.g. 'Jan, Feb, Mar statements attached'"
              className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-xs text-black placeholder:text-gray-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
              rows={2}
            />
          </div>

          {/* Submit button */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit for Review
            </button>
            {submitError && (
              <p className="text-xs text-red-600">{submitError}</p>
            )}
          </div>
        </div>
      )}

      {/* Uploading indicators */}
      {uploadingFiles.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          {uploadingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 py-1 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="truncate">Uploading {f.name}...</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone - always show for action_needed and in_progress with staged files */}
      {!isCleared && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            disabled={isUploading}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 border-t border-dashed px-4 py-2.5 text-xs transition-colors",
              needsRevision
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : hasStagedFiles
                  ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              dragOver && "bg-blue-50 text-blue-600",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>
              {isUploading
                ? "Uploading..."
                : hasStagedFiles
                  ? "Add more files"
                  : needsRevision
                    ? "Upload revised document"
                    : "Drop files or click to upload"}
            </span>
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  General upload zone                                                */
/* ------------------------------------------------------------------ */

function GeneralUploadZone({
  onUpload,
  uploadedFiles,
}: {
  onUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const isUploading = uploadedFiles.some((f) => f.status === "uploading");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onUpload(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip" className="hidden" onChange={handleFileSelect} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        disabled={isUploading}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-t-lg px-6 py-10 text-center transition-colors",
          dragOver ? "bg-blue-50" : "hover:bg-gray-50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", dragOver ? "bg-blue-100" : "bg-gray-100")}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          ) : (
            <Upload className={cn("h-6 w-6", dragOver ? "text-blue-500" : "text-gray-700")} />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{isUploading ? "Uploading..." : "Drop files here or click to browse"}</p>
          <p className="mt-1 text-xs text-gray-700">PDF, Word, Excel, images, or ZIP up to 50 MB</p>
        </div>
      </button>
      {uploadedFiles.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
              {file.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
              {file.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
              {file.status === "error" && <X className="h-3 w-3 text-red-500" />}
              <span className={cn("truncate", file.status === "done" && "text-gray-700", file.status === "uploading" && "text-gray-400", file.status === "error" && "text-red-600")}>
                {file.name}
              </span>
              {file.error && <span className="ml-auto text-red-500">{file.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
