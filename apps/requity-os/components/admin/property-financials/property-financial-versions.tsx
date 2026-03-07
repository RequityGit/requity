"use client";

import { useState } from "react";
import { Check, Trash2, Loader2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

const T = {
  bg: {
    surface: "#111113",
    elevated: "#18181b",
    hover: "#1e1e22",
    border: "#27272a",
    borderSubtle: "#1e1e22",
  },
  text: {
    primary: "#fafafa",
    secondary: "#a1a1aa",
    muted: "#71717a",
  },
  accent: {
    blue: "#3b82f6",
    green: "#22c55e",
    greenMuted: "rgba(34,197,94,0.12)",
    red: "#ef4444",
    redMuted: "rgba(239,68,68,0.12)",
  },
} as const;

export interface RentRollVersion {
  id: string;
  as_of_date: string;
  source_label: string | null;
  file_name: string | null;
  is_current: boolean;
  created_at: string;
  unit_count?: number;
}

export interface T12Version {
  id: string;
  period_start: string;
  period_end: string;
  source_label: string | null;
  file_name: string | null;
  is_current: boolean;
  created_at: string;
  line_item_count?: number;
}

interface Props {
  rentRolls: RentRollVersion[];
  t12s: T12Version[];
  onSetCurrentRR: (id: string) => Promise<{ error: string | null }>;
  onSetCurrentT12: (id: string) => Promise<{ error: string | null }>;
  onDeleteRR: (id: string) => Promise<{ error: string | null }>;
  onDeleteT12: (id: string) => Promise<{ error: string | null }>;
  onUploadRR: () => void;
  onUploadT12: () => void;
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PropertyFinancialVersions({
  rentRolls,
  t12s,
  onSetCurrentRR,
  onSetCurrentT12,
  onDeleteRR,
  onDeleteT12,
  onUploadRR,
  onUploadT12,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "rr" | "t12";
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSetCurrent = async (id: string, type: "rr" | "t12") => {
    setActivatingId(id);
    const result =
      type === "rr" ? await onSetCurrentRR(id) : await onSetCurrentT12(id);
    if (result.error) {
      toast({
        title: "Failed to set as current",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: type === "rr" ? "Rent roll updated" : "T12 updated" });
      router.refresh();
    }
    setActivatingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result =
      deleteTarget.type === "rr"
        ? await onDeleteRR(deleteTarget.id)
        : await onDeleteT12(deleteTarget.id);
    if (result.error) {
      toast({
        title: "Failed to delete",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: `${deleteTarget.label} deleted` });
      router.refresh();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Rent Roll Versions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: T.text.muted }}
          >
            Rent Roll History
          </div>
          <button
            onClick={onUploadRR}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border-0"
            style={{
              backgroundColor: T.bg.elevated,
              color: T.text.secondary,
              border: `1px solid ${T.bg.border}`,
            }}
          >
            <Upload size={10} />
            Upload
          </button>
        </div>
        {rentRolls.length === 0 ? (
          <div
            className="text-[13px] py-3"
            style={{ color: T.text.muted }}
          >
            No rent rolls uploaded yet.
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${T.bg.borderSubtle}` }}
          >
            {rentRolls.map((rr) => (
              <div
                key={rr.id}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  borderBottom: `1px solid ${T.bg.borderSubtle}`,
                  backgroundColor: rr.is_current
                    ? T.bg.hover
                    : "transparent",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-medium num"
                      style={{ color: T.text.primary }}
                    >
                      As of {formatDate(rr.as_of_date)}
                    </span>
                    {rr.is_current && (
                      <span
                        className="rounded px-1.5 py-px text-[10px] font-medium"
                        style={{
                          backgroundColor: T.accent.greenMuted,
                          color: T.accent.green,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: T.text.muted }}
                  >
                    {rr.file_name || "Manual entry"}
                    {rr.unit_count != null && ` · ${rr.unit_count} units`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {rr.is_current ? (
                    <Check
                      size={14}
                      strokeWidth={2}
                      style={{ color: T.accent.blue }}
                    />
                  ) : (
                    <button
                      onClick={() => handleSetCurrent(rr.id, "rr")}
                      disabled={activatingId === rr.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer border-0 disabled:opacity-50"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.12)",
                        color: T.accent.blue,
                      }}
                    >
                      {activatingId === rr.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : null}
                      Set Current
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        id: rr.id,
                        type: "rr",
                        label: `Rent Roll (${formatDate(rr.as_of_date)})`,
                      })
                    }
                    className="rounded-md p-1 cursor-pointer border-0 transition-colors"
                    style={{
                      color: T.text.muted,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* T12 Versions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: T.text.muted }}
          >
            T12 History
          </div>
          <button
            onClick={onUploadT12}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border-0"
            style={{
              backgroundColor: T.bg.elevated,
              color: T.text.secondary,
              border: `1px solid ${T.bg.border}`,
            }}
          >
            <Upload size={10} />
            Upload
          </button>
        </div>
        {t12s.length === 0 ? (
          <div
            className="text-[13px] py-3"
            style={{ color: T.text.muted }}
          >
            No T12 statements uploaded yet.
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${T.bg.borderSubtle}` }}
          >
            {t12s.map((t12) => (
              <div
                key={t12.id}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  borderBottom: `1px solid ${T.bg.borderSubtle}`,
                  backgroundColor: t12.is_current
                    ? T.bg.hover
                    : "transparent",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-medium num"
                      style={{ color: T.text.primary }}
                    >
                      {formatDate(t12.period_start)} &ndash;{" "}
                      {formatDate(t12.period_end)}
                    </span>
                    {t12.is_current && (
                      <span
                        className="rounded px-1.5 py-px text-[10px] font-medium"
                        style={{
                          backgroundColor: T.accent.greenMuted,
                          color: T.accent.green,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: T.text.muted }}
                  >
                    {t12.file_name || "Manual entry"}
                    {t12.line_item_count != null &&
                      ` · ${t12.line_item_count} line items`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {t12.is_current ? (
                    <Check
                      size={14}
                      strokeWidth={2}
                      style={{ color: T.accent.blue }}
                    />
                  ) : (
                    <button
                      onClick={() => handleSetCurrent(t12.id, "t12")}
                      disabled={activatingId === t12.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer border-0 disabled:opacity-50"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.12)",
                        color: T.accent.blue,
                      }}
                    >
                      {activatingId === t12.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : null}
                      Set Current
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        id: t12.id,
                        type: "t12",
                        label: `T12 (${formatDate(t12.period_start)} – ${formatDate(t12.period_end)})`,
                      })
                    }
                    className="rounded-md p-1 cursor-pointer border-0 transition-colors"
                    style={{
                      color: T.text.muted,
                      backgroundColor: "transparent",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this upload and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
