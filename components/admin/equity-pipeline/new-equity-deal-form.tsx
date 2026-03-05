"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createEquityDealAction } from "@/app/(authenticated)/admin/equity-pipeline/actions";
import {
  EQUITY_DEAL_SOURCES,
  ASSET_TYPES,
  US_STATES,
  PROPERTY_TYPE_OPTIONS,
} from "@/lib/constants";
import {
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NewEquityDealFormProps {
  teamMembers: { id: string; full_name: string }[];
  currentUserId: string;
}

const STEPS = [
  { label: "Deal Info", icon: Building2 },
  { label: "Property", icon: MapPin },
  { label: "Financials", icon: DollarSign },
];

export function NewEquityDealForm({
  teamMembers,
  currentUserId,
}: NewEquityDealFormProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Deal info state
  const [dealInfo, setDealInfo] = useState({
    deal_name: "",
    source: "",
    assigned_to: currentUserId,
    investment_thesis: "",
  });

  // Property state
  const [property, setProperty] = useState({
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    asset_type: "",
    property_type: "",
    number_of_units: "",
    lot_size_acres: "",
  });

  // Financials state
  const [financials, setFinancials] = useState({
    asking_price: "",
    target_irr: "",
    value_add_strategy: "",
  });

  async function handleSubmit() {
    if (!dealInfo.deal_name.trim()) {
      toast({
        title: "Deal name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const input: any = {
      deal_name: dealInfo.deal_name.trim(),
      source: dealInfo.source || undefined,
      assigned_to: dealInfo.assigned_to || undefined,
      investment_thesis: dealInfo.investment_thesis || undefined,
      asking_price: financials.asking_price
        ? Number(financials.asking_price)
        : undefined,
      target_irr: financials.target_irr
        ? Number(financials.target_irr)
        : undefined,
      value_add_strategy: financials.value_add_strategy || undefined,
    };

    // Include property if address was entered
    if (property.address_line1.trim()) {
      input.property = {
        address_line1: property.address_line1,
        city: property.city || undefined,
        state: property.state || undefined,
        zip: property.zip || undefined,
        asset_type: property.asset_type || undefined,
        property_type: property.property_type || undefined,
        number_of_units: property.number_of_units
          ? Number(property.number_of_units)
          : undefined,
        lot_size_acres: property.lot_size_acres
          ? Number(property.lot_size_acres)
          : undefined,
      };
    }

    const result = await createEquityDealAction(input);

    if (result.error) {
      toast({
        title: "Error creating deal",
        description: result.error,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({ title: "Equity deal created successfully" });
    router.push(`/admin/equity-pipeline/${result.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === step;
          const isComplete = idx < step;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : isComplete
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-500"
                }`}
                onClick={() => setStep(idx)}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {s.label}
              </button>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Deal Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Deal Name *</Label>
                <Input
                  value={dealInfo.deal_name}
                  onChange={(e) =>
                    setDealInfo({ ...dealInfo, deal_name: e.target.value })
                  }
                  placeholder="e.g. 24-Unit Garden Apts - Dallas, TX"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select
                  value={dealInfo.source}
                  onValueChange={(v) =>
                    setDealInfo({ ...dealInfo, source: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUITY_DEAL_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Select
                  value={dealInfo.assigned_to}
                  onValueChange={(v) =>
                    setDealInfo({ ...dealInfo, assigned_to: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
              <div className="col-span-2">
                <Label>Investment Thesis</Label>
                <Textarea
                  value={dealInfo.investment_thesis}
                  onChange={(e) =>
                    setDealInfo({
                      ...dealInfo,
                      investment_thesis: e.target.value,
                    })
                  }
                  placeholder="Describe the investment opportunity and value-add strategy..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Property */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={property.address_line1}
                  onChange={(e) =>
                    setProperty({ ...property, address_line1: e.target.value })
                  }
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={property.city}
                  onChange={(e) =>
                    setProperty({ ...property, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>State</Label>
                <Select
                  value={property.state}
                  onValueChange={(v) =>
                    setProperty({ ...property, state: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
              <div>
                <Label>ZIP</Label>
                <Input
                  value={property.zip}
                  onChange={(e) =>
                    setProperty({ ...property, zip: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Asset Type</Label>
                <Select
                  value={property.asset_type}
                  onValueChange={(v) =>
                    setProperty({ ...property, asset_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Type</Label>
                <Select
                  value={property.property_type}
                  onValueChange={(v) =>
                    setProperty({ ...property, property_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Units</Label>
                <Input
                  type="number"
                  value={property.number_of_units}
                  onChange={(e) =>
                    setProperty({
                      ...property,
                      number_of_units: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Lot Size (Acres)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={property.lot_size_acres}
                  onChange={(e) =>
                    setProperty({
                      ...property,
                      lot_size_acres: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Skip
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Financials */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Asking Price</Label>
                <Input
                  type="number"
                  value={financials.asking_price}
                  onChange={(e) =>
                    setFinancials({
                      ...financials,
                      asking_price: e.target.value,
                    })
                  }
                  placeholder="$"
                />
              </div>
              <div>
                <Label>Target IRR (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={financials.target_irr}
                  onChange={(e) =>
                    setFinancials({
                      ...financials,
                      target_irr: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Value-Add Strategy</Label>
                <Textarea
                  value={financials.value_add_strategy}
                  onChange={(e) =>
                    setFinancials({
                      ...financials,
                      value_add_strategy: e.target.value,
                    })
                  }
                  placeholder="e.g. Interior renovations, rent increases, operational improvements..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Creating..." : "Create Equity Deal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
