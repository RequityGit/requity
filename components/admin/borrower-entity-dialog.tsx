"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  addEntityAction,
  updateEntityAction,
} from "@/app/(authenticated)/admin/borrowers/new/actions";
import { Loader2 } from "lucide-react";
import { US_STATES, ENTITY_TYPES } from "@/lib/constants";
import type { BorrowerEntity } from "@/lib/supabase/types";

interface BorrowerEntityDialogProps {
  borrowerId: string;
  entity: BorrowerEntity | null;
  open: boolean;
  onClose: () => void;
}

export function BorrowerEntityDialog({
  borrowerId,
  entity,
  open,
  onClose,
}: BorrowerEntityDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [ein, setEin] = useState("");
  const [stateOfFormation, setStateOfFormation] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [isForeignFiled, setIsForeignFiled] = useState(false);
  const [foreignFiledStates, setForeignFiledStates] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entity) {
      setEntityName(entity.entity_name);
      setEntityType(entity.entity_type);
      setEin(entity.ein || "");
      setStateOfFormation(entity.state_of_formation || "");
      setAddressLine1(entity.address_line1 || "");
      setAddressLine2(entity.address_line2 || "");
      setCity(entity.city || "");
      setState(entity.state || "");
      setZip(entity.zip || "");
      setIsForeignFiled(entity.is_foreign_filed);
      setForeignFiledStates(entity.foreign_filed_states?.join(", ") || "");
      setNotes(entity.notes || "");
    } else {
      setEntityName("");
      setEntityType("");
      setEin("");
      setStateOfFormation("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setState("");
      setZip("");
      setIsForeignFiled(false);
      setForeignFiledStates("");
      setNotes("");
    }
  }, [entity, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entityName.trim() || !entityType) return;

    setLoading(true);

    const foreignStatesArray = foreignFiledStates
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      borrower_id: borrowerId,
      entity_name: entityName.trim(),
      entity_type: entityType,
      ein: ein.trim() || undefined,
      state_of_formation: stateOfFormation || undefined,
      address_line1: addressLine1.trim() || undefined,
      address_line2: addressLine2.trim() || undefined,
      city: city.trim() || undefined,
      state: state || undefined,
      zip: zip.trim() || undefined,
      is_foreign_filed: isForeignFiled,
      foreign_filed_states:
        isForeignFiled && foreignStatesArray.length > 0
          ? foreignStatesArray
          : undefined,
      notes: notes.trim() || undefined,
    };

    let result;
    if (entity) {
      result = await updateEntityAction({ ...payload, id: entity.id });
    } else {
      result = await addEntityAction(payload);
    }

    if (result.error) {
      toast({
        title: entity ? "Error updating entity" : "Error adding entity",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: entity ? "Entity updated" : "Entity added",
      });
      router.refresh();
      onClose();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entity ? "Edit Entity" : "Add Entity"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityName">Entity Name *</Label>
              <Input
                id="entityName"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Acme Holdings LLC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type *</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ein">EIN</Label>
              <Input
                id="ein"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateOfFormation">State of Formation</Label>
              <Select value={stateOfFormation} onValueChange={setStateOfFormation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="entAddr1">Address Line 1</Label>
            <Input
              id="entAddr1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 Business Ave"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entAddr2">Address Line 2</Label>
            <Input
              id="entAddr2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Suite 200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entCity">City</Label>
              <Input
                id="entCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entState">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
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
              <Label htmlFor="entZip">ZIP</Label>
              <Input
                id="entZip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="10001"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foreign Filed?</Label>
            <Select
              value={isForeignFiled ? "yes" : "no"}
              onValueChange={(v) => setIsForeignFiled(v === "yes")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isForeignFiled && (
            <div className="space-y-2">
              <Label htmlFor="foreignStates">
                Foreign Filed States (comma-separated)
              </Label>
              <Input
                id="foreignStates"
                value={foreignFiledStates}
                onChange={(e) => setForeignFiledStates(e.target.value)}
                placeholder="NY, CA, FL"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entNotes">Notes</Label>
            <Textarea
              id="entNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this entity..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !entityName.trim() || !entityType}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entity ? "Update Entity" : "Add Entity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
