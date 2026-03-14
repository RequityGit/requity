"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_COMPANY_TYPES, CRM_COMPANY_SUBTYPES, COMPANY_TYPE_COLORS, US_STATES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { addCompanyAction } from "@/app/(authenticated)/(admin)/companies/actions";
import { Building2, X as XIcon, Sparkles, Loader2 } from "lucide-react";
import { formatPhoneInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface AddCompanyDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCompanyDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddCompanyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    company_type: "",
    company_subtype: "",
    phone: "",
    email: "",
    website: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
    source: "",
    initial_note: "",
  });

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
    if (errors.company_type) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.company_type;
        return next;
      });
    }
  }

  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function resetForm() {
    setForm({
      name: "",
      company_type: "",
      company_subtype: "",
      phone: "",
      email: "",
      website: "",
      address_line1: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
      source: "",
      initial_note: "",
    });
    setSelectedTypes([]);
    setErrors({});
    setEnriching(false);
  }

  async function enrichFromWebsite() {
    const trimmed = form.website.trim();
    if (!trimmed || enriching) return;
    setEnriching(true);

    try {
      const res = await fetch("/api/companies/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, name: form.name || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast({
          title: "Could not enrich",
          description: err?.error || "Failed to fetch website data",
          variant: "destructive",
        });
        return;
      }
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        name: prev.name || data.name || "",
        notes: prev.notes || data.description || "",
        phone: prev.phone || (data.phone ? formatPhoneInput(data.phone) : ""),
        email: prev.email || data.email || "",
        address_line1: prev.address_line1 || data.address_line1 || "",
        city: prev.city || data.city || "",
        state: prev.state || data.state || "",
        zip: prev.zip || data.zip || "",
      }));

      if (data.company_types?.length) {
        setSelectedTypes((prev) =>
          prev.length > 0 ? prev : data.company_types
        );
      }
    } catch {
      toast({
        title: "Could not enrich",
        description: "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setEnriching(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Required";
    if (selectedTypes.length === 0) newErrors.company_type = "Select at least one type";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await addCompanyAction({
        name: form.name,
        company_type: selectedTypes[0] || "other",
        company_types: selectedTypes,
        company_subtype: form.company_subtype || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        notes: form.notes || null,
        source: form.source || null,
        initial_note: form.initial_note || null,
      });

      if ("error" in result && result.error) {
        toast({
          title: "Error adding company",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Company added successfully" });
        setOpen(false);
        resetForm();
        router.push(`/companies/${result.company_number}`);
      }
    } catch (err: unknown) {
      toast({
        title: "Error adding company",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Building2 className="h-4 w-4" />
              Add Company
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Website + Enrich button */}
          <div className="space-y-2">
            <Label>Website</Label>
            <div className="flex gap-2">
              <Input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="Enter website to auto-fill details..."
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!form.website.trim() || enriching}
                onClick={enrichFromWebsite}
                className="shrink-0 gap-1.5"
              >
                {enriching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {enriching ? "Enriching..." : "Enrich"}
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>
                Company Name <span className="text-red-500">*</span>
              </Label>
              {enriching && !form.name && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={enriching ? "Detecting company name..." : "Company name"}
              className={cn(enriching && !form.name && "animate-pulse")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type (multi-select) */}
          <div className="space-y-2">
            <Label>
              Company Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {CRM_COMPANY_TYPES.map((t) => {
                const selected = selectedTypes.includes(t.value);
                const colors = COMPANY_TYPE_COLORS[t.value] ?? "";
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleType(t.value)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                      selected
                        ? colors
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {t.label}
                    {selected && <XIcon className="ml-1 h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            {errors.company_type && (
              <p className="text-xs text-red-500">{errors.company_type}</p>
            )}

            {/* Lender subtype */}
            {selectedTypes.includes("lender") && (
              <div className="mt-2 pl-4 border-l-2 border-blue-200">
                <Label className="text-xs">Lender Subtype</Label>
                <Select
                  value={form.company_subtype}
                  onValueChange={(v) => updateField("company_subtype", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subtype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_COMPANY_SUBTYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", formatPhoneInput(e.target.value))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Address
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Street Address</Label>
                <AddressAutocomplete
                  value={form.address_line1}
                  onChange={(v) => updateField("address_line1", v)}
                  onAddressSelect={(addr) => {
                    updateField("address_line1", addr.address_line1);
                    updateField("city", addr.city);
                    updateField("state", addr.state);
                    updateField("zip", addr.zip);
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={form.state}
                    onValueChange={(v) => updateField("state", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State..." />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={form.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Description</Label>
              {enriching && !form.notes && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder={
                enriching
                  ? "Generating description from website..."
                  : "Description of this company..."
              }
              className={cn(
                enriching && !form.notes && "animate-pulse"
              )}
            />
          </div>

          {/* Initial Note */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.initial_note}
              onChange={(e) => updateField("initial_note", e.target.value)}
              rows={2}
              placeholder="Add an initial note (optional). This will appear in the Notes tab."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
