"use client";

import { useState } from "react";
import { X, FileText, FileImage, FileSpreadsheet, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/document-upload-utils";
import { ImagePreviewOverlay } from "./ImagePreviewOverlay";

interface AttachmentPreviewProps {
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  storagePath: string;
  onRemove?: () => void;
  compact?: boolean;
}

function getFileIcon(fileType?: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return FileImage;
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType.includes("csv")
  )
    return FileSpreadsheet;
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text"))
    return FileText;
  return File;
}

export function AttachmentPreview({
  fileName,
  fileType,
  fileSize,
  storagePath,
  onRemove,
  compact = false,
}: AttachmentPreviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const Icon = getFileIcon(fileType);
  const isImage = fileType?.startsWith("image/");

  async function handleClick() {
    // If no storagePath (staged file not yet uploaded), do nothing
    if (!storagePath) return;

    const supabase = createClient();
    const { data } = await supabase.storage
      .from("loan-documents")
      .createSignedUrl(storagePath, 3600);

    if (!data?.signedUrl) return;

    if (isImage) {
      setImagePreview(data.signedUrl);
    } else {
      window.open(data.signedUrl, "_blank");
    }
  }

  return (
    <>
      <div
        className={cn(
          "group inline-flex items-center gap-2 rounded-lg border border-border cursor-pointer rq-transition",
          compact
            ? "bg-muted/20 px-2 py-1.5 hover:bg-muted/40"
            : "bg-muted/30 px-3 py-2 hover:bg-muted/50"
        )}
        onClick={storagePath ? handleClick : undefined}
        role={storagePath ? "button" : undefined}
        tabIndex={storagePath ? 0 : undefined}
      >
        <Icon
          className={cn(
            "text-muted-foreground flex-shrink-0",
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
          strokeWidth={1.5}
        />
        <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
          {fileName}
        </span>
        {fileSize != null && fileSize > 0 && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatFileSize(fileSize)}
            </span>
          </>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive rq-transition flex-shrink-0 ml-auto"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>

      {imagePreview && (
        <ImagePreviewOverlay
          src={imagePreview}
          fileName={fileName}
          onClose={() => setImagePreview(null)}
        />
      )}
    </>
  );
}
