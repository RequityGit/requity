"use client";

import { AttachmentPreview } from "./AttachmentPreview";

interface AttachmentListProps {
  attachments: Array<{
    id: string;
    fileName: string;
    fileType?: string | null;
    fileSize?: number | null;
    storagePath: string;
  }>;
  onRemove?: (id: string) => void;
  compact?: boolean;
}

export function AttachmentList({ attachments, onRemove, compact = false }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={compact ? "flex flex-wrap gap-1.5 mt-2" : "flex flex-col gap-1.5"}>
      {attachments.map((a) => (
        <AttachmentPreview
          key={a.id}
          fileName={a.fileName}
          fileType={a.fileType}
          fileSize={a.fileSize}
          storagePath={a.storagePath}
          onRemove={onRemove ? () => onRemove(a.id) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}
