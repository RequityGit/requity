"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyFileUpload } from "./company-file-upload";
import { CompanyFileList } from "./company-file-list";
import { Paperclip } from "lucide-react";

interface CompanyFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  notes: string | null;
}

interface CompanyFilesSectionProps {
  companyId: string;
}

export function CompanyFilesSection({ companyId }: CompanyFilesSectionProps) {
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("company_files")
        .select(
          "id, file_name, file_type, storage_path, file_size, mime_type, uploaded_at, notes"
        )
        .eq("company_id", companyId)
        .order("uploaded_at", { ascending: false });
      setFiles((data ?? []) as CompanyFile[]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

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
          <CompanyFileUpload companyId={companyId} onUploaded={fetchFiles} />
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading files...
            </p>
          ) : (
            <CompanyFileList files={files} onDeleted={fetchFiles} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
