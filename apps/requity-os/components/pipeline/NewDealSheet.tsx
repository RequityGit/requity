"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { CardTypeSelector } from "./CardTypeSelector";
import { createUnifiedDealAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UnifiedCardType,
  ASSET_CLASS_LABELS,
  type AssetClass,
} from "./pipeline-types";
import { toast } from "sonner";

interface NewDealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardTypes: UnifiedCardType[];
  teamMembers: { id: string; full_name: string }[];
}

export function NewDealSheet({
  open,
  onOpenChange,
  cardTypes,
  teamMembers,
}: NewDealSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cardTypeId, setCardTypeId] = useState<string | null>(null);
  const [assetClass, setAssetClass] = useState<string>("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedCardType = cardTypes.find((ct) => ct.id === cardTypeId);

  const applicableAssets = selectedCardType?.applicable_asset_classes ?? Object.keys(ASSET_CLASS_LABELS);

  function reset() {
    setStep(1);
    setCardTypeId(null);
    setAssetClass("");
    setName("");
    setAmount("");
    setAssignedTo("");
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function handleSubmit() {
    if (!cardTypeId || !name.trim()) return;

    startTransition(async () => {
      const result = await createUnifiedDealAction({
        name: name.trim(),
        card_type_id: cardTypeId,
        asset_class: assetClass || undefined,
        amount: amount ? Number(amount) : undefined,
        assigned_to: assignedTo || undefined,
      });

      if (result.error) {
        toast.error(`Failed to create deal: ${result.error}`);
      } else {
        const deal = result.deal as { id: string; deal_number: string } | undefined;
        toast.success(`Deal ${deal?.deal_number ?? ""} created`);
        handleClose(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 1
              ? "Select Deal Type"
              : step === 2
                ? "Select Asset Class"
                : "Deal Details"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <>
              <CardTypeSelector
                cardTypes={cardTypes}
                selected={cardTypeId}
                onSelect={(id) => setCardTypeId(id)}
                onDoubleClick={(id) => {
                  setCardTypeId(id);
                  setStep(2);
                }}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!cardTypeId}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {applicableAssets.map((ac) => (
                  <button
                    key={ac}
                    type="button"
                    onClick={() => setAssetClass(ac)}
                    onDoubleClick={() => {
                      setAssetClass(ac);
                      setStep(3);
                    }}
                    className={`rounded-lg border p-3 text-left text-sm transition-all hover:border-foreground/20 ${
                      assetClass === ac ? "border-foreground ring-1 ring-foreground" : ""
                    }`}
                  >
                    {ASSET_CLASS_LABELS[ac as AssetClass] ?? ac}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!assetClass}>
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Deal Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 123 Main St SFR Rental"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 num"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
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
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || pending}
                >
                  {pending ? "Creating deal..." : "Create Deal"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
