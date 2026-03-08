"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Check,
  AlertTriangle,
  Download,
  ExternalLink,
  Pencil,
  ChevronRight,
  Loader2,
  Search,
  ArrowLeft,
  Building2,
  User,
  Briefcase,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTemplatesForRecord,
  resolveTemplateData,
  searchRecords,
  type ResolvedField,
  type RecordOption,
} from "./actions";

const RECORD_TYPES = [
  { value: "loan" as const, label: "Loan", icon: Home },
  { value: "contact" as const, label: "Contact", icon: User },
  { value: "company" as const, label: "Company", icon: Building2 },
  { value: "deal" as const, label: "Deal", icon: Briefcase },
];

const TYPE_COLORS: Record<string, string> = {
  nda: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  broker_agreement: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  term_sheet: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  loan_agreement: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  investor_agreement: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  other: "bg-gray-100 text-gray-800",
};

const TYPE_LABELS: Record<string, string> = {
  nda: "NDA",
  broker_agreement: "Broker Agreement",
  term_sheet: "Term Sheet",
  loan_agreement: "Loan Agreement",
  investor_agreement: "Investor Agreement",
  other: "Other",
};

interface Template {
  id: string;
  name: string;
  template_type: string;
  record_type: string;
  description: string | null;
  merge_fields: Array<{ key: string; label: string; source: string; column: string; format?: string | null }>;
  version: number;
  requires_signature: boolean;
}

type Step = "record_type" | "record_select" | "template" | "preview" | "format" | "result";

