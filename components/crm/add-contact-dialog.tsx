"use client";

import { useState } from "react";
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
import {
  CRM_CONTACT_TYPES,
  CRM_CONTACT_SOURCES,
  CRM_CONTACT_STATUSES,
  US_STATES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

interface TeamMember {
  id: string;
  full_name: string;
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

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    contact_type: "lead",
    source: "",
    status: "active",
    assigned_to: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    next_follow_up_date: "",
    notes: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
      contact_type: "lead",
      source: "",
      status: "active",
      assigned_to: "",
      address_line1: "",
      city: "",
      state: "",
      zip: "",
      next_follow_up_date: "",
      notes: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const insertData: Database["public"]["Tables"]["crm_contacts"]["Insert"] = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        company_name: form.company_name || null,
        contact_type: form.contact_type as any,
        source: (form.source || null) as any,
        status: form.status as any,
        assigned_to: form.assigned_to || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        next_follow_up_date: form.next_follow_up_date || null,
        notes: form.notes || null,
      };

      const { error } = await supabase.from("crm_contacts").insert(insertData);

      if (error) throw error;

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
    <Dialog open={open} onOpenChange={setOpen}>
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
          {/* Name & Company */}
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

          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
            />
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

          {/* Type, Source, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select
                value={form.contact_type}
                onValueChange={(v) => updateField("contact_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_CONTACT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_CONTACT_STATUSES.map((s) => (
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
            <Button
              type="submit"
              disabled={loading || !form.first_name || !form.last_name}
            >
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
