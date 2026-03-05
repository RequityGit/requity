"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type {
  T12Data,
  ExpenseOverrides,
  YearAssumptions,
  ExpenseDefault,
  CommercialPropertyType,
} from "@/lib/commercial-uw/types";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@/lib/commercial-uw/types";
import { UploadT12Dialog } from "./upload-t12-dialog";
import type { T12ImportMetadata } from "./upload-t12-dialog";

interface Props {
  t12: T12Data | null;
  setT12: (v: T12Data | null) => void;
  expenseOverrides: ExpenseOverrides;
  setExpenseOverrides: (v: ExpenseOverrides) => void;
  assumptions: YearAssumptions;
  setAssumptions: (v: YearAssumptions) => void;
  expenseDefaultAmounts: Record<string, number>;
  yr1Expenses: Record<string, number>;
  relevantDefaults: ExpenseDefault[];
  basisCount: number;
  propertyType: CommercialPropertyType;
  onT12Import: (data: T12Data, metadata: T12ImportMetadata) => void;
}

export function ExpensesTab({
  t12,
  setT12,
  expenseOverrides,
  setExpenseOverrides,
  assumptions,
  setAssumptions,
  expenseDefaultAmounts,
  yr1Expenses,
  relevantDefaults,
  basisCount,
  propertyType,
  onT12Import,
}: Props) {
  const [t12UploadOpen, setT12UploadOpen] = useState(false);
  const updateT12 = (field: keyof T12Data, value: number) => {
    const current = t12 ?? {
      gpi: 0, vacancy_pct: 0, bad_debt_pct: 0, mgmt_fee: 0, taxes: 0,
      insurance: 0, utilities: 0, repairs: 0, contract_services: 0,
      payroll: 0, marketing: 0, ga: 0, replacement_reserve: 0,
    };
    setT12({ ...current, [field]: value });
  };

  const updateOverride = (field: keyof ExpenseOverrides, value: string) => {
    const numVal = value === "" ? null : Number(value);
    setExpenseOverrides({ ...expenseOverrides, [field]: numVal });
  };

  const updateAssumptionArray = (
    key: "rent_growth" | "expense_growth" | "vacancy_pct",
    idx: number,
    value: number
  ) => {
    const arr = [...assumptions[key]];
    arr[idx] = value;
    setAssumptions({ ...assumptions, [key]: arr });
  };

  const basisLabel = relevantDefaults[0]?.basis?.replace("per_", "/ ") ?? "/ unit";

  return (
    <div className="space-y-4">
      {/* Expense Guidance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Expense Guidance — {propertyType.replace(/_/g, " ")} ({basisCount.toLocaleString()} {basisLabel.replace("/ ", "")}s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-right p-2 font-medium">{basisLabel}</th>
                  <th className="text-right p-2 font-medium">Default Total</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const def = relevantDefaults.find((d) => d.expense_category === cat);
                  return (
                    <tr key={cat} className="border-b">
                      <td className="p-2">{EXPENSE_CATEGORY_LABELS[cat]}</td>
                      <td className="p-2 text-right num">
                        {def ? `$${def.per_unit_amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2 text-right num">
                        {expenseDefaultAmounts[cat]
                          ? formatCurrency(expenseDefaultAmounts[cat])
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Input Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Year 1 Expense Overrides</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setT12UploadOpen(true)}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload T12
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-right p-2 font-medium">T12 Actual</th>
                  <th className="text-right p-2 font-medium">Default</th>
                  <th className="text-right p-2 font-medium">Override</th>
                  <th className="text-right p-2 font-medium">Final Year 1</th>
                </tr>
              </thead>
              <tbody>
                {/* Mgmt Fee */}
                <tr className="border-b">
                  <td className="p-2">Management Fee (%)</td>
                  <td className="p-2 text-right num">
                    {t12?.mgmt_fee ? formatCurrency(t12.mgmt_fee) : "—"}
                  </td>
                  <td className="p-2 text-right num">8%</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={expenseOverrides.mgmt_fee_pct ?? ""}
                      onChange={(e) =>
                        setExpenseOverrides({
                          ...expenseOverrides,
                          mgmt_fee_pct: Number(e.target.value) || 8,
                        })
                      }
                      className="h-7 text-xs w-20 text-right ml-auto bg-green-50 border-green-200"
                    />
                  </td>
                  <td className="p-2 text-right num font-medium">
                    {formatCurrency(yr1Expenses.mgmt_fee ?? 0)}
                  </td>
                </tr>

                {EXPENSE_CATEGORIES.map((cat) => {
                  const overrideKey = cat === "reserve" ? "reserve" : cat;
                  const t12Key = cat === "reserve" ? "replacement_reserve" : cat;
                  return (
                    <tr key={cat} className="border-b">
                      <td className="p-2">{EXPENSE_CATEGORY_LABELS[cat]}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={t12?.[t12Key as keyof T12Data] ?? ""}
                          onChange={(e) =>
                            updateT12(t12Key as keyof T12Data, Number(e.target.value) || 0)
                          }
                          className="h-7 text-xs w-24 text-right ml-auto"
                        />
                      </td>
                      <td className="p-2 text-right num">
                        {formatCurrency(expenseDefaultAmounts[cat] ?? 0)}
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={
                            expenseOverrides[overrideKey as keyof ExpenseOverrides] ?? ""
                          }
                          onChange={(e) =>
                            updateOverride(
                              overrideKey as keyof ExpenseOverrides,
                              e.target.value
                            )
                          }
                          placeholder="Use default"
                          className="h-7 text-xs w-24 text-right ml-auto bg-green-50 border-green-200"
                        />
                      </td>
                      <td className="p-2 text-right num font-medium">
                        {formatCurrency(yr1Expenses[cat] ?? 0)}
                      </td>
                    </tr>
                  );
                })}

                <tr className="border-t-2 font-bold">
                  <td className="p-2">Total Operating Expenses</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right num">
                    {formatCurrency(yr1Expenses.total_opex ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Growth Assumptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Growth Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Assumption</th>
                  <th className="text-center p-2 font-medium">Year 1</th>
                  <th className="text-center p-2 font-medium">Year 2</th>
                  <th className="text-center p-2 font-medium">Year 3</th>
                  <th className="text-center p-2 font-medium">Year 4</th>
                  <th className="text-center p-2 font-medium">Year 5</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Rent Growth %</td>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <td key={i} className="p-1 text-center">
                      <Input
                        type="number"
                        value={assumptions.rent_growth[i] ?? ""}
                        onChange={(e) =>
                          updateAssumptionArray("rent_growth", i, Number(e.target.value) || 0)
                        }
                        className="h-7 text-xs text-center w-16 mx-auto"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Expense Growth %</td>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <td key={i} className="p-1 text-center">
                      <Input
                        type="number"
                        value={assumptions.expense_growth[i] ?? ""}
                        onChange={(e) =>
                          updateAssumptionArray("expense_growth", i, Number(e.target.value) || 0)
                        }
                        className="h-7 text-xs text-center w-16 mx-auto"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Vacancy %</td>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <td key={i} className="p-1 text-center">
                      <Input
                        type="number"
                        value={assumptions.vacancy_pct[i] ?? ""}
                        onChange={(e) =>
                          updateAssumptionArray("vacancy_pct", i, Number(e.target.value) || 0)
                        }
                        className="h-7 text-xs text-center w-16 mx-auto"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-xs">Stabilized Vacancy %</Label>
              <Input
                type="number"
                value={assumptions.stabilized_vacancy_pct ?? ""}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    stabilized_vacancy_pct: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 w-24"
              />
            </div>
            <div>
              <Label className="text-xs">Bad Debt %</Label>
              <Input
                type="number"
                value={assumptions.bad_debt_pct ?? ""}
                onChange={(e) =>
                  setAssumptions({
                    ...assumptions,
                    bad_debt_pct: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload T12 Dialog */}
      <UploadT12Dialog
        open={t12UploadOpen}
        onOpenChange={setT12UploadOpen}
        onImport={onT12Import}
      />
    </div>
  );
}
