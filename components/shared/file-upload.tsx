"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File as FileIcon, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 10,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  function handleRemove() {
    setSelectedFile(null);
    setError(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Camera input for mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div className="space-y-2">
          {/* Mobile: camera as primary option */}
          {isMobile && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[56px] mobile-press"
            >
              <Camera className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">
                Take a Photo
              </span>
            </button>
          )}

          {/* File upload area */}
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-border transition-colors",
              isMobile ? "p-4 min-h-[56px] flex items-center justify-center gap-2" : "p-6"
            )}
          >
            <Upload className={cn("text-muted-foreground", isMobile ? "h-5 w-5" : "h-8 w-8 mx-auto mb-2")} />
            <div>
              <p className="text-sm text-muted-foreground">
                {isMobile ? "Choose from Files" : "Click to upload a file"}
              </p>
              {!isMobile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max {maxSize}MB
                </p>
              )}
            </div>
          </div>
          {isMobile && (
            <p className="text-[11px] text-muted-foreground text-center">
              Max {maxSize}MB
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-10 w-10 rounded object-cover flex-shrink-0"
            />
          ) : (
            <FileIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
