"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type {
  EmailTemplate,
  EmailTemplateVersion,
} from "@/app/(authenticated)/admin/email-templates/types";
import { updateTemplateAction } from "@/app/(authenticated)/admin/email-templates/actions-write";
import { HtmlEditor } from "./html-editor";
import { TemplatePreview } from "./template-preview";
import { VariableInserter } from "./variable-inserter";
import { VersionHistory } from "./version-history";

interface TemplateEditorProps {
  template: EmailTemplate;
  versions: EmailTemplateVersion[];
}

export function TemplateEditor({
  template: initial,
  versions: initialVersions,
}: TemplateEditorProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof EmailTemplate, value: string | boolean) => {
      setTemplate((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    },
    []
  );

  const handleInsertVariable = useCallback((variable: string) => {
    setTemplate((prev) => ({
      ...prev,
      html_body_template: prev.html_body_template + `{{${variable}}}`,
    }));
    setSaved(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const result = await updateTemplateAction(template.id, {
      display_name: template.display_name,
      slug: template.slug,
      subject_template: template.subject_template,
      html_body_template: template.html_body_template,
    });

    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setTemplate((prev) => ({ ...result.template, category: prev.category }));
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/control-center/email-templates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to templates
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-green-600">Saved</span>
          )}
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Template Name</Label>
          <Input
            id="display_name"
            value={template.display_name}
            onChange={(e) =>
              handleFieldChange("display_name", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={template.slug}
            onChange={(e) => handleFieldChange("slug", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex items-center h-10">
            <Badge variant="secondary" className="capitalize text-sm">
              {template.category ?? "general"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_template">Subject Line</Label>
        <Input
          id="subject_template"
          value={template.subject_template}
          onChange={(e) =>
            handleFieldChange("subject_template", e.target.value)
          }
          placeholder="e.g. Your loan {{loan_number}} has been approved"
        />
      </div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <VariableInserter onInsert={handleInsertVariable} />
          <HtmlEditor
            value={template.html_body_template}
            onChange={(v) => handleFieldChange("html_body_template", v)}
          />
        </TabsContent>

        <TabsContent value="preview">
          <TemplatePreview
            subject={template.subject_template}
            htmlBody={template.html_body_template}
            previewData={template.preview_data}
            availableVariables={template.available_variables}
          />
        </TabsContent>

        <TabsContent value="versions">
          <VersionHistory
            templateId={template.id}
            initialVersions={initialVersions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
