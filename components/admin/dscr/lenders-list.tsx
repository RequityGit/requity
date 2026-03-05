"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Building2 } from "lucide-react";
import { addLenderAction, toggleLenderActiveAction } from "@/app/(authenticated)/admin/models/dscr/actions";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LendersList({ lenders }: { lenders: any[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    nmls_id: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    account_executive: "",
    ae_email: "",
    ae_phone: "",
    notes: "",
  });

  async function handleAdd() {
    if (!form.name || !form.short_name) {
      toast({ title: "Error", description: "Name and short name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result = await addLenderAction(form);
      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Lender added" });
      setOpen(false);
      setForm({ name: "", short_name: "", nmls_id: "", contact_name: "", contact_email: "", contact_phone: "", account_executive: "", ae_email: "", ae_phone: "", notes: "" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const result = await toggleLenderActiveAction(id, !current);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lender Partners</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lender
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Lender Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lender Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="American Heritage Lending"
                  />
                </div>
                <div>
                  <Label>Short Name *</Label>
                  <Input
                    value={form.short_name}
                    onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                    placeholder="AHL"
                  />
                </div>
              </div>
              <div>
                <Label>NMLS ID</Label>
                <Input
                  value={form.nmls_id}
                  onChange={(e) => setForm({ ...form, nmls_id: e.target.value })}
                  placeholder="93735"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Executive</Label>
                  <Input
                    value={form.account_executive}
                    onChange={(e) => setForm({ ...form, account_executive: e.target.value })}
                  />
                </div>
                <div>
                  <Label>AE Email</Label>
                  <Input
                    value={form.ae_email}
                    onChange={(e) => setForm({ ...form, ae_email: e.target.value })}
                    type="email"
                  />
                </div>
              </div>
              <div>
                <Label>AE Phone</Label>
                <Input
                  value={form.ae_phone}
                  onChange={(e) => setForm({ ...form, ae_phone: e.target.value })}
                />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving ? "Adding..." : "Add Lender"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {lenders.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No lender partners yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first wholesale lender to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lenders.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.name}</span>
                    <Badge variant={l.is_active ? "default" : "secondary"}>
                      {l.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {l.short_name}
                    {l.nmls_id && ` | NMLS: ${l.nmls_id}`}
                    {l.account_executive && ` | AE: ${l.account_executive}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(l.id, l.is_active)}
                  >
                    {l.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Link href={`/admin/models/dscr/lenders/${l.id}`}>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
