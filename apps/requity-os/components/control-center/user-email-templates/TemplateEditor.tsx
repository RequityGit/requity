"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  Monitor,
  Smartphone,
  History,
} from "lucide-react";
import Link from "next/link";
import type {
  UserEmailTemplate,
  UserEmailTemplateVersion,
  UserEmailTemplateVariable,
} from "@/lib/types/user-email-templates";
import {
  USER_TEMPLATE_CATEGORIES,
  USER_TEMPLATE_CONTEXTS,
  ALL_MERGE_VARIABLES,
} from "@/lib/types/user-email-templates";
import {
  resolveTemplate,
  buildSampleData,
  generateSlug,
} from "@/lib/mergeFieldResolver";
import { VariableInserter } from "./VariableInserter";
import { VariableManager } from "./VariableManager";
import { TemplatePreview } from "./TemplatePreview";
import { TemplateVersionHistory } from "./TemplateVersionHistory";
import {
  createUserEmailTemplateAction,
  updateUserEmailTemplateAction,
} from "@/app/(authenticated)/control-center/user-email-templates/actions";
import { formatDate } from "@/lib/format";

interface TemplateEditorPageProps {
  template: UserEmailTemplate | null;
  versions: UserEmailTemplateVersion[];
}

export function TemplateEditorPage({
  template,
  versions,
}: TemplateEditorPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = !template;
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [editorTab, setEditorTab] = useState<"visual" | "source">("source");
  const [changeNotes, setChangeNotes] = useState("");

  const [form, setForm] = useState({
    name: template?.name ?? "",
    slug: template?.slug ?? "",
    description: template?.description ?? "",
    category: template?.category ?? "general",
    context: template?.context ?? "any",
    subject_template: template?.subject_template ?? "",
    body_template: template?.body_template ?? "",
    is_default: template?.is_default ?? false,
    sort_order: template?.sort_order ?? 0,
    available_variables: template?.available_variables ?? [...ALL_MERGE_VARIABLES],
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!template);

  function updateField(field: string, value: unknown) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name when creating a new template
      if (field === "name" && !slugManuallyEdited) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  }

  const insertVariableIntoSubject = useCallback(
    (variableKey: string) => {
      const input = subjectRef.current;
      if (!input) return;
      const tag = `{{${variableKey}}}`;
      setForm((prev) => {
        const start = input.selectionStart ?? prev.subject_template.length;
        const end = input.selectionEnd ?? start;
        const newValue =
          prev.subject_template.slice(0, start) +
          tag +
          prev.subject_template.slice(end);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
        return { ...prev, subject_template: newValue };
      });
    },
    []
  );

  const insertVariableIntoBody = useCallback(
    (variableKey: string) => {
      const textarea = bodyRef.current;
      if (!textarea) return;
      const tag = `{{${variableKey}}}`;
      setForm((prev) => {
        const start = textarea.selectionStart ?? prev.body_template.length;
        const end = textarea.selectionEnd ?? start;
        const newValue =
          prev.body_template.slice(0, start) +
          tag +
          prev.body_template.slice(end);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
        return { ...prev, body_template: newValue };
      });
    },
    []
  );

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: "Slug required", variant: "destructive" });
      return;
    }
    if (!form.subject_template.trim()) {
      toast({ title: "Subject template required", variant: "destructive" });
      return;
    }
    if (!form.body_template.trim()) {
      toast({ title: "Body template required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const result = await createUserEmailTemplateAction({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          category: form.category,
          subject_template: form.subject_template,
          body_template: form.body_template,
          available_variables: form.available_variables,
          context: form.context as "deal" | "contact" | "any",
          is_default: form.is_default,
          sort_order: form.sort_order,
        });

        if ("error" in result) {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Template created" });
          router.push(`/control-center/user-email-templates/${result.template.id}`);
        }
      } else {
        const result = await updateUserEmailTemplateAction(
          template.id,
          {
            name: form.name,
            slug: form.slug,
            description: form.description || undefined,
            category: form.category,
            subject_template: form.subject_template,
            body_template: form.body_template,
            available_variables: form.available_variables,
            context: form.context as "deal" | "contact" | "any",
            is_default: form.is_default,
            sort_order: form.sort_order,
          },
          changeNotes || undefined
        );

        if ("error" in result) {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Template saved" });
          setChangeNotes("");
          router.refresh();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const sampleData = buildSampleData(form.available_variables);
  const resolvedSubject = resolveTemplate(form.subject_template, sampleData);
  const resolvedBody = resolveTemplate(form.body_template, sampleData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/control-center/user-email-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-lg font-semibold">
              {isNew ? "Create Template" : `Edit: ${template.name}`}
            </h2>
            {!isNew && (
              <p className="text-xs text-muted-foreground">
                Version {template.version} &middot; Last updated{" "}
                {formatDate(template.updated_at)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Input
              placeholder="Change notes (optional)"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              className="w-64 text-sm"
            />
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — Editor (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Template metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Outstanding Conditions Reminder"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      updateField("slug", e.target.value);
                    }}
                    placeholder="outstanding_conditions_reminder"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="When to use this template..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => updateField("category", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Context</Label>
                  <Select
                    value={form.context}
                    onValueChange={(val) => updateField("context", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_TEMPLATE_CONTEXTS.map((ctx) => (
                        <SelectItem key={ctx} value={ctx} className="capitalize">
                          {ctx}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      updateField("sort_order", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject line */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Subject Line</CardTitle>
                <VariableInserter
                  variables={form.available_variables}
                  onInsert={insertVariableIntoSubject}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Input
                ref={subjectRef}
                value={form.subject_template}
                onChange={(e) => updateField("subject_template", e.target.value)}
                placeholder="{{loan_number}} — Outstanding Items for {{property_address_short}}"
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Body editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Email Body</CardTitle>
                <div className="flex items-center gap-2">
                  <VariableInserter
                    variables={form.available_variables}
                    onInsert={insertVariableIntoBody}
                  />
                  <Tabs
                    value={editorTab}
                    onValueChange={(v) => setEditorTab(v as "visual" | "source")}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="source" className="text-xs gap-1 px-2 py-1">
                        <Code className="h-3 w-3" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="visual" className="text-xs gap-1 px-2 py-1">
                        <Eye className="h-3 w-3" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editorTab === "source" ? (
                <Textarea
                  ref={bodyRef}
                  value={form.body_template}
                  onChange={(e) => updateField("body_template", e.target.value)}
                  placeholder="<div>Email HTML body with {{merge_fields}}...</div>"
                  className="font-mono text-xs min-h-[400px] resize-y"
                />
              ) : (
                <div
                  className="border rounded-md p-4 min-h-[400px] bg-white text-black overflow-auto"
                  dangerouslySetInnerHTML={{ __html: resolvedBody }}
                />
              )}
            </CardContent>
          </Card>

          {/* Variable management */}
          <VariableManager
            variables={form.available_variables}
            onChange={(vars) =>
              updateField("available_variables", vars)
            }
          />
        </div>

        {/* Right panel — Preview (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TemplatePreview
                subject={resolvedSubject}
                bodyHtml={resolvedBody}
                previewMode={previewMode}
              />
            </CardContent>
          </Card>

          {/* Version history */}
          {!isNew && versions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <History className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateVersionHistory versions={versions} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
