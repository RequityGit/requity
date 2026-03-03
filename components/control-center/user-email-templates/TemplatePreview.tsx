"use client";

interface TemplatePreviewProps {
  subject: string;
  bodyHtml: string;
  previewMode: "desktop" | "mobile";
}

export function TemplatePreview({
  subject,
  bodyHtml,
  previewMode,
}: TemplatePreviewProps) {
  return (
    <div className="space-y-3">
      {/* Subject preview */}
      <div className="border rounded-md p-3 bg-muted/50">
        <p className="text-[10px] text-muted-foreground mb-1">Subject</p>
        <p className="text-sm font-medium">{subject || "No subject"}</p>
      </div>

      {/* Body preview */}
      <div
        className={`border rounded-md bg-white overflow-hidden ${
          previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
        }`}
      >
        <div className="bg-gray-100 px-3 py-1.5 border-b flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <span className="text-[10px] text-gray-500">Email Preview</span>
        </div>
        <div
          className="p-4 overflow-auto max-h-[600px] text-black"
          dangerouslySetInnerHTML={{ __html: bodyHtml || "<p style='color:#999;text-align:center;padding:40px;'>Start typing to see a preview...</p>" }}
        />
      </div>
    </div>
  );
}
