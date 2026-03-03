"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createOpportunityAction } from "@/app/(authenticated)/admin/originations/actions";
import { addBorrowerAction } from "@/app/(authenticated)/admin/borrowers/new/actions";
import {
  LOAN_DB_TYPES,
  LOAN_PURPOSES,
  FUNDING_CHANNELS,
  ASSET_TYPES,
  US_STATES,
  BORROWER_ROLES,
} from "@/lib/constants";
import {
  MapPin,
  Building2,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NewDealFormProps {
  entities: { id: string; entity_name: string; entity_type: string; borrower_id: string }[];
  borrowers: { id: string; name: string; email: string }[];
  currentUserId: string;
}

const STEPS = [
  { label: "Property", icon: MapPin },
  { label: "Borrowers", icon: Users },
  { label: "Entity", icon: Building2 },
  { label: "Deal Terms", icon: DollarSign },
];

export function NewDealForm({
  entities,
  borrowers,
  currentUserId,
}: NewDealFormProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Property state
  const [property, setProperty] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    county: "",
    asset_type: "",
    property_type: "",
    year_built: "",
    number_of_units: "",
    lot_size_acres: "",
    gross_building_area_sqft: "",
  });

  // Entity state
  const [selectedEntityId, setSelectedEntityId] = useState("");

  // Borrowers state
  const [selectedBorrowers, setSelectedBorrowers] = useState<
    { borrower_id: string; role: string }[]
  >([]);
  const [addingBorrower, setAddingBorrower] = useState("");
  const [addingRole, setAddingRole] = useState("primary");
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [borrowerPopoverOpen, setBorrowerPopoverOpen] = useState(false);
  const [allBorrowers, setAllBorrowers] = useState(borrowers);

  // Add borrower dialog state
  const [addBorrowerDialogOpen, setAddBorrowerDialogOpen] = useState(false);
  const [newBorrowerFirstName, setNewBorrowerFirstName] = useState("");
  const [newBorrowerLastName, setNewBorrowerLastName] = useState("");
  const [newBorrowerEmail, setNewBorrowerEmail] = useState("");
  const [newBorrowerPhone, setNewBorrowerPhone] = useState("");
  const [addingNewBorrower, setAddingNewBorrower] = useState(false);

  // Filtered borrowers for the combobox search
  const filteredBorrowers = useMemo(() => {
    const available = allBorrowers.filter(
      (b) => !selectedBorrowers.some((sb) => sb.borrower_id === b.id)
    );
    if (!borrowerSearch.trim()) return available;
    const query = borrowerSearch.toLowerCase();
    return available.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.email.toLowerCase().includes(query)
    );
  }, [allBorrowers, selectedBorrowers, borrowerSearch]);

  // Terms state
  const [terms, setTerms] = useState({
    deal_name: "",
    loan_type: "",
    loan_purpose: "",
    funding_channel: "",
    proposed_loan_amount: "",
    proposed_interest_rate: "",
    proposed_loan_term_months: "",
    proposed_ltv: "",
  });

  // Filter entities to only those belonging to selected borrower(s)
  const filteredEntities = useMemo(() => {
    if (selectedBorrowers.length === 0) return [];
    const borrowerIds = new Set(selectedBorrowers.map((b) => b.borrower_id));
    return entities.filter((e) => borrowerIds.has(e.borrower_id));
  }, [entities, selectedBorrowers]);

  function addBorrower() {
    if (!addingBorrower) return;
    if (selectedBorrowers.some((b) => b.borrower_id === addingBorrower)) return;
    setSelectedBorrowers([
      ...selectedBorrowers,
      { borrower_id: addingBorrower, role: addingRole },
    ]);
    setAddingBorrower("");
    setAddingRole(selectedBorrowers.length === 0 ? "primary" : "co_borrower");
  }

  function removeBorrower(id: string) {
    const newBorrowers = selectedBorrowers.filter((b) => b.borrower_id !== id);
    setSelectedBorrowers(newBorrowers);

    // Clear entity selection if it belonged to the removed borrower
    if (selectedEntityId) {
      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
      if (selectedEntity && selectedEntity.borrower_id === id) {
        const remainingIds = new Set(newBorrowers.map((b) => b.borrower_id));
        if (!remainingIds.has(selectedEntity.borrower_id)) {
          setSelectedEntityId("");
        }
      }
    }
  }

  async function handleAddNewBorrower() {
    if (!newBorrowerFirstName.trim() || !newBorrowerLastName.trim()) return;
    setAddingNewBorrower(true);

    const result = await addBorrowerAction({
      first_name: newBorrowerFirstName.trim(),
      last_name: newBorrowerLastName.trim(),
      email: newBorrowerEmail.trim() || undefined,
      phone: newBorrowerPhone.trim() || undefined,
    });

    if (result.error) {
      toast({
        title: "Error creating borrower",
        description: result.error,
        variant: "destructive",
      });
      setAddingNewBorrower(false);
      return;
    }

    const fullName =
      `${newBorrowerFirstName.trim()} ${newBorrowerLastName.trim()}`.trim();
    const newBorrower = {
      id: result.borrowerId!,
      name: fullName,
      email: newBorrowerEmail.trim(),
    };

    setAllBorrowers((prev) => [...prev, newBorrower]);
    setAddingBorrower(newBorrower.id);
    setAddBorrowerDialogOpen(false);
    setNewBorrowerFirstName("");
    setNewBorrowerLastName("");
    setNewBorrowerEmail("");
    setNewBorrowerPhone("");
    setAddingNewBorrower(false);

    toast({ title: `Borrower "${fullName}" created` });
  }

  async function handleSubmit() {
    setSaving(true);

    const input: any = {
      borrower_entity_id: selectedEntityId || undefined,
      borrower_ids:
        selectedBorrowers.length > 0 ? selectedBorrowers : undefined,
      deal_name: terms.deal_name || undefined,
      loan_type: terms.loan_type || undefined,
      loan_purpose: terms.loan_purpose || undefined,
      funding_channel: terms.funding_channel || undefined,
      proposed_loan_amount: terms.proposed_loan_amount
        ? Number(terms.proposed_loan_amount)
        : undefined,
      proposed_interest_rate: terms.proposed_interest_rate
        ? Number(terms.proposed_interest_rate)
        : undefined,
      proposed_loan_term_months: terms.proposed_loan_term_months
        ? Number(terms.proposed_loan_term_months)
        : undefined,
      proposed_ltv: terms.proposed_ltv
        ? Number(terms.proposed_ltv)
        : undefined,
    };

    // Include property if address was entered
    if (property.address_line1.trim()) {
      input.property = {
        address_line1: property.address_line1,
        address_line2: property.address_line2 || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        zip: property.zip || undefined,
        county: property.county || undefined,
        asset_type: property.asset_type || undefined,
        property_type: property.property_type || undefined,
        year_built: property.year_built ? Number(property.year_built) : undefined,
        number_of_units: property.number_of_units
          ? Number(property.number_of_units)
          : undefined,
        lot_size_acres: property.lot_size_acres
          ? Number(property.lot_size_acres)
          : undefined,
        gross_building_area_sqft: property.gross_building_area_sqft
          ? Number(property.gross_building_area_sqft)
          : undefined,
      };
    }

    const result = await createOpportunityAction(input);

    if (result.error) {
      toast({
        title: "Error creating deal",
        description: result.error,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({ title: "Deal created successfully" });
    router.push(`/admin/deals/${result.opportunityId}`);
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

      {/* Step 1: Property */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Address Line 1 *</Label>
                <Input
                  value={property.address_line1}
                  onChange={(e) =>
                    setProperty({ ...property, address_line1: e.target.value })
                  }
                  placeholder="123 Main St"
                />
              </div>
              <div className="col-span-2">
                <Label>Address Line 2</Label>
                <Input
                  value={property.address_line2}
                  onChange={(e) =>
                    setProperty({ ...property, address_line2: e.target.value })
                  }
                  placeholder="Suite 100"
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
                <Label>County</Label>
                <Input
                  value={property.county}
                  onChange={(e) =>
                    setProperty({ ...property, county: e.target.value })
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
                <Label>Year Built</Label>
                <Input
                  type="number"
                  value={property.year_built}
                  onChange={(e) =>
                    setProperty({ ...property, year_built: e.target.value })
                  }
                />
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Skip
              </Button>
              <Button onClick={() => setStep(1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Borrowers */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Borrowers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected borrowers list */}
            {selectedBorrowers.length > 0 && (
              <div className="border rounded-lg divide-y">
                {selectedBorrowers.map((sb, idx) => {
                  const borrower = borrowers.find(
                    (b) => b.id === sb.borrower_id
                  );
                  return (
                    <div
                      key={sb.borrower_id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div>
                        <span className="text-xs font-medium text-muted-foreground mr-2">
                          B{idx + 1}
                        </span>
                        <span className="text-sm font-medium">
                          {borrower?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({BORROWER_ROLES.find((r) => r.value === sb.role)
                            ?.label || sb.role})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 h-7"
                        onClick={() => removeBorrower(sb.borrower_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add borrower */}
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Borrower</Label>
                <Popover
                  open={borrowerPopoverOpen}
                  onOpenChange={setBorrowerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={borrowerPopoverOpen}
                      className="w-full justify-between font-normal h-10"
                    >
                      <span className="truncate">
                        {addingBorrower
                          ? allBorrowers.find((b) => b.id === addingBorrower)
                              ?.name || "Select borrower"
                          : "Select borrower"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search borrowers..."
                        value={borrowerSearch}
                        onChange={(e) => setBorrowerSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {filteredBorrowers.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No borrowers found.
                        </div>
                      ) : (
                        filteredBorrowers.map((b) => (
                          <button
                            key={b.id}
                            className={cn(
                              "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              addingBorrower === b.id && "bg-accent"
                            )}
                            onClick={() => {
                              setAddingBorrower(b.id);
                              setBorrowerSearch("");
                              setBorrowerPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                addingBorrower === b.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col items-start">
                              <span>{b.name}</span>
                              {b.email && (
                                <span className="text-xs text-muted-foreground">
                                  {b.email}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t p-1">
                      <button
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setBorrowerPopoverOpen(false);
                          setAddBorrowerDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Borrower
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Role</Label>
                <Select value={addingRole} onValueChange={setAddingRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BORROWER_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={addBorrower}
                  disabled={!addingBorrower}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Add New Borrower Dialog */}
            <Dialog
              open={addBorrowerDialogOpen}
              onOpenChange={setAddBorrowerDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Borrower</DialogTitle>
                  <DialogDescription>
                    Quickly create a new borrower to add to this deal.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={newBorrowerFirstName}
                      onChange={(e) => setNewBorrowerFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={newBorrowerLastName}
                      onChange={(e) => setNewBorrowerLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newBorrowerEmail}
                      onChange={(e) => setNewBorrowerEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={newBorrowerPhone}
                      onChange={(e) => setNewBorrowerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddBorrowerDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddNewBorrower}
                    disabled={
                      addingNewBorrower ||
                      !newBorrowerFirstName.trim() ||
                      !newBorrowerLastName.trim()
                    }
                  >
                    {addingNewBorrower && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Borrower
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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

      {/* Step 3: Entity */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Borrowing Entity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBorrowers.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Please select at least one borrower first to see their entities.
                </p>
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Go to Borrowers
                </Button>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  The selected borrower(s) have no entities yet. You can skip this step
                  and add an entity later from the deal detail page.
                </p>
              </div>
            ) : (
              <div>
                <Label>Select Entity</Label>
                <Select
                  value={selectedEntityId}
                  onValueChange={setSelectedEntityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search entities..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEntities.map((e) => {
                      const owner = borrowers.find((b) => b.id === e.borrower_id);
                      return (
                        <SelectItem key={e.id} value={e.id}>
                          {e.entity_name} ({e.entity_type})
                          {selectedBorrowers.length > 1 && owner
                            ? ` — ${owner.name}`
                            : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing entities for the selected borrower(s). Skip to create one later.
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Skip
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Deal Terms */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Deal Name</Label>
                <Input
                  value={terms.deal_name}
                  onChange={(e) =>
                    setTerms({ ...terms, deal_name: e.target.value })
                  }
                  placeholder="e.g. 19-Unit MHP - Coosada, AL"
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional. Auto-generated from property if not set.
                </p>
              </div>
              <div>
                <Label>Loan Type</Label>
                <Select
                  value={terms.loan_type}
                  onValueChange={(v) => setTerms({ ...terms, loan_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_DB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loan Purpose</Label>
                <Select
                  value={terms.loan_purpose}
                  onValueChange={(v) =>
                    setTerms({ ...terms, loan_purpose: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Funding Channel</Label>
                <Select
                  value={terms.funding_channel}
                  onValueChange={(v) =>
                    setTerms({ ...terms, funding_channel: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_CHANNELS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proposed Loan Amount</Label>
                <Input
                  type="number"
                  value={terms.proposed_loan_amount}
                  onChange={(e) =>
                    setTerms({
                      ...terms,
                      proposed_loan_amount: e.target.value,
                    })
                  }
                  placeholder="$"
                />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={terms.proposed_interest_rate}
                  onChange={(e) =>
                    setTerms({
                      ...terms,
                      proposed_interest_rate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Term (months)</Label>
                <Input
                  type="number"
                  value={terms.proposed_loan_term_months}
                  onChange={(e) =>
                    setTerms({
                      ...terms,
                      proposed_loan_term_months: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>LTV (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={terms.proposed_ltv}
                  onChange={(e) =>
                    setTerms({ ...terms, proposed_ltv: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Creating..." : "Create Deal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
