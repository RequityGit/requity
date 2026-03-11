"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  ChevronsUpDown,
  Check,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateChecklist,
  submitForApproval,
  resubmitApproval,
  saveApprovalFieldAction,
  searchContactsForApproval,
} from "@/app/(authenticated)/admin/operations/approvals/actions";
import type { ApprovalEntityType, ChecklistResult } from "@/lib/approvals/types";

interface SubmitForApprovalDialogProps {
  entityType: ApprovalEntityType;
  entityId: string;
  entityData: Record<string, unknown>;
  dealSnapshot: Record<string, unknown>;
  /** If provided, this is a resubmission */
  existingApprovalId?: string;
  trigger?: React.ReactNode;
}

export function SubmitForApprovalDialog({
  entityType,
  entityId,
  entityData,
  dealSnapshot,
  existingApprovalId,
  trigger,
}: SubmitForApprovalDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"validating" | "results" | "submit">("validating");
  const [checklistResults, setChecklistResults] = useState<ChecklistResult[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline editing state
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [currentEntityData, setCurrentEntityData] = useState<Record<string, unknown>>({});

  // Contact picker state
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);

  const failedResults = useMemo(
    () => checklistResults.filter((r) => !r.passed),
    [checklistResults]
  );

  const hasEdits = useMemo(
    () => Object.keys(fieldValues).length > 0,
    [fieldValues]
  );

  const updateFieldValue = useCallback((key: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setStep("validating");
      setChecklistResults([]);
      setAllPassed(false);
      setSubmissionNotes("");
      setFieldValues({});
      setCurrentEntityData({ ...entityData });

      // Fetch contacts for borrower picker
      searchContactsForApproval("").then((res) => {
        if (res.contacts) setContacts(res.contacts);
      });

      // Run validation
      const result = await validateChecklist(entityType, entityData);
      setChecklistResults(result.results);
      setAllPassed(result.passed);
      setStep("results");
    }
  }

  async function handleSaveAndRevalidate() {
    if (!hasEdits) return;
    setSaving(true);

    // Save each changed field
    const saveErrors: string[] = [];
    for (const [key, value] of Object.entries(fieldValues)) {
      const result = await saveApprovalFieldAction(entityId, entityType, key, value);
      if (result.error) {
        saveErrors.push(`${key}: ${result.error}`);
      }
    }

    if (saveErrors.length > 0) {
      toast({
        title: "Some fields failed to save",
        description: saveErrors.join("; "),
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Merge saved values into entity data for re-validation
    const updatedData = { ...currentEntityData, ...fieldValues };

    // For borrower picker, also set borrower_name from contacts
    if (fieldValues.borrower_id || fieldValues.primary_contact_id) {
      const contactId = (fieldValues.borrower_id || fieldValues.primary_contact_id) as string;
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        updatedData.borrower_name = contact.name;
        updatedData.borrower_id = contactId;
        updatedData.primary_contact_id = contactId;
      }
    }

    setCurrentEntityData(updatedData);

    // Re-validate with updated data
    const result = await validateChecklist(entityType, updatedData);
    setChecklistResults(result.results);
    setAllPassed(result.passed);
    setFieldValues({});
    setSaving(false);

    if (result.passed) {
      toast({
        title: "All checks passed",
        description: "You can now submit for approval.",
      });
    }
  }

  async function handleSubmit() {
    setLoading(true);

    // Merge any saved values into the deal snapshot
    const updatedSnapshot = { ...dealSnapshot, ...currentEntityData };

    let result;
    if (existingApprovalId) {
      result = await resubmitApproval({
        approvalId: existingApprovalId,
        dealSnapshot: updatedSnapshot,
        checklistResults,
        submissionNotes: submissionNotes || undefined,
      });
    } else {
      result = await submitForApproval({
        entityType,
        entityId,
        submissionNotes: submissionNotes || undefined,
        dealSnapshot: updatedSnapshot,
        checklistResults,
      });
    }

    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: existingApprovalId ? "Resubmitted" : "Submitted for Approval",
        description: "The approval request has been sent to the assigned approver.",
      });
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
            {existingApprovalId ? "Resubmit for Approval" : "Submit for Approval"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingApprovalId ? "Resubmit for Approval" : "Submit for Approval"}
          </DialogTitle>
        </DialogHeader>

        {step === "validating" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Running validation checklist...</span>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-2">
            {/* Checklist Results */}
            {checklistResults.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  Validation Checklist
                  {allPassed ? (
                    <span className="text-green-600 text-xs font-normal">All passed</span>
                  ) : (
                    <span className="text-red-600 text-xs font-normal">
                      {failedResults.length} item(s) need attention
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {checklistResults.map((item, i) => (
                    <div key={i}>
                      {item.passed ? (
                        /* Passed items: green row with check icon */
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 dark:bg-green-950/30">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-green-800 dark:text-green-300">{item.label}</span>
                        </div>
                      ) : (
                        /* Failed items: inline editor */
                        <div className="px-3 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span className="text-amber-800 dark:text-amber-300 font-medium">
                              {item.label}
                            </span>
                            {item.reason && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                                {item.reason}
                              </span>
                            )}
                          </div>
                          <div className="pl-6">
                            <InlineFieldEditor
                              item={item}
                              value={fieldValues[item.field]}
                              onChange={(val) => updateFieldValue(item.field, val)}
                              contacts={contacts}
                              contactPopoverOpen={contactPopoverOpen}
                              setContactPopoverOpen={setContactPopoverOpen}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allPassed && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Submission Notes <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add context for the approver..."
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Send className="h-4 w-4" />
                    {existingApprovalId ? "Resubmit" : "Submit"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {!allPassed && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAndRevalidate}
                  disabled={saving || !hasEdits}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save & Re-validate"}
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Inline field editor rendered for each failed checklist item
// ---------------------------------------------------------------------------

function InlineFieldEditor({
  item,
  value,
  onChange,
  contacts,
  contactPopoverOpen,
  setContactPopoverOpen,
}: {
  item: ChecklistResult;
  value: unknown;
  onChange: (val: unknown) => void;
  contacts: { id: string; name: string }[];
  contactPopoverOpen: boolean;
  setContactPopoverOpen: (open: boolean) => void;
}) {
  const [contactSearch, setContactSearch] = useState("");

  // Special: borrower picker
  if (item.is_special === "borrower_picker") {
    const selectedContact = contacts.find((c) => c.id === value);
    const filtered = contactSearch
      ? contacts.filter((c) =>
          c.name.toLowerCase().includes(contactSearch.toLowerCase())
        )
      : contacts;

    return (
      <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={contactPopoverOpen}
            className="w-full justify-between font-normal h-9 text-sm"
          >
            <span className="truncate">
              {selectedContact ? selectedContact.name : "Select borrower..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No contacts found.
              </div>
            ) : (
              filtered.map((contact) => (
                <button
                  key={contact.id}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === contact.id && "bg-accent"
                  )}
                  onClick={() => {
                    onChange(contact.id);
                    setContactSearch("");
                    setContactPopoverOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === contact.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {contact.name}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Special: loan amount (currency input)
  if (item.is_special === "loan_amount") {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="pl-7 text-right num h-9"
          placeholder="0"
        />
      </div>
    );
  }

  // Standard field types from field_configurations
  switch (item.field_type) {
    case "currency":
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="pl-7 text-right num h-9"
            placeholder="0"
          />
        </div>
      );

    case "percent":
      return (
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="pr-7 text-right num h-9"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
      );

    case "number":
      return (
        <Input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="num h-9"
          placeholder="0"
        />
      );

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label className="text-xs text-muted-foreground">
            {value ? "Yes" : "No"}
          </Label>
        </div>
      );

    case "select":
      return (
        <Select
          value={value != null ? String(value) : ""}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(item.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "date":
      return (
        <DatePicker
          value={value != null ? String(value) : ""}
          onChange={(val) => onChange(val || null)}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-9"
          placeholder={item.label}
        />
      );
  }
}
