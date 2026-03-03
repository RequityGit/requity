"use client";

import { Upload, FileText, Eye, Download } from "lucide-react";
import { SectionCard, OutlinePill, cap, fD, type DocumentData } from "../components";

interface DocumentsTabProps {
  documents: DocumentData[];
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "\u2014";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Upload zone */}
      <div className="cursor-pointer rounded-xl border-2 border-dashed border-[#E5E5E7] bg-white px-5 py-8 text-center">
        <Upload size={28} className="mx-auto text-[#8B8B8B]" />
        <div className="mt-2 text-sm font-medium text-[#1A1A1A] font-sans">
          Drop files here or click to upload
        </div>
        <div className="mt-1 text-xs text-[#8B8B8B] font-sans">
          PDF, DOCX, XLSX up to 25MB
        </div>
      </div>

      {/* Document list */}
      <SectionCard
        title={`Documents (${documents.length})`}
        icon={FileText}
        noPad
      >
        {documents.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-[#8B8B8B] font-sans">
            No documents uploaded yet.
          </div>
        )}
        {documents.map((doc, i) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-5 py-3"
            style={{
              borderBottom:
                i < documents.length - 1
                  ? "1px solid #F0F0F2"
                  : "none",
            }}
          >
            <FileText size={16} className="shrink-0 text-[#6B6B6B]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-[#1A1A1A] font-sans">
                {doc.name || doc.file_name || "Untitled"}
              </div>
              <div className="text-[11px] text-[#8B8B8B] font-sans">
                {doc._uploaded_by_name || "\u2014"} &middot;{" "}
                {fD(doc.created_at)} &middot;{" "}
                {formatFileSize(doc.file_size)}
              </div>
            </div>
            {doc.document_type && (
              <OutlinePill label={cap(doc.document_type)} />
            )}
            <button className="cursor-pointer border-none bg-transparent p-1">
              <Eye size={14} className="text-[#6B6B6B]" />
            </button>
            <button className="cursor-pointer border-none bg-transparent p-1">
              <Download size={14} className="text-[#6B6B6B]" />
            </button>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
