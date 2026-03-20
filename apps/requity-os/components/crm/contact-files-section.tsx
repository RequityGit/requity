"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFileUpload } from "./contact-file-upload";
import { ContactFileList } from "./contact-file-list";
import { Paperclip } from "lucide-react";

interface ContactFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string | null;
  notes: string | null;
}

interface ContactFilesSectionProps {
  contactId: string;
}

export function ContactFilesSection({ contactId }: ContactFilesSectionProps) {
  const [files, setFiles] = useState<ContactFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("contact_files")
        .select(
          "id, file_name, file_type, storage_path, file_size, mime_type, uploaded_at, notes"
        )
        .eq("contact_id", contactId)
        .order("uploaded_at", { ascending: false });
      setFiles(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Files ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ContactFileUpload contactId={contactId} onUploaded={fetchFiles} />
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading files...
            </p>
          ) : (
            <ContactFileList files={files} onDeleted={fetchFiles} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
