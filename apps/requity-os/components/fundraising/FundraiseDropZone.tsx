"use client";

import { useRef, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  FileText,
  Upload,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/toast";

interface FundraiseDropZoneProps {
  label: string;
  kind: "hero" | "deck";
  accept: string;
  maxSize: number;
  currentUrl: string | null;
  currentFileName?: string;
  hint: string;
  onFile: (file: File) => Promise<void>;
  onClear: () => void;
  uploading?: boolean;
}

export function FundraiseDropZone({
  label,
  kind,
  accept,
  maxSize,
  currentUrl,
  currentFileName,
  hint,
  onFile,
  onClear,
  uploading: externalUploading,
}: FundraiseDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalUploading, setInternalUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const uploading = externalUploading || internalUploading;
  const Icon = kind === "hero" ? ImageIcon : FileText;
  const acceptList = accept.split(",").map((s) => s.trim());

  const processFile = useCallback(
    async (file: File) => {
      if (!acceptList.some((t) => file.type === t || file.name.endsWith(t.replace("*", "")))) {
        showError(`Invalid file type for ${label}`);
        return;
      }
      if (file.size > maxSize) {
        showError(`File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
        return;
      }
      setInternalUploading(true);
      try {
        await onFile(file);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2000);
      } catch {
        showError("Could not upload file");
      } finally {
        setInternalUploading(false);
      }
    },
    [acceptList, maxSize, label, onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // ─── Uploaded state ───
  if (currentUrl) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="relative rounded-lg border border-border overflow-hidden group">
          {kind === "hero" ? (
            <div className="relative aspect-video bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt="Hero preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rq-transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Replace
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClear}
                  disabled={uploading}
                  className="text-destructive"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
              <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentFileName ?? "investment-deck.pdf"}
                </p>
                <p className="text-xs text-muted-foreground">PDF uploaded</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                onClick={onClear}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
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

  // ─── Empty drop zone ───
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={uploading}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center rq-transition cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : justUploaded ? (
          <Check className="h-8 w-8 text-emerald-500" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading
              ? "Uploading..."
              : justUploaded
                ? "Uploaded"
                : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {kind === "hero"
              ? "JPEG, PNG, or WebP (max 10MB)"
              : "PDF (max 25MB)"}
          </p>
        </div>
      </button>
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
