"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Upload, Download, MoreHorizontal, X } from "lucide-react";
import { relTime } from "@/components/crm/contact-360/contact-detail-shared";
import { COMPANY_FILE_TYPES } from "@/lib/constants";
import type { CompanyFileData } from "../types";
import { FILE_TYPE_LABELS, FILE_TYPE_COLORS } from "../types";

interface FilesTabProps {
  files: CompanyFileData[];
  companyId: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes > 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export function CompanyFilesTab({ files, companyId }: FilesTabProps) {
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("other");
  const router = useRouter();
  const { toast } = useToast();

  const filterTypes = ["all", "nda", "fee_agreement", "rate_sheet", "w9", "other"];
  const filtered =
    filter === "all" ? files : files.filter((f) => f.file_type === filter);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const supabase = createClient();
      const storagePath = `${companyId}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("loan-documents")
        .upload(storagePath, selectedFile);

      if (uploadError) throw uploadError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from("company_files")
        .insert({
          company_id: companyId,
          file_name: selectedFile.name,
          file_type: fileType,
          storage_path: storagePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: user?.id || null,
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({ title: "File uploaded successfully" });
      setShowUpload(false);
      setSelectedFile(null);
      setFileType("other");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {filterTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150 ${
                filter === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {t === "all" ? "All" : FILE_TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-border text-xs"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
          Upload
        </Button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">File</Label>
              <Input
                type="file"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
                className="rounded-lg border-border text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">File Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="rounded-lg border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_FILE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-border"
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={uploading || !selectedFile}
              onClick={handleUpload}
              className="rounded-lg bg-foreground text-background hover:bg-foreground/90"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      )}

      {/* Files list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <FileText
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No files
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter !== "all"
              ? `No ${FILE_TYPE_LABELS[filter] || filter} files. Try changing the filter.`
              : "Upload your first file to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((f) => {
            const typeColor =
              FILE_TYPE_COLORS[f.file_type] || FILE_TYPE_COLORS.other;
            const typeLabel =
              FILE_TYPE_LABELS[f.file_type] || f.file_type;

            return (
              <div
                key={f.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 transition-all duration-150"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <FileText
                    size={16}
                    className="text-[#3B82F6]"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">
                    {f.file_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-px text-[11px] font-medium"
                      style={{
                        backgroundColor: `${typeColor}14`,
                        color: typeColor,
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span>{formatBytes(f.file_size)}</span>
                    <span className="text-muted-foreground/50">&middot;</span>
                    <span>{f.uploaded_by_name || "Unknown"}</span>
                    <span className="text-muted-foreground/50">&middot;</span>
                    <span>{relTime(f.uploaded_at)}</span>
                  </div>
                </div>
                {f.notes && (
                  <span className="text-[11px] text-muted-foreground italic shrink-0">
                    {f.notes}
                  </span>
                )}
                <div className="flex gap-1 shrink-0">
                  <button className="w-[30px] h-[30px] rounded-md border border-border flex items-center justify-center cursor-pointer hover:bg-muted">
                    <Download
                      size={13}
                      className="text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </button>
                  <button className="w-[30px] h-[30px] rounded-md border border-border flex items-center justify-center cursor-pointer hover:bg-muted">
                    <MoreHorizontal
                      size={13}
                      className="text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
