"use client";

import { formatDate } from "@/lib/format";
import type { UserEmailTemplateVersion } from "@/lib/types/user-email-templates";

interface TemplateVersionHistoryProps {
  versions: UserEmailTemplateVersion[];
}

export function TemplateVersionHistory({
  versions,
}: TemplateVersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No version history yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {versions.map((version) => (
        <div
          key={version.id}
          className="flex items-start gap-3 p-2 rounded-md border text-xs"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            v{version.version}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {version.subject_template}
            </p>
            {version.change_notes && (
              <p className="text-muted-foreground mt-0.5">
                {version.change_notes}
              </p>
            )}
            <p className="text-muted-foreground mt-0.5">
              {formatDate(version.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
