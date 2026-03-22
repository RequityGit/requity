import {
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileCode,
  type LucideIcon,
} from "lucide-react";

interface FileTypeStyle {
  icon: LucideIcon;
  color: string;
  bgTint: string;
}

export function getFileTypeStyle(
  fileType?: string | null,
  fileName?: string
): FileTypeStyle {
  const type = (fileType || "").toLowerCase();
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  // Spreadsheets — green
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["xlsx", "xls", "csv", "tsv"].includes(ext)
  ) {
    return {
      icon: FileSpreadsheet,
      color: "text-emerald-600 dark:text-emerald-400",
      bgTint: "bg-emerald-500/[0.08] dark:bg-emerald-500/10",
    };
  }

  // PDFs — red
  if (type === "application/pdf" || ext === "pdf") {
    return {
      icon: FileText,
      color: "text-red-600 dark:text-red-400",
      bgTint: "bg-red-500/[0.08] dark:bg-red-500/10",
    };
  }

  // Word docs — blue
  if (
    type.includes("word") ||
    type.includes("document") ||
    ["doc", "docx"].includes(ext)
  ) {
    return {
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgTint: "bg-blue-500/[0.08] dark:bg-blue-500/10",
    };
  }

  // Images — violet
  if (
    type.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)
  ) {
    return {
      icon: FileImage,
      color: "text-violet-600 dark:text-violet-400",
      bgTint: "bg-violet-500/[0.08] dark:bg-violet-500/10",
    };
  }

  // Archives — amber
  if (
    type.includes("zip") ||
    type.includes("archive") ||
    type.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(ext)
  ) {
    return {
      icon: FileArchive,
      color: "text-amber-600 dark:text-amber-400",
      bgTint: "bg-amber-500/[0.08] dark:bg-amber-500/10",
    };
  }

  // Code/text — cyan
  if (
    type.includes("text") ||
    type.includes("json") ||
    type.includes("xml") ||
    ["txt", "json", "xml", "html", "css", "js", "ts"].includes(ext)
  ) {
    return {
      icon: FileCode,
      color: "text-cyan-600 dark:text-cyan-400",
      bgTint: "bg-cyan-500/[0.08] dark:bg-cyan-500/10",
    };
  }

  // Default — muted gray
  return {
    icon: File,
    color: "text-muted-foreground",
    bgTint: "bg-muted/30",
  };
}
