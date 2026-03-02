"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { useToast } from "@/components/ui/use-toast";
import { FUND_TYPES } from "@/lib/constants";
import { PlusCircle, Loader2 } from "lucide-react";

export function InvestmentForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [fundType, setFundType] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [vintageYear, setVintageYear] = useState("");
  const [irrTarget, setIrrTarget] = useState("");
  const [preferredReturn, setPreferredReturn] = useState("");
  const [managementFee, setManagementFee] = useState("");
  const [description, setDescription] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  function resetForm() {
    setName("");
    setFundType("");
    setTargetSize("");
    setVintageYear("");
    setIrrTarget("");
    setPreferredReturn("");
    setManagementFee("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !fundType) {
      toast({
        title: "Missing fields",
        description: "Name and type are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("funds").insert({
      name,
      fund_type: fundType,
      target_size: targetSize ? parseFloat(targetSize) : null,
      vintage_year: vintageYear ? parseInt(vintageYear, 10) : null,
      irr_target: irrTarget ? parseFloat(irrTarget) : null,
      preferred_return: preferredReturn ? parseFloat(preferredReturn) : null,
      management_fee: managementFee ? parseFloat(managementFee) : null,
      description: description || null,
      status: "open",
    });

    if (error) {
      toast({
        title: "Error creating investment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Investment created successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fund I"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={fundType} onValueChange={setFundType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FUND_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Size ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                placeholder="e.g. 10000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Vintage Year</Label>
              <Input
                type="number"
                min="2000"
                max="2099"
                value={vintageYear}
                onChange={(e) => setVintageYear(e.target.value)}
                placeholder="e.g. 2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>IRR Target (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={irrTarget}
                onChange={(e) => setIrrTarget(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div className="space-y-2">
              <Label>Pref. Return (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={preferredReturn}
                onChange={(e) => setPreferredReturn(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>
            <div className="space-y-2">
              <Label>Mgmt Fee (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={managementFee}
                onChange={(e) => setManagementFee(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Investment description..."
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Creating..." : "Create Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
