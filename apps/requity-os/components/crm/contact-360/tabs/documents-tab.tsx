"use client";

import { ContactFilesSection } from "@/components/crm/contact-files-section";

interface DocumentsTabProps {
  contactId: string;
}

export function DocumentsTab({ contactId }: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <ContactFilesSection contactId={contactId} />
    </div>
  );
}
