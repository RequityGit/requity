"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_COMPANY_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { addCompanyAction } from "@/app/(authenticated)/(admin)/companies/actions";

interface QuickAddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: (company: { id: string; company_number: string; name: string; company_type: string }) => void;
}

export function QuickAddCompanyDialog({
  open,
  onOpenChange,
  onCompanyCreated,
}: QuickAddCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName("");
    setCompanyType("");
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Required";
    if (!companyType) newErrors.company_type = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await addCompanyAction({
        name: name.trim(),
        company_type: companyType,
      });

      if ("error" in result && result.error) {
        toast({
          title: "Error creating company",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.id) {
        toast({ title: "Company created" });
        onCompanyCreated({ id: result.id, company_number: result.company_number!, name: name.trim(), company_type: companyType });
        onOpenChange(false);
        reset();
      }
    } catch (err: unknown) {
      toast({
        title: "Error creating company",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
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
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder="Company name"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Company Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={companyType}
              onValueChange={(v) => {
                setCompanyType(v);
                if (errors.company_type) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.company_type;
                    return next;
                  });
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
            {errors.company_type && (
              <p className="text-xs text-red-500">{errors.company_type}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
