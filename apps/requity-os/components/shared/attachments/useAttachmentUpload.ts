"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageName, formatFileSize } from "@/lib/document-upload-utils";

export interface UploadedAttachment {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath: string;
}

export interface StagedFile {
  id: string;
  file: File;
  preview?: string;
}

interface UseAttachmentUploadOptions {
  bucket?: string;
  pathPrefix: string;
  maxFileSize?: number;
  onError?: (error: string) => void;
}

const DEFAULT_MAX_SIZE = 25 * 1024 * 1024; // 25MB

export function useAttachmentUpload({
  bucket = "loan-documents",
  pathPrefix,
  maxFileSize = DEFAULT_MAX_SIZE,
  onError,
}: UseAttachmentUploadOptions) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newStaged: StagedFile[] = [];

      for (const file of fileArray) {
        if (file.size > maxFileSize) {
          const maxMB = Math.round(maxFileSize / (1024 * 1024));
          onError?.(`${file.name} exceeds ${maxMB}MB limit (${formatFileSize(file.size)})`);
          continue;
        }
        if (file.size === 0) {
          onError?.(`${file.name} is empty`);
          continue;
        }

        const staged: StagedFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
        };

        // Create preview for images
        if (file.type.startsWith("image/")) {
          staged.preview = URL.createObjectURL(file);
        }

        newStaged.push(staged);
      }

      if (newStaged.length > 0) {
        setStagedFiles((prev) => [...prev, ...newStaged]);
      }
    },
    [maxFileSize, onError]
  );

  const removeStaged = useCallback((id: string) => {
    setStagedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadedAttachment[]> => {
    if (stagedFiles.length === 0) return [];
    setUploading(true);

    const supabase = createClient();
    const uploaded: UploadedAttachment[] = [];

    for (const sf of stagedFiles) {
      const safeName = sanitizeStorageName(sf.file.name);
      const storagePath = `${pathPrefix}/${Date.now()}_${safeName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, sf.file);

      if (error) {
        onError?.(`Failed to upload ${sf.file.name}: ${error.message}`);
        continue;
      }

      uploaded.push({
        fileName: sf.file.name,
        fileType: sf.file.type || "application/octet-stream",
        fileSizeBytes: sf.file.size,
        storagePath,
      });
    }

    setUploading(false);
    return uploaded;
  }, [stagedFiles, pathPrefix, bucket, onError]);

  const clearStaged = useCallback(() => {
    for (const sf of stagedFiles) {
      if (sf.preview) URL.revokeObjectURL(sf.preview);
    }
    setStagedFiles([]);
  }, [stagedFiles]);

  return {
    stagedFiles,
    uploading,
    addFiles,
    removeStaged,
    uploadAll,
    clearStaged,
  };
}
