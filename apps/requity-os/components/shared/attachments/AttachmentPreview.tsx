"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/document-upload-utils";
import { ImagePreviewOverlay } from "./ImagePreviewOverlay";
import { getFileTypeStyle } from "./file-type-colors";

interface AttachmentPreviewProps {
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  storagePath: string;
  onRemove?: () => void;
  compact?: boolean;
  /** Data URL preview for staged (not yet uploaded) images */
  previewUrl?: string;
}

export function AttachmentPreview({
  fileName,
  fileType,
  fileSize,
  storagePath,
  onRemove,
  compact = false,
  previewUrl,
}: AttachmentPreviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const isImage = fileType?.startsWith("image/");
  const style = getFileTypeStyle(fileType, fileName);
  const IconComponent = style.icon;

  // Load signed URL for uploaded image thumbnails
  useEffect(() => {
    if (!isImage || !storagePath || previewUrl) return;
    setLoadingUrl(true);
    const supabase = createClient();
    supabase.storage
      .from("loan-documents")
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setThumbnailUrl(data.signedUrl);
      })
      .finally(() => setLoadingUrl(false));
  }, [storagePath, isImage, previewUrl]);

  async function handleChipClick() {
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

  // Determine the thumbnail src: previewUrl (staged) > thumbnailUrl (uploaded signed)
  const thumbSrc = previewUrl || thumbnailUrl;
  const showThumbnail = isImage && thumbSrc && !thumbnailError;

  // Image thumbnail rendering
  if (showThumbnail) {
    const maxW = compact ? "max-w-[200px]" : "max-w-[240px]";
    const maxH = compact ? "max-h-[120px]" : "max-h-[160px]";

    return (
      <>
        <button
          type="button"
          onClick={() => {
            if (thumbnailUrl) setImagePreview(thumbnailUrl);
            else if (storagePath) handleChipClick();
          }}
          className="group relative rounded-lg overflow-hidden border border-border/50 hover:border-border rq-transition cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={fileName}
            className={cn(maxW, maxH, "object-cover rounded-lg")}
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rq-transition rounded-lg" />
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 rq-transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>

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

  // Loading placeholder for image thumbnails
  if (isImage && loadingUrl && !thumbnailError) {
    const phW = compact ? "w-[200px]" : "w-[240px]";
    const phH = compact ? "h-[120px]" : "h-[160px]";

    return (
      <div className={cn(phW, phH, "rounded-lg bg-muted animate-pulse")} />
    );
  }

  // Color-coded file chip for non-images (or image fallback)
  return (
    <>
      <div
        className={cn(
          "group inline-flex items-center gap-2 rounded-lg border border-border/50 cursor-pointer rq-transition",
          style.bgTint,
          compact ? "px-2 py-1.5" : "px-3 py-2"
        )}
        onClick={storagePath ? handleChipClick : undefined}
        role={storagePath ? "button" : undefined}
        tabIndex={storagePath ? 0 : undefined}
      >
        <IconComponent
          className={cn(
            "flex-shrink-0",
            style.color,
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
          strokeWidth={1.5}
        />
        <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
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
            className="h-4 w-4 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 rq-transition ml-1"
          >
            <X className="h-3 w-3" />
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
