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
import { Pencil } from "lucide-react";
import type { CrmContact } from "@/lib/supabase/types";

interface TeamMember {
  id: string;
  full_name: string;
}

interface ContactEditDialogProps {
  contact: CrmContact;
  teamMembers: TeamMember[];
}

export function ContactEditDialog({
  contact,
  teamMembers,
}: ContactEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    first_name: contact.first_name ?? "",
    last_name: contact.last_name ?? "",
    email: contact.email || "",
    phone: contact.phone || "",
    company_name: contact.company_name || "",
    contact_type: contact.contact_type,
    source: contact.source || "",
    status: contact.status,
    assigned_to: contact.assigned_to || "",
    address_line1: contact.address_line1 || "",
    city: contact.city || "",
    state: contact.state || "",
    zip: contact.zip || "",
    next_follow_up_date: contact.next_follow_up_date || "",
    notes: contact.notes || "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("crm_contacts")
        .update({
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
        })
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
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
