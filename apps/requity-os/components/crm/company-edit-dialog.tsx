"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CRM_COMPANY_TYPES,
  CRM_COMPANY_SUBTYPES,
  US_STATES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { updateCompanyAction } from "@/app/(authenticated)/admin/crm/company-actions";
import { DeleteCompanyButton } from "@/components/crm/delete-company-button";
import { Pencil, X } from "lucide-react";

interface ContactOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface CompanyEditDialogProps {
  company: {
    id: string;
    name: string;
    company_type: string;
    company_subtype: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    source: string | null;
    notes: string | null;
    other_names: string | null;
    primary_contact_id: string | null;
    referral_contact_id: string | null;
    fee_agreement_on_file: boolean | null;
    nda_created_date: string | null;
    nda_expiration_date: string | null;
    title_company_verified: boolean | null;
    lender_programs: string[] | null;
    asset_types: string[] | null;
    geographies: string[] | null;
    company_capabilities: string[] | null;
  };
  isSuperAdmin?: boolean;
}

export function CompanyEditDialog({
  company,
  isSuperAdmin = false,
}: CompanyEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Contact search state
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [primaryContactSearch, setPrimaryContactSearch] = useState("");
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [referralContactSearch, setReferralContactSearch] = useState("");
  const [showReferralDropdown, setShowReferralDropdown] = useState(false);

  const [form, setForm] = useState({
    name: company.name,
    company_type: company.company_type,
    company_subtype: company.company_subtype || "",
    phone: company.phone || "",
    email: company.email || "",
    website: company.website || "",
    address_line1: company.address_line1 || "",
    city: company.city || "",
    state: company.state || "",
    zip: company.zip || "",
    source: company.source || "",
    notes: company.notes || "",
    other_names: company.other_names || "",
    primary_contact_id: company.primary_contact_id || "",
    referral_contact_id: company.referral_contact_id || "",
    fee_agreement_on_file: company.fee_agreement_on_file ?? false,
    nda_created_date: company.nda_created_date
      ? company.nda_created_date.split("T")[0]
      : "",
    nda_expiration_date: company.nda_expiration_date
      ? company.nda_expiration_date.split("T")[0]
      : "",
    title_company_verified: company.title_company_verified ?? false,
    lender_programs: (company.lender_programs ?? []).join(", "),
    asset_types: (company.asset_types ?? []).join(", "),
    geographies: (company.geographies ?? []).join(", "),
    company_capabilities: (company.company_capabilities ?? []).join(", "),
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Fetch contacts for primary/referral search
  const fetchContacts = useCallback(async (q: string) => {
    const supabase = createClient();
    let query = supabase
      .from("crm_contacts")
      .select("id, first_name, last_name")
      .is("deleted_at", null)
      .order("first_name")
      .limit(10);
    if (q.trim()) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%`
      );
    }
    const { data } = await query;
    setContacts(data ?? []);
  }, []);

  useEffect(() => {
    if (open) fetchContacts("");
  }, [open, fetchContacts]);

  useEffect(() => {
    const q = primaryContactSearch || referralContactSearch;
    if (q.trim()) {
      const timer = setTimeout(() => fetchContacts(q), 300);
      return () => clearTimeout(timer);
    } else {
      fetchContacts("");
    }
  }, [primaryContactSearch, referralContactSearch, fetchContacts]);

  function parseArrayField(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.company_type) return;

    setLoading(true);
    try {
      const result = await updateCompanyAction({
        id: company.id,
        name: form.name,
        company_type: form.company_type,
        company_subtype:
          form.company_type === "lender" ? form.company_subtype || null : null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        source: form.source || null,
        notes: form.notes || null,
        primary_contact_id: form.primary_contact_id || null,
        fee_agreement_on_file: form.fee_agreement_on_file,
        nda_created_date: form.nda_created_date || null,
        nda_expiration_date: form.nda_expiration_date || null,
        lender_programs:
          form.company_type === "lender"
            ? parseArrayField(form.lender_programs)
            : [],
        asset_types:
          form.company_type === "lender"
            ? parseArrayField(form.asset_types)
            : [],
        geographies:
          form.company_type === "lender"
            ? parseArrayField(form.geographies)
            : [],
        company_capabilities:
          form.company_type === "lender"
            ? parseArrayField(form.company_capabilities)
            : [],
      });

      if ("error" in result && result.error) {
        toast({
          title: "Error updating company",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Company updated" });
        setOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      toast({
        title: "Error updating company",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function contactName(c: ContactOption) {
    return `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unnamed";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          {/* Type & Subtype */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Company Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.company_type}
                onValueChange={(v) => {
                  updateField("company_type", v);
                  if (v !== "lender") {
                    updateField("company_subtype", "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {CRM_COMPANY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.company_type === "lender" && (
              <div className="space-y-2">
                <Label>Subtype</Label>
                <Select
                  value={form.company_subtype}
                  onValueChange={(v) => updateField("company_subtype", v)}
                >
                  <SelectTrigger>
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
                onChange={(e) => updateField("phone", e.target.value)}
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

          {/* Website */}
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Address */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
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

          {/* NDA & Fee Agreement */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="text-sm font-semibold text-foreground">
              Documents & Compliance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NDA Created Date</Label>
                <Input
                  type="date"
                  value={form.nda_created_date}
                  onChange={(e) =>
                    updateField("nda_created_date", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>NDA Expiration Date</Label>
                <Input
                  type="date"
                  value={form.nda_expiration_date}
                  onChange={(e) =>
                    updateField("nda_expiration_date", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Fee Agreement on File</p>
                <p className="text-xs text-muted-foreground">
                  Fee agreement has been received and stored
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "fee_agreement_on_file",
                    !form.fee_agreement_on_file
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.fee_agreement_on_file ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.fee_agreement_on_file
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {form.company_type === "title_company" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Title Company Verified</p>
                  <p className="text-xs text-muted-foreground">
                    This title company has been verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "title_company_verified",
                      !form.title_company_verified
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.title_company_verified ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.title_company_verified
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Primary & Referral Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              {form.primary_contact_id ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    {contacts.find((c) => c.id === form.primary_contact_id)
                      ? contactName(
                          contacts.find(
                            (c) => c.id === form.primary_contact_id
                          )!
                        )
                      : "Selected"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateField("primary_contact_id", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={primaryContactSearch}
                    onChange={(e) => {
                      setPrimaryContactSearch(e.target.value);
                      setShowPrimaryDropdown(true);
                    }}
                    onFocus={() => setShowPrimaryDropdown(true)}
                    placeholder="Search contacts..."
                  />
                  {showPrimaryDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-card shadow-lg max-h-48 overflow-y-auto">
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => {
                            updateField("primary_contact_id", c.id);
                            setPrimaryContactSearch("");
                            setShowPrimaryDropdown(false);
                          }}
                        >
                          {contactName(c)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Referral Contact</Label>
              {form.referral_contact_id ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    {contacts.find((c) => c.id === form.referral_contact_id)
                      ? contactName(
                          contacts.find(
                            (c) => c.id === form.referral_contact_id
                          )!
                        )
                      : "Selected"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateField("referral_contact_id", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={referralContactSearch}
                    onChange={(e) => {
                      setReferralContactSearch(e.target.value);
                      setShowReferralDropdown(true);
                    }}
                    onFocus={() => setShowReferralDropdown(true)}
                    placeholder="Search contacts..."
                  />
                  {showReferralDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-card shadow-lg max-h-48 overflow-y-auto">
                      {contacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => {
                            updateField("referral_contact_id", c.id);
                            setReferralContactSearch("");
                            setShowReferralDropdown(false);
                          }}
                        >
                          {contactName(c)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lender-specific fields */}
          {form.company_type === "lender" && (
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Lender Details
              </h4>
              <div className="space-y-2">
                <Label>Lender Programs</Label>
                <Input
                  value={form.lender_programs}
                  onChange={(e) =>
                    updateField("lender_programs", e.target.value)
                  }
                  placeholder="Bridge, DSCR, Fix & Flip (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple programs with commas
                </p>
              </div>
              <div className="space-y-2">
                <Label>Asset Types</Label>
                <Input
                  value={form.asset_types}
                  onChange={(e) => updateField("asset_types", e.target.value)}
                  placeholder="SFR, Multifamily, Mixed Use (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <Label>Geographies</Label>
                <Input
                  value={form.geographies}
                  onChange={(e) => updateField("geographies", e.target.value)}
                  placeholder="Nationwide, CA, TX, FL (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <Label>Capabilities</Label>
                <Input
                  value={form.company_capabilities}
                  onChange={(e) =>
                    updateField("company_capabilities", e.target.value)
                  }
                  placeholder="Table funding, Correspondent (comma-separated)"
                />
              </div>
            </div>
          )}

          {/* Other Names */}
          <div className="space-y-2">
            <Label>Other Names / DBA</Label>
            <Input
              value={form.other_names}
              onChange={(e) => updateField("other_names", e.target.value)}
              placeholder="Alternative or previous company names"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Internal notes about this company..."
            />
          </div>

          {/* Delete section (super admin only) */}
          {isSuperAdmin && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Deactivate Company
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remove this company from all lists. Can be reactivated
                    later.
                  </p>
                </div>
                <DeleteCompanyButton
                  companyId={company.id}
                  companyName={company.name}
                  redirectTo="/admin/crm"
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
              disabled={loading || !form.name.trim() || !form.company_type}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
