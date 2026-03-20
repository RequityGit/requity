"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  GripVertical,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FormEngine } from "@/components/forms/FormEngine";
import { IconPicker } from "@/components/forms/IconPicker";
import type {
  FormDefinition,
  FormStep,
  FormFieldDefinition,
  FormSettings,
  ShowWhenCondition,
  FormFieldOption,
} from "@/lib/form-engine/types";

function createEmptyField(): FormFieldDefinition {
  return {
    id: `f_${Date.now()}`,
    type: "text",
    label: "New Field",
    required: false,
    mapped_column: null,
    width: "full",
    placeholder: null,
    visibility_mode: "both",
    visibility_form_mode: "both",
  };
}

function createEmptyStep(): FormStep {
  return {
    id: `s_${Date.now()}`,
    title: "New Step",
    subtitle: "",
    type: "form",
    target_entity: null,
    match_on: null,
    show_when: null,
    fields: [],
  };
}

export default function FormEditorPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [previewContext, setPreviewContext] = useState<"external" | "internal">("external");

  // Submission list state
  const [submissions, setSubmissions] = useState<Array<{
    id: string;
    status: string;
    submitted_by_email: string | null;
    current_step_id: string | null;
    entity_ids: Record<string, string>;
    created_at: string;
    data: Record<string, unknown>;
  }>>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient();
      const { data, error } = await supabase
        .from("form_definitions")
        .select("*")
        .eq("id", formId)
        .single();

      if (error || !data) {
        toast.error("Form not found");
        router.push("/control-center/forms");
        return;
      }

      setFormDef({
        ...(data as any),
        steps: ((data as any).steps || []) as FormStep[],
        settings: ((data as any).settings || {}) as FormSettings,
        contexts: ((data as any).contexts || []) as FormDefinition["contexts"],
      } as FormDefinition);
      setLoading(false);
    }
    load();
  }, [formId, router]);

  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createClient();
    const { data } = await supabase
      .from("form_submissions")
      .select("id, status, submitted_by_email, current_step_id, entity_ids, created_at, data")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (data) {
      setSubmissions(
        (data as any[]).map((s: any) => ({
          ...s,
          entity_ids: (s.entity_ids || {}) as Record<string, string>,
          data: (s.data || {}) as Record<string, unknown>,
        }))
      );
    }
    setSubmissionsLoading(false);
  }, [formId]);

  const handleSave = useCallback(async () => {
    if (!formDef) return;
    setSaving(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createClient();
    const { error } = await supabase
      .from("form_definitions")
      .update({
        name: formDef.name,
        slug: formDef.slug,
        description: formDef.description,
        status: formDef.status,
        mode: formDef.mode,
        contexts: formDef.contexts,
        steps: formDef.steps,
        settings: formDef.settings,
      })
      .eq("id", formId);

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Form saved");
    }
  }, [formDef, formId]);

  const updateStep = useCallback(
    (stepIndex: number, updates: Partial<FormStep>) => {
      setFormDef((prev) => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
        return { ...prev, steps: newSteps };
      });
    },
    []
  );

  const addStep = useCallback(() => {
    setFormDef((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: [...prev.steps, createEmptyStep()] };
    });
  }, []);

  const removeStep = useCallback((stepIndex: number) => {
    setFormDef((prev) => {
      if (!prev) return prev;
      const newSteps = prev.steps.filter((_, i) => i !== stepIndex);
      return { ...prev, steps: newSteps };
    });
    setSelectedStepIndex(null);
  }, []);

  const addField = useCallback((stepIndex: number) => {
    setFormDef((prev) => {
      if (!prev) return prev;
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        fields: [...newSteps[stepIndex].fields, createEmptyField()],
      };
      return { ...prev, steps: newSteps };
    });
  }, []);

  const updateField = useCallback(
    (stepIndex: number, fieldIndex: number, updates: Partial<FormFieldDefinition>) => {
      setFormDef((prev) => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        const newFields = [...newSteps[stepIndex].fields];
        newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
        newSteps[stepIndex] = { ...newSteps[stepIndex], fields: newFields };
        return { ...prev, steps: newSteps };
      });
    },
    []
  );

  const removeField = useCallback((stepIndex: number, fieldIndex: number) => {
    setFormDef((prev) => {
      if (!prev) return prev;
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        fields: newSteps[stepIndex].fields.filter((_, i) => i !== fieldIndex),
      };
      return { ...prev, steps: newSteps };
    });
  }, []);

  if (loading || !formDef) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const selectedStep = selectedStepIndex !== null ? formDef.steps[selectedStepIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/control-center/forms")}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{formDef.name}</h1>
            <p className="text-xs text-muted-foreground">/forms/{formDef.slug}</p>
          </div>
          <Badge variant={formDef.status === "published" ? "default" : "secondary"}>
            {formDef.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={formDef.status}
            onValueChange={(val) =>
              setFormDef((p) => (p ? { ...p, status: val as FormDefinition["status"] } : p))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} strokeWidth={1.5} className="mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="submissions" onClick={() => loadSubmissions()}>
            Submissions
          </TabsTrigger>
        </TabsList>

        {/* Steps Tab */}
        <TabsContent value="steps" className="mt-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Step list (left panel) */}
            <div className="col-span-4 space-y-3">
              {formDef.steps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedStepIndex(idx)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedStepIndex === idx
                      ? "border-foreground bg-accent"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">
                          {step.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {step.type === "router" ? "Router" : "Form"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {step.fields.length} field{step.fields.length !== 1 ? "s" : ""}
                        </span>
                        {step.show_when && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Conditional
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <Button variant="outline" className="w-full" onClick={addStep}>
                <Plus size={14} strokeWidth={1.5} className="mr-2" />
                Add Step
              </Button>
            </div>

            {/* Step editor (right panel) */}
            <div className="col-span-8">
              {selectedStep && selectedStepIndex !== null ? (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Step {selectedStepIndex + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeStep(selectedStepIndex)}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                          value={selectedStep.title}
                          onChange={(e) =>
                            updateStep(selectedStepIndex, { title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Subtitle</Label>
                        <Input
                          value={selectedStep.subtitle || ""}
                          onChange={(e) =>
                            updateStep(selectedStepIndex, { subtitle: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select
                          value={selectedStep.type}
                          onValueChange={(val) =>
                            updateStep(selectedStepIndex, { type: val as "router" | "form" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="form">Form</SelectItem>
                            <SelectItem value="router">Router</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Target Entity</Label>
                        <Select
                          value={selectedStep.target_entity || "none"}
                          onValueChange={(val) =>
                            updateStep(selectedStepIndex, {
                              target_entity: val === "none" ? null : val,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="opportunity">Deal</SelectItem>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="crm_contact">Contact</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Match On</Label>
                        <Input
                          value={selectedStep.match_on || ""}
                          onChange={(e) =>
                            updateStep(selectedStepIndex, {
                              match_on: e.target.value || null,
                            })
                          }
                          placeholder="e.g. email, address"
                        />
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                      <Label>Conditions (show_when)</Label>
                      {(selectedStep.show_when || []).map((cond, condIdx) => (
                        <div key={condIdx} className="flex items-center gap-2">
                          <Input
                            value={cond.field}
                            onChange={(e) => {
                              const newConds = [...(selectedStep.show_when || [])];
                              newConds[condIdx] = { ...newConds[condIdx], field: e.target.value };
                              updateStep(selectedStepIndex, { show_when: newConds });
                            }}
                            placeholder="field"
                            className="w-32"
                          />
                          <Select
                            value={cond.op}
                            onValueChange={(val) => {
                              const newConds = [...(selectedStep.show_when || [])];
                              newConds[condIdx] = { ...newConds[condIdx], op: val as ShowWhenCondition["op"] };
                              updateStep(selectedStepIndex, { show_when: newConds });
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eq">eq</SelectItem>
                              <SelectItem value="neq">neq</SelectItem>
                              <SelectItem value="in">in</SelectItem>
                              <SelectItem value="not_in">not_in</SelectItem>
                              <SelectItem value="exists">exists</SelectItem>
                              <SelectItem value="empty">empty</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={
                              Array.isArray(cond.value)
                                ? cond.value.join(", ")
                                : (cond.value as string) || ""
                            }
                            onChange={(e) => {
                              const newConds = [...(selectedStep.show_when || [])];
                              const rawVal = e.target.value;
                              const val =
                                cond.op === "in" || cond.op === "not_in"
                                  ? rawVal.split(",").map((v) => v.trim())
                                  : rawVal;
                              newConds[condIdx] = { ...newConds[condIdx], value: val };
                              updateStep(selectedStepIndex, { show_when: newConds });
                            }}
                            placeholder="value"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newConds = (selectedStep.show_when || []).filter(
                                (_, i) => i !== condIdx
                              );
                              updateStep(selectedStepIndex, {
                                show_when: newConds.length > 0 ? newConds : null,
                              });
                            }}
                          >
                            <Trash2 size={12} strokeWidth={1.5} />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newConds: ShowWhenCondition[] = [
                            ...(selectedStep.show_when || []),
                            { field: "", op: "eq", value: "" },
                          ];
                          updateStep(selectedStepIndex, { show_when: newConds });
                        }}
                      >
                        <Plus size={12} strokeWidth={1.5} className="mr-1" />
                        Add condition
                      </Button>
                    </div>

                    {/* Fields */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <Label>Fields</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addField(selectedStepIndex)}
                        >
                          <Plus size={12} strokeWidth={1.5} className="mr-1" />
                          Add Field
                        </Button>
                      </div>

                      {selectedStep.fields.map((field, fieldIdx) => (
                        <div
                          key={field.id}
                          className="rounded-lg border border-border overflow-hidden"
                        >
                          {/* Field header */}
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/50"
                            onClick={() =>
                              setExpandedFieldId(
                                expandedFieldId === field.id ? null : field.id
                              )
                            }
                          >
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {field.type}
                            </Badge>
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {field.label || field.id}
                            </span>
                            {field.required && (
                              <span className="text-[10px] text-destructive">Required</span>
                            )}
                            {field.visibility_mode !== "both" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {field.visibility_mode.replace("_only", "")}
                              </Badge>
                            )}
                            {expandedFieldId === field.id ? (
                              <ChevronUp size={14} strokeWidth={1.5} />
                            ) : (
                              <ChevronDown size={14} strokeWidth={1.5} />
                            )}
                          </button>

                          {/* Expanded field editor */}
                          {expandedFieldId === field.id && (
                            <div className="border-t border-border p-3 space-y-3 bg-muted/30">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Label</Label>
                                  <Input
                                    value={field.label || ""}
                                    onChange={(e) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        label: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Type</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(val) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        type: val as FormFieldDefinition["type"],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[
                                        "text", "email", "phone", "number", "currency",
                                        "date", "select", "multi_select", "textarea",
                                        "address", "file", "checkbox", "card-select",
                                      ].map((t) => (
                                        <SelectItem key={t} value={t}>
                                          {t}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Mapped Column</Label>
                                  <Input
                                    value={field.mapped_column || ""}
                                    onChange={(e) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        mapped_column: e.target.value || null,
                                      })
                                    }
                                    placeholder="DB column"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Width</Label>
                                  <Select
                                    value={field.width}
                                    onValueChange={(val) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        width: val as "full" | "half",
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="full">Full</SelectItem>
                                      <SelectItem value="half">Half</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Visibility</Label>
                                  <Select
                                    value={field.visibility_mode}
                                    onValueChange={(val) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        visibility_mode: val as FormFieldDefinition["visibility_mode"],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="both">Both</SelectItem>
                                      <SelectItem value="external_only">External</SelectItem>
                                      <SelectItem value="internal_only">Internal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Form Mode</Label>
                                  <Select
                                    value={field.visibility_form_mode}
                                    onValueChange={(val) =>
                                      updateField(selectedStepIndex, fieldIdx, {
                                        visibility_form_mode: val as FormFieldDefinition["visibility_form_mode"],
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="both">Both</SelectItem>
                                      <SelectItem value="create_only">Create Only</SelectItem>
                                      <SelectItem value="edit_only">Edit Only</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-end gap-2 pb-0.5">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={field.required || false}
                                      onCheckedChange={(checked) =>
                                        updateField(selectedStepIndex, fieldIdx, {
                                          required: !!checked,
                                        })
                                      }
                                    />
                                    <span className="text-xs">Required</span>
                                  </label>
                                </div>
                              </div>

                              {/* Card-select options editor */}
                              {field.type === "card-select" && (
                                <div className="space-y-2 pt-2 border-t border-border">
                                  <Label className="text-xs">Options</Label>
                                  {(field.options || []).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <IconPicker
                                        value={opt.icon || null}
                                        onChange={(icon) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], icon };
                                          updateField(selectedStepIndex, fieldIdx, {
                                            options: newOptions,
                                          });
                                        }}
                                      />
                                      <Input
                                        value={opt.value}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], value: e.target.value };
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                        placeholder="value"
                                        className="h-8 text-sm w-24"
                                      />
                                      <Input
                                        value={opt.label}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], label: e.target.value };
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                        placeholder="label"
                                        className="h-8 text-sm flex-1"
                                      />
                                      <Input
                                        value={opt.description || ""}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], description: e.target.value };
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                        placeholder="description"
                                        className="h-8 text-sm flex-1"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                          const newOptions = (field.options || []).filter(
                                            (_, i) => i !== optIdx
                                          );
                                          updateField(selectedStepIndex, fieldIdx, {
                                            options: newOptions,
                                          });
                                        }}
                                      >
                                        <Trash2 size={12} strokeWidth={1.5} />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions: FormFieldOption[] = [
                                        ...(field.options || []),
                                        { value: "", label: "", description: "", icon: "FileText" },
                                      ];
                                      updateField(selectedStepIndex, fieldIdx, {
                                        options: newOptions,
                                      });
                                    }}
                                  >
                                    <Plus size={12} strokeWidth={1.5} className="mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                              )}

                              {/* Select options editor */}
                              {(field.type === "select" || field.type === "multi_select") && (
                                <div className="space-y-2 pt-2 border-t border-border">
                                  <Label className="text-xs">Options</Label>
                                  {(field.options || []).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <Input
                                        value={opt.value}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], value: e.target.value };
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                        placeholder="value"
                                        className="h-8 text-sm w-32"
                                      />
                                      <Input
                                        value={opt.label}
                                        onChange={(e) => {
                                          const newOptions = [...(field.options || [])];
                                          newOptions[optIdx] = { ...newOptions[optIdx], label: e.target.value };
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                        placeholder="label"
                                        className="h-8 text-sm flex-1"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                          const newOptions = (field.options || []).filter(
                                            (_, i) => i !== optIdx
                                          );
                                          updateField(selectedStepIndex, fieldIdx, { options: newOptions });
                                        }}
                                      >
                                        <Trash2 size={12} strokeWidth={1.5} />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions: FormFieldOption[] = [
                                        ...(field.options || []),
                                        { value: "", label: "" },
                                      ];
                                      updateField(selectedStepIndex, fieldIdx, {
                                        options: newOptions,
                                      });
                                    }}
                                  >
                                    <Plus size={12} strokeWidth={1.5} className="mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                              )}

                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => removeField(selectedStepIndex, fieldIdx)}
                                >
                                  <Trash2 size={12} strokeWidth={1.5} className="mr-1" />
                                  Remove Field
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                  Select a step from the left panel to edit it.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewContext("external")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  previewContext === "external"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                External
              </button>
              <button
                type="button"
                onClick={() => setPreviewContext("internal")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  previewContext === "internal"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                Internal
              </button>
            </div>
            <div className="rounded-lg border border-border p-6 max-w-2xl">
              <FormEngine
                formId={formId}
                context={previewContext === "external" ? "page" : "drawer"}
              />
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="max-w-2xl">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Form Name</Label>
                  <Input
                    value={formDef.name}
                    onChange={(e) =>
                      setFormDef((p) => (p ? { ...p, name: e.target.value } : p))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    value={formDef.slug}
                    onChange={(e) =>
                      setFormDef((p) => (p ? { ...p, slug: e.target.value } : p))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={formDef.description || ""}
                  onChange={(e) =>
                    setFormDef((p) => (p ? { ...p, description: e.target.value } : p))
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mode</Label>
                  <Select
                    value={formDef.mode}
                    onValueChange={(val) =>
                      setFormDef((p) =>
                        p ? { ...p, mode: val as FormDefinition["mode"] } : p
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Create & Edit</SelectItem>
                      <SelectItem value="create_only">Create Only</SelectItem>
                      <SelectItem value="edit_only">Edit Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contexts</Label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formDef.contexts.includes("external")}
                        onCheckedChange={(checked) =>
                          setFormDef((p) => {
                            if (!p) return p;
                            const contexts = checked
                              ? [...p.contexts, "external" as const]
                              : p.contexts.filter((c) => c !== "external");
                            return { ...p, contexts };
                          })
                        }
                      />
                      <span className="text-sm">External</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formDef.contexts.includes("internal")}
                        onCheckedChange={(checked) =>
                          setFormDef((p) => {
                            if (!p) return p;
                            const contexts = checked
                              ? [...p.contexts, "internal" as const]
                              : p.contexts.filter((c) => c !== "internal");
                            return { ...p, contexts };
                          })
                        }
                      />
                      <span className="text-sm">Internal</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Success Message</Label>
                <Textarea
                  value={formDef.settings.success_message || ""}
                  onChange={(e) =>
                    setFormDef((p) =>
                      p
                        ? {
                            ...p,
                            settings: { ...p.settings, success_message: e.target.value },
                          }
                        : p
                    )
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-12">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-12">
                      No submissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-sm">
                        {sub.submitted_by_email || (sub.data.email as string) || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === "submitted"
                              ? "default"
                              : sub.status === "partial"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.current_step_id || "Complete"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
