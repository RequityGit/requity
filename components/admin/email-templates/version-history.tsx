"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { EmailTemplateVersion } from "@/app/(authenticated)/admin/email-templates/types";
import { fetchTemplateVersionsAction } from "@/app/(authenticated)/admin/email-templates/actions";

interface VersionHistoryProps {
  templateId: string;
  initialVersions: EmailTemplateVersion[];
}

export function VersionHistory({
  templateId,
  initialVersions,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState(initialVersions);
  const [selected, setSelected] = useState<EmailTemplateVersion | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const result = await fetchTemplateVersionsAction(templateId);
    if ("success" in result) {
      setVersions(result.versions);
    }
    setLoading(false);
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
        No version history yet. Versions are created automatically when you
        update the subject or body.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? "s" : ""} saved
        </p>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Version</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead className="w-[80px] text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-sm">
                  v{v.version_number}
                </TableCell>
                <TableCell className="truncate max-w-[300px]">
                  {v.subject || <span className="italic text-muted-foreground">No subject</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(v)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version {selected?.version_number}
            </DialogTitle>
            <DialogDescription>
              Saved on{" "}
              {selected &&
                new Date(selected.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Subject
                </div>
                <div className="text-sm border rounded-md p-2 bg-slate-50">
                  {selected.subject || "No subject"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  HTML Body
                </div>
                <pre className="text-xs border rounded-md p-3 bg-slate-50 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {selected.html_body || "No content"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
