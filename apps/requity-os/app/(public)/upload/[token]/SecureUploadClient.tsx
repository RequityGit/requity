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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPABASE_URL } from "@/lib/supabase/constants";

interface ConditionItem {
  id: string;
  condition_name: string;
  borrower_description: string | null;
  category: string | null;
  status: string;
  document_count: number;
}

interface LinkData {
  valid: boolean;
  reason?: string;
  dealName?: string;
  mode?: "general" | "checklist";
  label?: string | null;
  instructions?: string | null;
  includeGeneralUpload?: boolean;
  remainingUploads?: number | null;
  conditions?: ConditionItem[];
}

interface UploadedFile {
  name: string;
  conditionId: string | null;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function SecureUploadClient({ token }: { token: string }) {
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [conditionUploads, setConditionUploads] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    async function validate() {
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
        if (process.env.NODE_ENV === "development" && !data.valid && data.reason === "server_error") {
          console.error("[upload-link] API returned server_error. Check server logs for upload-link/validate error.");
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
    }
    validate();
  }, [token]);

  const uploadFiles = useCallback(
    async (files: File[], conditionId: string | null) => {
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
            prev.map((f) => (f === fileEntry ? { ...f, status: "done" as const } : f))
          );

          if (conditionId) {
            setConditionUploads((prev) => ({
              ...prev,
              [conditionId]: [...(prev[conditionId] || []), file.name],
            }));
          }
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
    [token]
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

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50">
      {/* Header with dark bar so white logo is visible */}
      <div className="bg-gray-900 px-4 pt-6 pb-8 text-center">
        <img
          src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2`}
          alt="Requity Group"
          className="mx-auto mb-4 h-10"
        />
        <h1 className="text-xl font-semibold text-white">
          Secure Document Upload
        </h1>
        <p className="mt-1 text-sm text-gray-300">{linkData.dealName}</p>
        {linkData.label && (
          <p className="mt-1 text-sm font-medium text-gray-200">
            {linkData.label}
          </p>
        )}
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:py-8 sm:pb-28">

        {/* Instructions */}
        {linkData.instructions && (
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-800">{linkData.instructions}</p>
          </div>
        )}

        {/* Remaining uploads notice */}
        {linkData.remainingUploads !== null &&
          linkData.remainingUploads !== undefined && (
            <div className="mb-6 text-center text-xs text-gray-500">
              {linkData.remainingUploads} upload
              {linkData.remainingUploads === 1 ? "" : "s"} remaining
            </div>
          )}

        {/* Mode: Checklist */}
        {linkData.mode === "checklist" &&
          linkData.conditions &&
          linkData.conditions.length > 0 && (
            <div className="space-y-3">
              {linkData.conditions.map((condition) => (
                <ConditionUploadCard
                  key={condition.id}
                  condition={condition}
                  uploadedNames={conditionUploads[condition.id] || []}
                  onUpload={(files) => uploadFiles(files, condition.id)}
                  uploadingFiles={uploadedFiles.filter(
                    (f) =>
                      f.conditionId === condition.id &&
                      f.status === "uploading"
                  )}
                />
              ))}
            </div>
          )}

        {/* General upload zone */}
        {(linkData.mode === "general" || linkData.includeGeneralUpload) && (
          <div className={linkData.mode === "checklist" ? "mt-6" : ""}>
            {linkData.mode === "checklist" && (
              <h3 className="mb-2 text-sm font-medium text-black">
                Other Documents
              </h3>
            )}
            <GeneralUploadZone
              onUpload={(files) => uploadFiles(files, null)}
              uploadedFiles={uploadedFiles.filter((f) => !f.conditionId)}
            />
          </div>
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

function InvalidLinkPage({ reason }: { reason?: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    expired: {
      title: "This link has expired",
      description:
        "Please contact your loan officer to request a new upload link.",
    },
    revoked: {
      title: "This link is no longer active",
      description:
        "Please contact your loan officer to request a new upload link.",
    },
    max_uploads_reached: {
      title: "Upload limit reached",
      description:
        "The maximum number of files have been uploaded through this link.",
    },
    not_found: {
      title: "Link not found",
      description:
        "This upload link doesn't exist. Please check the URL or contact your loan officer.",
    },
    server_error: {
      title: "Something went wrong",
      description: "Please try again later or contact your loan officer.",
    },
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

function ConditionUploadCard({
  condition,
  uploadedNames,
  onUpload,
  uploadingFiles,
}: {
  condition: ConditionItem;
  uploadedNames: string[];
  onUpload: (files: File[]) => void;
  uploadingFiles: UploadedFile[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasUploads = condition.document_count > 0 || uploadedNames.length > 0;
  const isUploading = uploadingFiles.length > 0;

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
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 flex-shrink-0">
          {hasUploads ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black">
            {condition.condition_name}
          </p>
          {condition.borrower_description && (
            <p className="mt-0.5 text-xs text-gray-800">
              {condition.borrower_description}
            </p>
          )}

          {/* Uploaded file names */}
          {uploadedNames.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploadedNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-emerald-600"
                >
                  <FileText className="h-3 w-3" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Uploading indicators */}
          {uploadingFiles.map((f, i) => (
            <div
              key={i}
              className="mt-1 flex items-center gap-1.5 text-xs text-gray-400"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="truncate">Uploading {f.name}...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload zone */}
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
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        disabled={isUploading}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 border-t border-dashed border-gray-200 px-4 py-2.5 text-xs transition-colors",
          dragOver
            ? "bg-blue-50 text-blue-600"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        <span>{isUploading ? "Uploading..." : "Drop files or click to upload"}</span>
      </button>
    </div>
  );
}

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
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        disabled={isUploading}
        className={cn(
          "flex w-full flex-col items-center gap-2 px-6 py-10 text-center transition-colors rounded-t-lg",
          dragOver
            ? "bg-blue-50"
            : "hover:bg-gray-50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            dragOver ? "bg-blue-100" : "bg-gray-100"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          ) : (
            <Upload
              className={cn(
                "h-6 w-6",
                dragOver ? "text-blue-500" : "text-gray-700"
              )}
            />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isUploading
              ? "Uploading..."
              : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-gray-700">
            PDF, Word, Excel, images, or ZIP up to 50 MB
          </p>
        </div>
      </button>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2">
          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 text-xs"
            >
              {file.status === "uploading" && (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              )}
              {file.status === "done" && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
              {file.status === "error" && (
                <X className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  "truncate",
                  file.status === "done" && "text-gray-700",
                  file.status === "uploading" && "text-gray-400",
                  file.status === "error" && "text-red-600"
                )}
              >
                {file.name}
              </span>
              {file.error && (
                <span className="ml-auto text-red-500">{file.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
