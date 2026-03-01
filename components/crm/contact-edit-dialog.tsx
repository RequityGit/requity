"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CRM_CONTACT_SOURCES,
  CRM_LIFECYCLE_STAGES,
  CRM_COMPANY_TYPES,
  US_STATES,
} from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, X, Plus } from "lucide-react";
import { DeleteContactButton } from "@/components/crm/delete-contact-button";
import type { CrmContact } from "@/lib/supabase/types";

interface TeamMember {
  id: string;
  full_name: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ContactEditDialogProps {
  contact: CrmContact;
  teamMembers: TeamMember[];
  isSuperAdmin?: boolean;
}

export function ContactEditDialog({
  contact,
  teamMembers,
  isSuperAdmin = false,
}: ContactEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPastConfirm, setShowPastConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Company search state
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyType, setNewCompanyType] = useState("");

  const [form, setForm] = useState({
    first_name: contact.first_name ?? "",
    last_name: contact.last_name ?? "",
    email: contact.email || "",
    phone: contact.phone || "",
    company_id: contact.company_id || "",
    company_name: contact.company_name || "",
    source: contact.source || "",
    lifecycle_stage: contact.lifecycle_stage || "uncontacted",
    assigned_to: contact.assigned_to || "",
    address_line1: contact.address_line1 || "",
    city: contact.city || "",
    state: contact.state || "",
    zip: contact.zip || "",
    next_follow_up_date: contact.next_follow_up_date || "",
    notes: contact.notes || "",
    marketing_consent: contact.marketing_consent ?? false,
    dnc: contact.dnc ?? false,
    dnc_reason: contact.dnc_reason || "",
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Fetch companies
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
    if (open) fetchCompanies("");
  }, [open, fetchCompanies]);

  useEffect(() => {
    if (companySearch.trim()) {
      const timer = setTimeout(() => fetchCompanies(companySearch), 300);
      return () => clearTimeout(timer);
    } else {
      fetchCompanies("");
    }
  }, [companySearch, fetchCompanies]);

  // Handle lifecycle stage change with confirmation for "past"
  function handleLifecycleChange(value: string) {
    if (value === "past" && form.lifecycle_stage !== "past") {
      setShowPastConfirm(true);
    } else {
      updateField("lifecycle_stage", value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // If creating a new company, do that first
      let companyId = form.company_id || null;
      if (showNewCompanyForm && newCompanyName.trim() && newCompanyType) {
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: newCompanyName.trim(),
            company_type: newCompanyType as any,
          })
          .select("id")
          .single();
        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      const updateData: Record<string, any> = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        company_id: companyId,
        company_name: form.company_name || null,
        source: (form.source || null) as any,
        lifecycle_stage: form.lifecycle_stage as any,
        assigned_to: form.assigned_to || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        next_follow_up_date: form.next_follow_up_date || null,
        notes: form.notes || null,
        marketing_consent: form.marketing_consent,
        dnc: form.dnc,
        dnc_reason: form.dnc ? form.dnc_reason || null : null,
      };

      // If lifecycle stage changed, update lifecycle_updated_at
      if (form.lifecycle_stage !== (contact.lifecycle_stage || "")) {
        updateData.lifecycle_updated_at = new Date().toISOString();
      }

      // If marketing consent toggled on, record timestamp
      if (form.marketing_consent && !contact.marketing_consent) {
        updateData.consent_granted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("crm_contacts")
        .update(updateData)
        .eq("id", contact.id);

      if (error) throw error;

      toast({ title: "Contact updated" });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error updating contact",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  required
                />
              </div>
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
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            {/* Company (searchable dropdown) */}
            <div className="space-y-2">
              <Label>Company</Label>
              {form.company_id ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    {companies.find((c) => c.id === form.company_id)?.name ||
                      form.company_name}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateField("company_id", "");
                      updateField("company_name", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : showNewCompanyForm ? (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Create New Company</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCompanyForm(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
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
                    placeholder="Search companies..."
                  />
                  {showCompanyDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-y-auto">
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => {
                            updateField("company_id", c.id);
                            updateField("company_name", c.name);
                            setCompanySearch("");
                            setShowCompanyDropdown(false);
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-accent flex items-center gap-1 border-t"
                        onClick={() => {
                          setShowNewCompanyForm(true);
                          setNewCompanyName(companySearch);
                          setShowCompanyDropdown(false);
                          setCompanySearch("");
                        }}
                      >
                        <Plus className="h-3 w-3" />
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
                  onValueChange={handleLifecycleChange}
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

            {/* Compliance toggles */}
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="text-sm font-semibold text-[#1a2b4a]">
                Compliance
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Marketing Consent</p>
                  <p className="text-xs text-muted-foreground">
                    Opted in to receive marketing communications
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField("marketing_consent", !form.marketing_consent)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.marketing_consent ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.marketing_consent
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Do Not Contact
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Block all outreach to this contact
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("dnc", !form.dnc)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.dnc ? "bg-red-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.dnc ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {form.dnc && (
                <div className="space-y-2 pl-4 border-l-2 border-red-200">
                  <Label className="text-xs">DNC Reason</Label>
                  <Input
                    value={form.dnc_reason}
                    onChange={(e) => updateField("dnc_reason", e.target.value)}
                    placeholder="Reason for do not contact..."
                  />
                </div>
              )}
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
                <Input
                  type="date"
                  value={form.next_follow_up_date}
                  onChange={(e) =>
                    updateField("next_follow_up_date", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-semibold text-[#1a2b4a] mb-3">
                Address
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input
                    value={form.address_line1}
                    onChange={(e) =>
                      updateField("address_line1", e.target.value)
                    }
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
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>

            {/* Delete section (super admin only) */}
            {isSuperAdmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Delete Contact
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove this contact from the CRM.
                    </p>
                  </div>
                  <DeleteContactButton
                    contactId={contact.id}
                    contactName={`${contact.first_name} ${contact.last_name}`}
                    redirectTo="/admin/crm"
                    variant="button"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.first_name || !form.last_name}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for changing to "past" */}
      <AlertDialog open={showPastConfirm} onOpenChange={setShowPastConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Past?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This contact will be marked as a past relationship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateField("lifecycle_stage", "past");
                setShowPastConfirm(false);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
