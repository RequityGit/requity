"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Pencil, Save, X, RotateCcw } from "lucide-react";
import {
  COMMERCIAL_PROPERTY_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/commercial-uw/types";
import type { UWAssumptionData, ExpenseDefaultData } from "@/app/(authenticated)/control-center/underwriting/actions";
import {
  updateAssumption,
  resetAssumptionToDefaults,
  updateExpenseDefault,
  bulkUpdateExpenseDefaults,
} from "@/app/(authenticated)/control-center/underwriting/actions";

// ── Property type label lookup ──

const PROPERTY_TYPE_LABELS: Record<string, string> = {};
COMMERCIAL_PROPERTY_TYPES.forEach((pt) => {
  PROPERTY_TYPE_LABELS[pt.value] = pt.label;
});

const BASIS_LABELS: Record<string, string> = {
  per_unit: "/ Unit",
  per_sf: "/ SF",
  per_room: "/ Room",
  per_pad: "/ Pad",
  per_site: "/ Site",
  per_slip: "/ Slip",
};

// ── Component Props ──

interface Props {
  assumptions: UWAssumptionData[];
  expenseDefaults: ExpenseDefaultData[];
}

// ── Main Component ──

export function UnderwritingAssumptionsClient({
  assumptions,
  expenseDefaults,
}: Props) {
  return (
    <Tabs defaultValue="assumptions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="assumptions">Growth & Yield Assumptions</TabsTrigger>
        <TabsTrigger value="expenses">Expense Defaults</TabsTrigger>
      </TabsList>

      <TabsContent value="assumptions">
        <AssumptionsSection assumptions={assumptions} />
      </TabsContent>

      <TabsContent value="expenses">
        <ExpenseDefaultsSection expenseDefaults={expenseDefaults} />
      </TabsContent>
    </Tabs>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Growth & Yield Assumptions
// ════════════════════════════════════════════════════════════════════════════

function AssumptionsSection({ assumptions }: { assumptions: UWAssumptionData[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<UWAssumptionData>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback((row: UWAssumptionData) => {
    setEditingId(row.id);
    setEditValues({ ...row });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof UWAssumptionData, value: string) => {
      setEditValues((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { id: _id, property_type: _pt, ...fields } = editValues as UWAssumptionData;
      const result = await updateAssumption(editingId, fields);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Assumptions updated successfully." });
        setEditingId(null);
        setEditValues({});
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [editingId, editValues, router, toast]);

  const handleReset = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const result = await resetAssumptionToDefaults(id);
        if (result.error) {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          toast({ title: "Reset", description: "Assumptions reset to defaults." });
          if (editingId === id) {
            setEditingId(null);
            setEditValues({});
          }
          router.refresh();
        }
      } finally {
        setSaving(false);
      }
    },
    [editingId, router, toast]
  );

  const isEditing = (id: string) => editingId === id;

  const renderCell = (row: UWAssumptionData, field: keyof UWAssumptionData) => {
    if (isEditing(row.id)) {
      return (
        <Input
          type="number"
          step="0.1"
          className="h-8 w-20 text-right text-xs"
          value={editValues[field] ?? ""}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }
    return <span className="text-xs tabular-nums">{Number(row[field]).toFixed(1)}%</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Growth & Yield Assumptions</CardTitle>
        <CardDescription>
          Default underwriting assumptions by property type. These values pre-populate
          new commercial underwriting analyses and can be overridden per deal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background min-w-[140px]">
                  Property Type
                </TableHead>
                <TableHead className="text-right text-xs">Vacancy</TableHead>
                <TableHead className="text-right text-xs">Stab. Vacancy</TableHead>
                <TableHead className="text-right text-xs">Bad Debt</TableHead>
                <TableHead className="text-right text-xs">Mgmt Fee</TableHead>
                <TableHead className="text-center text-xs" colSpan={5}>
                  Rent Growth (Yr 1–5)
                </TableHead>
                <TableHead className="text-center text-xs" colSpan={5}>
                  Expense Growth (Yr 1–5)
                </TableHead>
                <TableHead className="text-right text-xs">Going-In Cap</TableHead>
                <TableHead className="text-right text-xs">Exit Cap</TableHead>
                <TableHead className="text-right text-xs">Disp. Cost</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assumptions.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(isEditing(row.id) && "bg-muted/30")}
                >
                  <TableCell className="sticky left-0 z-10 bg-background font-medium text-sm">
                    {PROPERTY_TYPE_LABELS[row.property_type] ?? row.property_type}
                  </TableCell>
                  <TableCell className="text-right">{renderCell(row, "vacancy_pct")}</TableCell>
                  <TableCell className="text-right">
                    {renderCell(row, "stabilized_vacancy_pct")}
                  </TableCell>
                  <TableCell className="text-right">{renderCell(row, "bad_debt_pct")}</TableCell>
                  <TableCell className="text-right">{renderCell(row, "mgmt_fee_pct")}</TableCell>
                  {([1, 2, 3, 4, 5] as const).map((yr) => (
                    <TableCell key={`rg${yr}`} className="text-right">
                      {renderCell(row, `rent_growth_yr${yr}` as keyof UWAssumptionData)}
                    </TableCell>
                  ))}
                  {([1, 2, 3, 4, 5] as const).map((yr) => (
                    <TableCell key={`eg${yr}`} className="text-right">
                      {renderCell(row, `expense_growth_yr${yr}` as keyof UWAssumptionData)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {renderCell(row, "going_in_cap_rate")}
                  </TableCell>
                  <TableCell className="text-right">{renderCell(row, "exit_cap_rate")}</TableCell>
                  <TableCell className="text-right">
                    {renderCell(row, "disposition_cost_pct")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isEditing(row.id) ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => handleReset(row.id)}
                            disabled={saving}
                            title="Reset to defaults"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Expense Defaults
// ════════════════════════════════════════════════════════════════════════════

function ExpenseDefaultsSection({
  expenseDefaults,
}: {
  expenseDefaults: ExpenseDefaultData[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Group by property type
  const propertyTypes = Array.from(
    new Set(expenseDefaults.map((d) => d.property_type))
  ).sort();

  const [selectedType, setSelectedType] = useState(propertyTypes[0] ?? "multifamily");
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const currentDefaults = expenseDefaults.filter(
    (d) => d.property_type === selectedType
  );

  const startEdit = useCallback(() => {
    const vals: Record<string, number> = {};
    currentDefaults.forEach((d) => {
      vals[d.id] = Number(d.per_unit_amount);
    });
    setEditValues(vals);
    setEditMode(true);
  }, [currentDefaults]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditValues({});
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editValues).map(([id, per_unit_amount]) => ({
        id,
        per_unit_amount,
      }));
      const result = await bulkUpdateExpenseDefaults(updates);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Expense defaults updated." });
        setEditMode(false);
        setEditValues({});
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [editValues, router, toast]);

  const handleSingleUpdate = useCallback(
    async (id: string, value: number) => {
      const result = await updateExpenseDefault(id, { per_unit_amount: value });
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        router.refresh();
      }
    },
    [router, toast]
  );

  // Get basis label for the selected property type
  const basisInfo = COMMERCIAL_PROPERTY_TYPES.find(
    (pt) => pt.value === selectedType
  );
  const basisLabel = basisInfo ? BASIS_LABELS[basisInfo.basis] ?? `/ ${basisInfo.basis}` : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Expense Defaults</CardTitle>
            <CardDescription>
              Default expense amounts per {basisLabel.replace("/ ", "").toLowerCase() || "unit"} by
              property type. Used to pre-populate the expenses tab in commercial underwriting.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {PROPERTY_TYPE_LABELS[pt] ?? pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editMode ? (
              <div className="flex gap-1">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Category</TableHead>
              <TableHead className="text-right">Amount {basisLabel}</TableHead>
              <TableHead className="text-right">Basis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDefaults.map((row) => {
              // mgmt_fee is stored as a percentage, not a dollar amount
              const isMgmtFee = row.expense_category === "mgmt_fee";
              const displayLabel =
                EXPENSE_CATEGORY_LABELS[
                  row.expense_category as keyof typeof EXPENSE_CATEGORY_LABELS
                ] ?? (isMgmtFee ? "Management Fee (%)" : row.expense_category);

              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{displayLabel}</TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 w-28 text-right ml-auto"
                        value={editValues[row.id] ?? ""}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [row.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    ) : (
                      <span className="tabular-nums">
                        {isMgmtFee
                          ? `${Number(row.per_unit_amount).toFixed(1)}%`
                          : `$${Number(row.per_unit_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {isMgmtFee ? "% of EGI" : basisLabel}
                  </TableCell>
                </TableRow>
              );
            })}
            {currentDefaults.length > 0 && !editMode && (
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>Total (excl. Mgmt Fee)</TableCell>
                <TableCell className="text-right">
                  <span className="tabular-nums">
                    $
                    {currentDefaults
                      .filter((d) => d.expense_category !== "mgmt_fee")
                      .reduce((sum, d) => sum + Number(d.per_unit_amount), 0)
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {basisLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
