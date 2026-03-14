"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  CRM_RELATIONSHIP_TYPES,
  RELATIONSHIP_COLORS,
  CRM_CONTACT_SOURCES,
  CRM_LIFECYCLE_STAGES,
  CRM_LENDER_DIRECTIONS,
  CRM_VENDOR_TYPES,
  CRM_COMPANY_TYPES,
  US_STATES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, X, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneInput } from "@/lib/format";
import { buildContactSchema } from "@/lib/schemas/contact";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import type { Database } from "@/lib/supabase/types";

type CompanyType = Database["public"]["Enums"]["company_type_enum"];
type CrmContactType = Database["public"]["Enums"]["crm_contact_type"];
type CrmContactSource = Database["public"]["Enums"]["crm_contact_source"];
type CrmContactStatus = Database["public"]["Enums"]["crm_contact_status"];
type LifecycleStage = Database["public"]["Enums"]["lifecycle_stage_enum"];
type RelationshipType = Database["public"]["Enums"]["relationship_type_enum"];
type LenderDirection = Database["public"]["Enums"]["lender_direction_enum"];
type VendorTypeEnum = Database["public"]["Enums"]["vendor_type_enum"];

interface TeamMember {
  id: string;
  full_name: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface AddContactDialogProps {
  teamMembers: TeamMember[];
  currentUserId: string;
  preselectedCompanyId?: string;
  preselectedCompanyName?: string;
  trigger?: React.ReactNode;
  onSuccess?: (contactId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddContactDialog({
  teamMembers,
  currentUserId,
  preselectedCompanyId,
  preselectedCompanyName,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddContactDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Company search state
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyType, setNewCompanyType] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_id: (preselectedCompanyId ?? "") as string,
    company_name: preselectedCompanyName ?? "",
    source: "",
    lifecycle_stage: "active",
    assigned_to: currentUserId,
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    next_follow_up_date: "",
    notes: "",
  });

  // Relationship types state
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(
    []
  );
  const [lenderDirection, setLenderDirection] = useState("");
  const [vendorType, setVendorType] = useState("");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactSchema = buildContactSchema({
    selectedRelationships,
    email: form.email,
    phone: form.phone,
  });

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

  function toggleRelationship(type: string) {
    setSelectedRelationships((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    if (errors.relationships) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.relationships;
        return next;
      });
    }
  }

