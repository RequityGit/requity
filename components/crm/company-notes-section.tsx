"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { updateCompanyAction } from "@/app/(authenticated)/admin/crm/company-actions";
import { StickyNote, Save } from "lucide-react";

interface CompanyNotesSectionProps {
  companyId: string;
  initialNotes: string;
}

export function CompanyNotesSection({
  companyId,
  initialNotes,
}: CompanyNotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateCompanyAction({ id: companyId, notes });
      if ("error" in result && result.error) {
        toast({
          title: "Error saving notes",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Notes saved" });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Add notes about this company..."
            className="resize-none"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
