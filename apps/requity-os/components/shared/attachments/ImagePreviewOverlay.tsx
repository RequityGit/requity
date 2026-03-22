"use client";

import { useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";

interface ImagePreviewOverlayProps {
  src: string;
  fileName: string;
  onClose: () => void;
}

export function ImagePreviewOverlay({ src, fileName, onClose }: ImagePreviewOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-white">
          <span className="text-sm font-medium">{fileName}</span>
          <button
            type="button"
            onClick={handleDownload}
            className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rq-transition"
            title="Download"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rq-transition"
            title="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fileName}
          className="max-w-[85vw] max-h-[80vh] rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