export function CreateDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("record_type");

  // Record selection state
  const [recordType, setRecordType] = useState<"loan" | "contact" | "deal" | "company">("loan");
  const [recordSearch, setRecordSearch] = useState("");
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordOption | null>(null);

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Preview state
  const [resolvedFields, setResolvedFields] = useState<ResolvedField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Format & result state
  const [fileFormat, setFileFormat] = useState<"docx" | "pdf">("docx");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    documentId: string;
    fileName: string;
    blob: Blob;
  } | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("record_type");
      setRecordType("loan");
      setRecordSearch("");
      setRecords([]);
      setSelectedRecord(null);
      setSelectedTemplate(null);
      setResolvedFields([]);
      setResult(null);
    }
  }, [open]);

  // Search records when query or type changes
  const doSearch = useCallback(async (type: typeof recordType, query: string) => {
    setLoadingRecords(true);
    const { records: data } = await searchRecords(type, query);
    setRecords(data);
    setLoadingRecords(false);
  }, []);

  useEffect(() => {
    if (step === "record_select") {
      const timer = setTimeout(() => doSearch(recordType, recordSearch), 300);
      return () => clearTimeout(timer);
    }
  }, [step, recordType, recordSearch, doSearch]);

  function handleRecordTypeSelect(type: typeof recordType) {
    setRecordType(type);
    setRecordSearch("");
    setSelectedRecord(null);
    setStep("record_select");
  }

  async function handleRecordSelect(record: RecordOption) {
    setSelectedRecord(record);
    setStep("template");
    setLoadingTemplates(true);
    const { templates: data } = await fetchTemplatesForRecord(recordType);
    setTemplates(data as Template[]);
    setLoadingTemplates(false);
  }

  async function handleSelectTemplate(template: Template) {
    setSelectedTemplate(template);
    setStep("preview");
    setLoadingFields(true);
    const { fields } = await resolveTemplateData(template.id, selectedRecord!.id);
    setResolvedFields(fields);
    setLoadingFields(false);
    if (template.template_type === "term_sheet") {
      setFileFormat("pdf");
    } else {
      setFileFormat("docx");
    }
  }

  async function handleGenerate() {
    if (!selectedTemplate || !selectedRecord) return;
    setGenerating(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Not authenticated");
        setGenerating(false);
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey ?? "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            template_id: selectedTemplate.id,
            record_id: selectedRecord.id,
            format: fileFormat,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const status = res.status;
        const detail = err?.error || err?.message || res.statusText;
        const message =
          status === 401
            ? `Authentication failed (${status}): session may have expired. Please reload and try again.`
            : status === 403
              ? `Access denied (${status}): admin role required to generate documents.`
              : status === 404
                ? `Not found (${status}): ${detail || "template or record not found"}`
                : status === 502
                  ? `Google Drive error (${status}): ${detail || "could not download or upload file"}`
                  : `Generation failed (${status}): ${detail || "unknown error"}`;
        toast.error(message);
        setGenerating(false);
        return;
      }

      const documentId = res.headers.get("X-Document-Id") ?? "";
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const fileNameMatch = disposition.match(/filename="(.+)"/);
      const fileName = fileNameMatch?.[1] ?? `document.${fileFormat}`;

      const blob = await res.blob();
      setResult({ documentId, fileName, blob });
      setStep("result");
      toast.success(`Document generated: ${fileName}`);
    } catch (err) {
      console.error("Generate document error:", err);
      const message =
        err instanceof TypeError && err.message.includes("fetch")
          ? "Network error: could not reach the document generation service. Check your connection."
          : `Failed to generate document: ${err instanceof Error ? err.message : "unknown error"}`;
      toast.error(message);
    }

    setGenerating(false);
  }

  function handleDownload() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const missingFields = resolvedFields.filter((f) => f.value === null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Create Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            {step === "record_type" && "Select the record type to generate a document for."}
            {step === "record_select" && `Search and select a ${recordType}.`}
            {step === "template" && `Select a template for ${selectedRecord?.label}.`}
            {step === "preview" && "Review the data that will be merged into the document."}
            {step === "format" && "Choose the output format."}
            {step === "result" && "Document generated successfully."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Record Type */}
        {step === "record_type" && (
          <div className="grid grid-cols-2 gap-3">
            {RECORD_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleRecordTypeSelect(value)}
                className="flex items-center gap-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left cursor-pointer bg-transparent"
              >
                <Icon size={18} className="text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Record Select */}
        {step === "record_select" && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${recordType}s...`}
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {loadingRecords ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No {recordType}s found.
                </p>
              ) : (
                records.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRecordSelect(r)}
                    className="w-full text-left border rounded-md p-3 hover:bg-muted/50 transition-colors flex items-center gap-3 cursor-pointer bg-transparent"
                  >
                    <span className="text-sm font-medium truncate flex-1">{r.label}</span>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => setStep("record_type")}>
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Select Template */}
        {step === "template" && (
          <div className="space-y-3">
            {loadingTemplates ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active templates found for this record type.
              </p>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="w-full text-left border rounded-md p-3 hover:bg-muted/50 transition-colors flex items-center gap-3 cursor-pointer bg-transparent"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{t.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${TYPE_COLORS[t.template_type] ?? TYPE_COLORS.other}`}
                      >
                        {TYPE_LABELS[t.template_type] ?? t.template_type}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      v{t.version} · {t.merge_fields.length} fields
                      {t.requires_signature ? " · Requires signature" : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              ))
            )}

            <Button variant="outline" size="sm" onClick={() => setStep("record_select")}>
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
          </div>
        )}

        {/* Step 4: Preview Data */}
        {step === "preview" && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={TYPE_COLORS[selectedTemplate.template_type] ?? TYPE_COLORS.other}
              >
                {TYPE_LABELS[selectedTemplate.template_type]}
              </Badge>
              <span className="text-sm font-medium">{selectedTemplate.name}</span>
            </div>

            {loadingFields ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <>
                {missingFields.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {missingFields.length} field{missingFields.length !== 1 ? "s" : ""} missing — will be blank in the document.
                    </p>
                  </div>
                )}

                <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Field</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedFields.map((f) => (
                        <tr key={f.key} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{f.label}</td>
                          <td className="px-3 py-2">
                            {f.value !== null ? (
                              <span className="font-medium">{f.value}</span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle size={10} />
                                Missing
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("template")}>
                Back
              </Button>
              <Button size="sm" onClick={() => setStep("format")} disabled={loadingFields}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Format Selection */}
        {step === "format" && selectedTemplate && (
          <div className="space-y-4">
            <RadioGroup
              value={fileFormat}
              onValueChange={(v) => setFileFormat(v as "docx" | "pdf")}
              className="space-y-2"
            >
              <div className="flex items-center gap-3 border rounded-md p-3">
                <RadioGroupItem value="docx" id="create-docx" />
                <Label htmlFor="create-docx" className="flex-1 cursor-pointer">
                  <span className="text-sm font-medium">DOCX (Editable)</span>
                  <p className="text-xs text-muted-foreground">
                    Can be edited in the portal before sending.
                  </p>
                </Label>
              </div>
              <div className="flex items-center gap-3 border rounded-md p-3">
                <RadioGroupItem value="pdf" id="create-pdf" />
                <Label htmlFor="create-pdf" className="flex-1 cursor-pointer">
                  <span className="text-sm font-medium">PDF (Locked)</span>
                  <p className="text-xs text-muted-foreground">
                    Finalized document, ready for signature.
                  </p>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button size="sm" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Document"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Result */}
        {step === "result" && result && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">{result.fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Document generated successfully
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleDownload} className="w-full">
                <Download size={14} className="mr-1.5" />
                Download
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  window.location.href = `/admin/documents/editor/${result.documentId}`;
                }}
              >
                <Pencil size={14} className="mr-1.5" />
                Edit in Portal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
