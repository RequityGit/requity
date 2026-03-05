"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  User,
  FileText,
  Pencil,
} from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  EQUITY_STAGE_LABELS,
  EQUITY_STAGE_COLORS,
  EQUITY_DEAL_SOURCES,
  PROPERTY_TYPE_OPTIONS,
} from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import {
  EditSectionDialog,
  type SectionField,
} from "@/app/(authenticated)/admin/deals/[id]/EditSectionDialog";
import {
  updateEquityDealField,
  updatePropertyField,
} from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EquityDealDetailProps {
  deal: any;
  property: any;
  tasks: any[];
  stageHistory: any[];
  assignedToName: string | null;
}

function toOptions(arr: readonly { value: string; label: string }[]) {
  return arr.map((i) => ({ value: i.value, label: i.label }));
}

function cap(val: string | null | undefined): string | null {
  if (!val) return null;
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer border-0 text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground"
    >
      <Pencil size={12} strokeWidth={1.5} />
      Edit
    </button>
  );
}

export function EquityDealDetail({
  deal: initialDeal,
  property: initialProperty,
  tasks,
  stageHistory,
  assignedToName,
}: EquityDealDetailProps) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [property, setProperty] = useState(initialProperty);

  const [editDealOpen, setEditDealOpen] = useState(false);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);

  const stageLabel = EQUITY_STAGE_LABELS[deal.stage] ?? deal.stage;
  const stageColor =
    EQUITY_STAGE_COLORS[deal.stage] ?? "bg-slate-100 text-slate-800";

  const completedTasks = tasks.filter(
    (t: any) => t.status === "completed"
  ).length;
  const totalTasks = tasks.length;

  const propertyAddress = property
    ? [property.address_line1, property.city, property.state, property.zip]
        .filter(Boolean)
        .join(", ")
    : null;

  const handleSaveDeal = useCallback(
    async (
      field: string,
      value: string | number | null
    ): Promise<boolean> => {
      const result = await updateEquityDealField(deal.id, { [field]: value });
      if (result.error) {
        console.error("Failed to update equity deal field:", result.error);
        return false;
      }
      setDeal((prev: any) => ({ ...prev, [field]: value }));
      router.refresh();
      return true;
    },
    [deal.id, router]
  );

  const handleSaveProperty = useCallback(
    async (
      table: string,
      id: string,
      field: string,
      value: string | number | null
    ): Promise<boolean> => {
      if (table !== "properties" || !id) return false;
      const result = await updatePropertyField(id, { [field]: value });
      if (result.error) {
        console.error("Failed to update property field:", result.error);
        return false;
      }
      setProperty((prev: any) => (prev ? { ...prev, [field]: value } : prev));
      router.refresh();
      return true;
    },
    [router]
  );

  // --- Field definitions for section dialogs ---

  const dealFields: SectionField[] = [
    {
      label: "Deal Name",
      fieldName: "deal_name",
      fieldType: "text",
      value: deal.deal_name,
    },
    {
      label: "Deal Number",
      fieldName: "deal_number",
      fieldType: "readonly",
      value: deal.deal_number,
    },
    {
      label: "Source",
      fieldName: "source",
      fieldType: "select",
      options: toOptions(EQUITY_DEAL_SOURCES),
      value: deal.source,
    },
    {
      label: "Asking Price",
      fieldName: "asking_price",
      fieldType: "currency",
      value: deal.asking_price,
    },
    {
      label: "Offer Price",
      fieldName: "offer_price",
      fieldType: "currency",
      value: deal.offer_price,
    },
    {
      label: "Purchase Price",
      fieldName: "purchase_price",
      fieldType: "currency",
      value: deal.purchase_price,
    },
    {
      label: "Target IRR",
      fieldName: "target_irr",
      fieldType: "percent",
      value: deal.target_irr,
    },
    {
      label: "Expected Close",
      fieldName: "expected_close_date",
      fieldType: "text",
      value: deal.expected_close_date,
    },
    {
      label: "Actual Close",
      fieldName: "actual_close_date",
      fieldType: "text",
      value: deal.actual_close_date,
    },
  ];

  const propertyFields: SectionField[] = property
    ? [
        {
          label: "Address",
          fieldName: "address_line1",
          fieldType: "text" as const,
          value: property.address_line1,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "City",
          fieldName: "city",
          fieldType: "text" as const,
          value: property.city,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "State",
          fieldName: "state",
          fieldType: "text" as const,
          value: property.state,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Zip",
          fieldName: "zip",
          fieldType: "text" as const,
          value: property.zip,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Asset Type",
          fieldName: "asset_type",
          fieldType: "text" as const,
          value: property.asset_type,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Property Type",
          fieldName: "property_type",
          fieldType: "select" as const,
          options: toOptions(PROPERTY_TYPE_OPTIONS),
          value: property.property_type,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Units",
          fieldName: "number_of_units",
          fieldType: "number" as const,
          value: property.number_of_units,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Lot Size (acres)",
          fieldName: "lot_size_acres",
          fieldType: "number" as const,
          value: property.lot_size_acres,
          relatedTable: "properties",
          relatedId: property.id,
        },
        {
          label: "Year Built",
          fieldName: "year_built",
          fieldType: "number" as const,
          value: property.year_built,
          relatedTable: "properties",
          relatedId: property.id,
        },
      ]
    : [];

  const notesFields: SectionField[] = [
    {
      label: "Investment Thesis",
      fieldName: "investment_thesis",
      fieldType: "text",
      value: deal.investment_thesis,
    },
    {
      label: "Value-Add Strategy",
      fieldName: "value_add_strategy",
      fieldType: "text",
      value: deal.value_add_strategy,
    },
    {
      label: "General Notes",
      fieldName: "notes",
      fieldType: "text",
      value: deal.notes,
    },
    {
      label: "Internal Notes",
      fieldName: "internal_notes",
      fieldType: "text",
      value: deal.internal_notes,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/pipeline/equity">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Pipeline
          </Button>
        </Link>
      </div>

      <PageHeader
        title={deal.deal_name}
        description={
          <div className="flex items-center gap-3 mt-1">
            <Badge className={stageColor}>{stageLabel}</Badge>
            {deal.deal_number && (
              <span className="text-xs text-muted-foreground num">
                {deal.deal_number}
              </span>
            )}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Asking Price</p>
            <p className="text-lg font-semibold num">
              {deal.asking_price ? formatCurrency(deal.asking_price) : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Offer Price</p>
            <p className="text-lg font-semibold num">
              {deal.offer_price ? formatCurrency(deal.offer_price) : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Target IRR</p>
            <p className="text-lg font-semibold num">
              {deal.target_irr != null
                ? formatPercent(deal.target_irr)
                : "TBD"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Tasks</p>
            <p className="text-lg font-semibold num">
              {completedTasks}/{totalTasks}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" strokeWidth={1.5} />
                Deal Details
              </CardTitle>
              <EditButton onClick={() => setEditDealOpen(true)} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium capitalize">
                  {deal.source?.replace(/_/g, " ") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned To</dt>
                <dd className="font-medium flex items-center gap-1">
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {assignedToName ?? "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Purchase Price</dt>
                <dd className="font-medium num">
                  {deal.purchase_price
                    ? formatCurrency(deal.purchase_price)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expected Close</dt>
                <dd className="font-medium num">
                  {formatDate(deal.expected_close_date)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Actual Close</dt>
                <dd className="font-medium num">
                  {formatDate(deal.actual_close_date)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium num">
                  {formatDate(deal.created_at)}
                </dd>
              </div>
              {deal.loss_reason && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Loss Reason</dt>
                  <dd className="font-medium text-red-600 capitalize">
                    {deal.loss_reason.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                Property
              </CardTitle>
              {property && (
                <EditButton onClick={() => setEditPropertyOpen(true)} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {property ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium">{propertyAddress ?? "—"}</dd>
                </div>
                {property.asset_type && (
                  <div>
                    <dt className="text-muted-foreground">Asset Type</dt>
                    <dd className="font-medium capitalize">
                      {property.asset_type.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
                {property.property_type && (
                  <div>
                    <dt className="text-muted-foreground">Property Type</dt>
                    <dd className="font-medium capitalize">
                      {property.property_type.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
                {property.number_of_units && (
                  <div>
                    <dt className="text-muted-foreground">Units</dt>
                    <dd className="font-medium num">
                      {property.number_of_units}
                    </dd>
                  </div>
                )}
                {property.lot_size_acres && (
                  <div>
                    <dt className="text-muted-foreground">Lot Size</dt>
                    <dd className="font-medium num">
                      {property.lot_size_acres} acres
                    </dd>
                  </div>
                )}
                {property.year_built && (
                  <div>
                    <dt className="text-muted-foreground">Year Built</dt>
                    <dd className="font-medium num">{property.year_built}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No property linked.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Thesis & Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" strokeWidth={1.5} />
                Investment Thesis
              </CardTitle>
              <EditButton onClick={() => setEditNotesOpen(true)} />
            </div>
          </CardHeader>
          <CardContent>
            {deal.investment_thesis ? (
              <p className="text-sm whitespace-pre-wrap">
                {deal.investment_thesis}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No thesis added.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" strokeWidth={1.5} />
              Value-Add Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.value_add_strategy ? (
              <p className="text-sm whitespace-pre-wrap">
                {deal.value_add_strategy}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No strategy added.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tasks ({completedTasks}/{totalTasks} complete)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.status === "completed"
                          ? "bg-green-500"
                          : task.status === "in_progress"
                            ? "bg-blue-500"
                            : task.status === "blocked"
                              ? "bg-red-500"
                              : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.task_name}
                    </span>
                    {task.is_critical_path && (
                      <Badge variant="outline" className="text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="num">{formatDate(task.due_date)}</span>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage History */}
      {stageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" strokeWidth={1.5} />
              Stage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageHistory.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="num text-xs text-muted-foreground w-24 shrink-0">
                    {formatDate(entry.changed_at)}
                  </span>
                  <Badge
                    className={`text-xs ${
                      EQUITY_STAGE_COLORS[entry.from_stage] ??
                      "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {EQUITY_STAGE_LABELS[entry.from_stage] ?? entry.from_stage}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge
                    className={`text-xs ${
                      EQUITY_STAGE_COLORS[entry.to_stage] ??
                      "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {EQUITY_STAGE_LABELS[entry.to_stage] ?? entry.to_stage}
                  </Badge>
                  {entry.duration_in_previous_stage && (
                    <span className="text-xs text-muted-foreground num">
                      ({entry.duration_in_previous_stage})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(deal.notes || deal.internal_notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  General Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
            {deal.internal_notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Internal Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {deal.internal_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialogs */}
      <EditSectionDialog
        open={editDealOpen}
        onOpenChange={setEditDealOpen}
        title="Deal Details"
        fields={dealFields}
        onSave={handleSaveDeal}
      />
      {property && (
        <EditSectionDialog
          open={editPropertyOpen}
          onOpenChange={setEditPropertyOpen}
          title="Property"
          fields={propertyFields}
          onSaveRelated={handleSaveProperty}
        />
      )}
      <EditSectionDialog
        open={editNotesOpen}
        onOpenChange={setEditNotesOpen}
        title="Notes & Strategy"
        fields={notesFields}
        onSave={handleSaveDeal}
      />
    </div>
  );
}
