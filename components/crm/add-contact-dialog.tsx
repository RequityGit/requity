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
import { UserPlus, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function AddContactDialog({
  teamMembers,
  currentUserId,
}: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
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

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_id: "" as string,
    company_name: "",
    source: "",
    lifecycle_stage: "lead",
    assigned_to: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    next_follow_up_date: "",
    notes: "",
    tags: "",
  });

  // Relationship types state
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(
    []
  );
  const [lenderDirection, setLenderDirection] = useState("");
  const [vendorType, setVendorType] = useState("");

  // Validation
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
      company_id: "",
      company_name: "",
      source: "",
      lifecycle_stage: "lead",
      assigned_to: "",
      address_line1: "",
      city: "",
      state: "",
      zip: "",
      next_follow_up_date: "",
      notes: "",
      tags: "",
    });
    setSelectedRelationships([]);
    setLenderDirection("");
    setVendorType("");
    setErrors({});
    setShowNewCompanyForm(false);
    setNewCompanyName("");
    setNewCompanyType("");
    setCompanySearch("");
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.first_name.trim()) newErrors.first_name = "Required";
    if (!form.last_name.trim()) newErrors.last_name = "Required";
    if (selectedRelationships.length === 0) {
      newErrors.relationships = "At least one relationship type is required";
    }
    if (!form.email.trim() && !form.phone.trim()) {
      newErrors.contact_method =
        "At least one contact method (email or phone) is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          contact_type: "other" as any, // legacy default
          source: (form.source || null) as any,
          status: "active" as any, // legacy default
          lifecycle_stage: form.lifecycle_stage as any,
          assigned_to: form.assigned_to || null,
          address_line1: form.address_line1 || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          next_follow_up_date: form.next_follow_up_date || null,
          notes: form.notes || null,
        })
        .select("id")
        .single();

      if (contactError) throw contactError;

      // Insert relationship types
      const relationshipInserts = selectedRelationships.map((rt) => ({
        contact_id: newContact.id,
        relationship_type: rt as any,
        lender_direction:
          rt === "lender" && lenderDirection ? (lenderDirection as any) : null,
        vendor_type:
          rt === "vendor" && vendorType ? (vendorType as any) : null,
        is_active: true,
      }));

      if (relationshipInserts.length > 0) {
        const { error: relError } = await supabase
          .from("contact_relationship_types")
          .insert(relationshipInserts);
        if (relError) throw relError;
      }

      // Insert tags
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length > 0) {
        const tagInserts = tags.map((tag) => ({
          contact_id: newContact.id,
          tag,
          created_by: currentUserId,
        }));
        const { error: tagError } = await supabase
          .from("contact_tags")
          .insert(tagInserts);
        if (tagError) throw tagError;
      }

      toast({ title: "Contact added successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error adding contact",
        description: err.message,
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
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
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
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
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
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          {errors.contact_method && (
            <p className="text-xs text-red-500">{errors.contact_method}</p>
          )}

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
                  onChange={(e) => updateField("address_line1", e.target.value)}
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="Enter tags separated by commas..."
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags (e.g., &quot;VIP, high-value, referral&quot;)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Internal notes about this contact..."
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
