"use client";

interface DocumentRow {
  id: string;
  deal_id: string;
  document_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  review_status: string | null;
  storage_path: string | null;
  visibility?: string | null;
  _uploaded_by_name?: string | null;
}

interface DocumentsTabProps {
  documents: DocumentRow[];
  dealId: string;
  googleDriveFolderUrl: string | null;
}

export function DocumentsTab({ documents, dealId, googleDriveFolderUrl }: DocumentsTabProps) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-muted-foreground text-sm">
        Documents for this deal. {documents.length} file(s).
      </p>
      {documents.length === 0 && (
        <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
      )}
    </div>
  );
}