  // Fetch companies for search
  const fetchCompanies = useCallback(async (q: string) => {
    const supabase = createClient();
    let query = supabase
      .from("companies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .limit(10);
    if (q.trim()) {
      query = query.ilike("name", `%${q}%`);
    }
    const { data } = await query;
    setCompanies(data ?? []);
  }, []);

  useEffect(() => {
    if (open) {
      fetchCompanies("");
    }
  }, [open, fetchCompanies]);

  useEffect(() => {
    if (companySearch.trim()) {
      const timer = setTimeout(() => fetchCompanies(companySearch), 300);
      return () => clearTimeout(timer);
    } else {
      fetchCompanies("");
    }
  }, [companySearch, fetchCompanies]);

  function resetForm() {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_id: preselectedCompanyId ?? "",
      company_name: preselectedCompanyName ?? "",
      source: "",
      lifecycle_stage: "active",
      assigned_to: currentUserId,
      address_line1: "",
      city: "",
      state: "",
      zip: "",
      next_follow_up_date: "",
      notes: "",
    });
    setSelectedRelationships([]);
    setLenderDirection("");
    setVendorType("");
    setErrors({});
    setShowNewCompanyForm(false);
    setNewCompanyName("");
    setNewCompanyType("");
    setNewCompanyWebsite("");
    setNewCompanyDescription("");
    setCompanySearch("");
  }

  function validate(): boolean {
    const result = contactSchema.safeParse({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // If creating a new company, do that first
      let companyId = form.company_id || null;
      if (showNewCompanyForm && newCompanyName.trim() && newCompanyType) {
        const companyInsert: Record<string, unknown> = {
          name: newCompanyName.trim(),
          company_type: newCompanyType as CompanyType,
        };
        if (newCompanyWebsite.trim()) companyInsert.website = newCompanyWebsite.trim();
        if (newCompanyDescription.trim()) companyInsert.notes = newCompanyDescription.trim();

        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert(companyInsert as never)
          .select("id")
          .single();
        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      // Insert the contact — set legacy fields to defaults
      const { data: newContact, error: contactError } = await supabase
        .from("crm_contacts")
        .insert({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company_id: companyId,
          company_name: form.company_name || null,
          contact_type: "other" as CrmContactType,
          contact_types: selectedRelationships.length > 0 ? selectedRelationships : ["other"],
          source: (form.source || null) as CrmContactSource | null,
          status: "active" as CrmContactStatus,
          lifecycle_stage: form.lifecycle_stage as LifecycleStage,
          assigned_to: form.assigned_to || null,
          address_line1: form.address_line1 || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          next_follow_up_date: form.next_follow_up_date || null,
          notes: form.notes || null,
        })
        .select("id, contact_number")
        .single();

      if (contactError) throw contactError;

      // Insert relationship types
      const relationshipInserts = selectedRelationships.map((rt) => ({
        contact_id: newContact.id,
        relationship_type: rt as RelationshipType,
        lender_direction:
          rt === "lender" && lenderDirection ? (lenderDirection as LenderDirection) : null,
        vendor_type:
          rt === "vendor" && vendorType ? (vendorType as VendorTypeEnum) : null,
        is_active: true,
      }));

      if (relationshipInserts.length > 0) {
        const { error: relError } = await supabase
          .from("contact_relationship_types")
          .insert(relationshipInserts);
        if (relError) throw relError;
      }

      toast({ title: "Contact added successfully" });
      setOpen(false);
      resetForm();
      if (onSuccess) {
        onSuccess(newContact.id);
      } else {
        router.push(`/contacts/${newContact.contact_number}`);
      }
    } catch (err: unknown) {
      toast({
        title: "Error adding contact",
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
          {trigger ?? (
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
              />
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
              />
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Relationship Type (multi-select) */}
          <div className="space-y-2">
            <Label>
              Relationship Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {CRM_RELATIONSHIP_TYPES.map((rt) => {
                const selected = selectedRelationships.includes(rt.value);
                const colors = RELATIONSHIP_COLORS[rt.value] ?? "";
                return (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => toggleRelationship(rt.value)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                      selected
                        ? colors
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {rt.label}
                    {selected && <X className="ml-1 h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            {errors.relationships && (
              <p className="text-xs text-red-500">{errors.relationships}</p>
            )}

            {/* Lender sub-dropdown */}
            {selectedRelationships.includes("lender") && (
              <div className="mt-2 pl-4 border-l-2 border-purple-200">
                <Label className="text-xs">Lender Direction</Label>
                <Select
                  value={lenderDirection}
                  onValueChange={setLenderDirection}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select direction..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_LENDER_DIRECTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vendor sub-dropdown */}
            {selectedRelationships.includes("vendor") && (
              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                <Label className="text-xs">Vendor Type</Label>
                <Select value={vendorType} onValueChange={setVendorType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select vendor type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_VENDOR_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
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
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", formatPhoneInput(e.target.value))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          {errors.contact_method && (
            <p className="text-xs text-red-500">{errors.contact_method}</p>
          )}

          {/* Company (Salesforce-style lookup) */}
          <div className="space-y-2">
            <Label>Company</Label>
            {form.company_id ? (
              <div className="flex h-9 items-center rounded-md border bg-muted/50 pl-2.5 pr-1">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="ml-2 flex-1 truncate text-sm font-medium">
                  {companies.find((c) => c.id === form.company_id)?.name ||
                    form.company_name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateField("company_id", "");
                    updateField("company_name", "");
                  }}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : showNewCompanyForm ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Create New Company</p>
                  <button
                    type="button"
                    onClick={() => setShowNewCompanyForm(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newCompanyType} onValueChange={setNewCompanyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_COMPANY_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Website</Label>
                  <Input
                    value={newCompanyWebsite}
                    onChange={(e) => setNewCompanyWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                    placeholder="Brief description of the company"
                    rows={2}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowCompanyDropdown(false), 200);
                  }}
                  placeholder="Search companies..."
                />
                {showCompanyDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          updateField("company_id", c.id);
                          updateField("company_name", c.name);
                          setCompanySearch("");
                          setShowCompanyDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{c.name}</span>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-accent flex items-center gap-2 border-t transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowNewCompanyForm(true);
                        setNewCompanyName(companySearch);
                        setShowCompanyDropdown(false);
                        setCompanySearch("");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create New Company
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Source & Lifecycle Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => updateField("source", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {CRM_CONTACT_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lifecycle Stage</Label>
              <Select
                value={form.lifecycle_stage}
                onValueChange={(v) => updateField("lifecycle_stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_LIFECYCLE_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment & Follow-Up */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(v) => updateField("assigned_to", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Follow-Up</Label>
              <DatePicker
                value={form.next_follow_up_date}
                onChange={(value) =>
                  updateField("next_follow_up_date", value)
                }
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
            <Label>Description</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Description of this contact..."
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
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
