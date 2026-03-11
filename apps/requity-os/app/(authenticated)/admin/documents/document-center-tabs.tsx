"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentListTable } from "@/components/admin/document-list-table";
import {
  GeneratedDocumentsTable,
  type GeneratedDocRow,
} from "@/components/documents/GeneratedDocumentsTable";

interface UploadedDocRow {
  id: string;
  file_name: string;
  description: string | null;
  document_type: string | null;
  owner_name: string;
  entity_name: string | null;
  source: "loan" | "contact" | "company" | "deal";
  status: string;
  created_at: string;
  storage_path: string | null;
  storage_bucket: string | null;
  file_url: string | null;
  mime_type: string | null;
}

interface Props {
  uploadedDocuments: UploadedDocRow[];
  generatedDocuments: GeneratedDocRow[];
  isSuperAdmin: boolean;
  uploadAction: React.ReactNode;
  createAction?: React.ReactNode;
}

export function DocumentCenterTabs({
  uploadedDocuments,
  generatedDocuments,
  isSuperAdmin,
  uploadAction,
  createAction,
}: Props) {
  return (
    <Tabs defaultValue="uploaded" className="space-y-4">
      <TabsList>
        <TabsTrigger value="uploaded">
          Uploaded Documents
          {uploadedDocuments.length > 0 && (
            <span className="ml-1.5 text-[10px] num">
              ({uploadedDocuments.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="generated">
          Generated Documents
          {generatedDocuments.length > 0 && (
            <span className="ml-1.5 text-[10px] num">
              ({generatedDocuments.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="uploaded">
        <DocumentListTable data={uploadedDocuments} action={uploadAction} isSuperAdmin={isSuperAdmin} />
      </TabsContent>

      <TabsContent value="generated">
        <GeneratedDocumentsTable data={generatedDocuments} action={createAction} />
      </TabsContent>
    </Tabs>
  );
}
