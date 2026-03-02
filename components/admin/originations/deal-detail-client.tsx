"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import {
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  OPPORTUNITY_PIPELINE_STAGES,
  APPROVAL_STATUS_COLORS,
  LOSS_REASONS,
  FUNDING_CHANNELS,
  LOAN_DB_TYPES,
  LOAN_PURPOSES,
  DEBT_TRANCHES,
  INVESTMENT_STRATEGIES,
  DEAL_FINANCING_OPTIONS,
  VALUE_METHODS,
  PREPAYMENT_PENALTY_TYPES,
  RENTAL_STATUSES,
  LEASE_TYPES,
  SNAPSHOT_TYPES,
  SNAPSHOT_SOURCES,
  BORROWER_ROLES,
  ASSET_TYPES,
  BUILDING_CLASSES,
  BUILDING_STATUSES,
  SEWER_SYSTEMS,
  WATER_SYSTEMS,
  PERMITTING_STATUSES,
  FLOOD_ZONES,
  CONDO_STATUSES,
  ENTITY_OWNER_TITLES,
  ENTITY_TYPES,
} from "@/lib/constants";
import {
  updateOpportunityAction,
  moveOpportunityStageAction,
  requestApprovalAction,
  decideApprovalAction,
  addOpportunityBorrowerAction,
  removeOpportunityBorrowerAction,
  createSnapshotAction,
  deleteSnapshotAction,
  updatePropertyAction,
} from "@/app/(authenticated)/admin/originations/actions";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  FileText,
  DollarSign,
  MapPin,
  BarChart3,
  Shield,
  Edit,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealDetailProps {
  opportunity: any;
  property: any | null;
  entity: any | null;
  entityOwners: any[];
  borrowers: any[]; // opportunity_borrowers joined with borrower + crm_contacts
  snapshots: any[];
  teamMembers: { id: string; full_name: string }[];
  allBorrowers: { id: string; name: string; email: string }[];
  isSuperAdmin?: boolean;
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {action}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Field Display
// ---------------------------------------------------------------------------

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DealDetailClient({
  opportunity: initialOpp,
  property: initialProp,
  entity,
  entityOwners,
  borrowers: initialBorrowers,
  snapshots: initialSnapshots,
  teamMembers,
  allBorrowers,
  isSuperAdmin = false,
}: DealDetailProps) {
  const [opp, setOpp] = useState(initialOpp);
  const [property, setProperty] = useState(initialProp);
  const [borrowers, setBorrowers] = useState(initialBorrowers);
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [saving, setSaving] = useState(false);
  const [editingTerms, setEditingTerms] = useState(false);
  const [editingProperty, setEditingProperty] = useState(false);
  const [addBorrowerDialog, setAddBorrowerDialog] = useState(false);
  const [addSnapshotDialog, setAddSnapshotDialog] = useState(false);
  const [lossDialog, setLossDialog] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Term editing state
  const [terms, setTerms] = useState({
    proposed_loan_amount: opp.proposed_loan_amount || "",
    proposed_interest_rate: opp.proposed_interest_rate || "",
    proposed_loan_term_months: opp.proposed_loan_term_months || "",
    proposed_ltv: opp.proposed_ltv || "",
    proposed_ltarv: opp.proposed_ltarv || "",
    loan_type: opp.loan_type || "",
    loan_purpose: opp.loan_purpose || "",
    funding_channel: opp.funding_channel || "",
    value_method: opp.value_method || "",
    cash_to_close: opp.cash_to_close || "",
    source_of_funds: opp.source_of_funds || "",
    capital_partner: opp.capital_partner || "",
    debt_tranche: opp.debt_tranche || "",
    investment_strategy: opp.investment_strategy || "",
    deal_financing: opp.deal_financing || "",
    prepayment_penalty_type: opp.prepayment_penalty_type || "",
    prepayment_penalty_pct: opp.prepayment_penalty_pct || "",
    prepayment_penalty_months: opp.prepayment_penalty_months || "",
    prepayment_terms: opp.prepayment_terms || "",
    occupancy_pct: opp.occupancy_pct || "",
    rental_status: opp.rental_status || "",
    lease_type: opp.lease_type || "",
    secondary_liens: opp.secondary_liens || false,
    originator: opp.originator || "",
    processor: opp.processor || "",
    assigned_underwriter: opp.assigned_underwriter || "",
    internal_notes: opp.internal_notes || "",
  });

  // Property editing state
  const [propForm, setPropForm] = useState({
    address_line1: property?.address_line1 || "",
    address_line2: property?.address_line2 || "",
    city: property?.city || "",
    state: property?.state || "",
    zip: property?.zip || "",
    county: property?.county || "",
    asset_type: property?.asset_type || "",
    property_type: property?.property_type || "",
    building_class: property?.building_class || "",
    building_status: property?.building_status || "",
    year_built: property?.year_built || "",
    number_of_units: property?.number_of_units || "",
    lot_size_acres: property?.lot_size_acres || "",
    gross_building_area_sqft: property?.gross_building_area_sqft || "",
    net_rentable_area_sqft: property?.net_rentable_area_sqft || "",
    number_of_stories: property?.number_of_stories || "",
    number_of_buildings: property?.number_of_buildings || "",
    sewer_system: property?.sewer_system || "",
    water_system: property?.water_system || "",
    flood_zone: property?.flood_zone || "",
    permitting_status: property?.permitting_status || "",
    condo_status: property?.condo_status || "",
    zoning: property?.zoning || "",
    parcel_id: property?.parcel_id || "",
  });

  // Snapshot form state
  const [snapshotForm, setSnapshotForm] = useState({
    snapshot_type: "",
    effective_date: "",
    source: "",
    gross_scheduled_rent: "",
    vacancy_loss: "",
    vacancy_rate_pct: "",
    other_income: "",
    effective_gross_income: "",
    total_operating_expenses: "",
    taxes: "",
    insurance: "",
    management_fee: "",
    repairs_maintenance: "",
    net_operating_income: "",
    occupancy_pct: "",
    number_of_occupied_units: "",
    number_of_vacant_units: "",
    avg_rent_per_unit: "",
    dscr: "",
    notes: "",
  });

  // Add borrower state
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("");
  const [selectedBorrowerRole, setSelectedBorrowerRole] = useState("co_borrower");

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  async function saveTerms() {
    setSaving(true);
    const updates: any = {};
    for (const [key, val] of Object.entries(terms)) {
      if (key === "secondary_liens") {
        updates[key] = val;
      } else if (val === "") {
        updates[key] = null;
      } else if (
        [
          "proposed_loan_amount",
          "proposed_interest_rate",
          "proposed_loan_term_months",
          "proposed_ltv",
          "proposed_ltarv",
          "cash_to_close",
          "prepayment_penalty_pct",
          "prepayment_penalty_months",
          "occupancy_pct",
        ].includes(key)
      ) {
        updates[key] = Number(val) || null;
      } else {
        updates[key] = val;
      }
    }

    const result = await updateOpportunityAction({ id: opp.id, ...updates });
    if (result.error) {
      toast({ title: "Error saving", description: result.error, variant: "destructive" });
    } else {
      setOpp({ ...opp, ...updates });
      setEditingTerms(false);
      toast({ title: "Deal terms saved" });
    }
    setSaving(false);
  }

  async function saveProperty() {
    if (!property?.id) return;
    setSaving(true);
    const updates: any = {};
    for (const [key, val] of Object.entries(propForm)) {
      if (val === "") {
        updates[key] = null;
      } else if (["year_built", "number_of_units", "number_of_stories", "number_of_buildings"].includes(key)) {
        updates[key] = Number(val) || null;
      } else if (["lot_size_acres", "gross_building_area_sqft", "net_rentable_area_sqft"].includes(key)) {
        updates[key] = Number(val) || null;
      } else {
        updates[key] = val;
      }
    }

    const result = await updatePropertyAction(property.id, updates);
    if (result.error) {
      toast({ title: "Error saving property", description: result.error, variant: "destructive" });
    } else {
      setProperty({ ...property, ...updates });
      setEditingProperty(false);
      toast({ title: "Property updated" });
    }
    setSaving(false);
  }

  async function handleMoveStage(newStage: string) {
    if (newStage === "closed_lost") {
      setLossDialog(true);
      return;
    }
    setSaving(true);
    const result = await moveOpportunityStageAction(opp.id, newStage);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setOpp({ ...opp, stage: newStage, stage_changed_at: new Date().toISOString() });
      toast({ title: `Moved to ${OPPORTUNITY_STAGE_LABELS[newStage]}` });
    }
    setSaving(false);
  }

  async function handleCloseLost() {
    if (!lossReason) return;
    setSaving(true);
    const result = await moveOpportunityStageAction(opp.id, "closed_lost", lossReason);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setOpp({ ...opp, stage: "closed_lost", loss_reason: lossReason });
      toast({ title: "Deal closed as lost" });
    }
    setSaving(false);
    setLossDialog(false);
    setLossReason("");
  }

  async function handleRequestApproval() {
    setSaving(true);
    const result = await requestApprovalAction(opp.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setOpp({ ...opp, approval_status: "pending", approval_requested_at: new Date().toISOString() });
      toast({ title: "Approval requested" });
    }
    setSaving(false);
  }

  async function handleDecideApproval(decision: "approved" | "denied") {
    setSaving(true);
    const result = await decideApprovalAction(opp.id, decision);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setOpp({ ...opp, approval_status: decision, approval_decided_at: new Date().toISOString() });
      toast({ title: decision === "approved" ? "Deal approved" : "Deal denied" });
    }
    setSaving(false);
  }

  async function handleAddBorrower() {
    if (!selectedBorrowerId) return;
    setSaving(true);
    const result = await addOpportunityBorrowerAction(opp.id, selectedBorrowerId, selectedBorrowerRole);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Borrower added" });
      router.refresh();
    }
    setSaving(false);
    setAddBorrowerDialog(false);
    setSelectedBorrowerId("");
    setSelectedBorrowerRole("co_borrower");
  }

  async function handleRemoveBorrower(borrowerId: string) {
    setSaving(true);
    const result = await removeOpportunityBorrowerAction(opp.id, borrowerId);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setBorrowers(borrowers.filter((b: any) => b.borrower_id !== borrowerId));
      toast({ title: "Borrower removed" });
    }
    setSaving(false);
  }

  async function handleCreateSnapshot() {
    if (!snapshotForm.snapshot_type || !snapshotForm.effective_date || !property?.id) return;
    setSaving(true);
    const numericFields = [
      "gross_scheduled_rent", "vacancy_loss", "vacancy_rate_pct", "other_income",
      "effective_gross_income", "total_operating_expenses", "taxes", "insurance",
      "management_fee", "repairs_maintenance", "net_operating_income", "occupancy_pct",
      "avg_rent_per_unit", "dscr",
    ];
    const input: any = {
      property_id: property.id,
      opportunity_id: opp.id,
      snapshot_type: snapshotForm.snapshot_type,
      effective_date: snapshotForm.effective_date,
      source: snapshotForm.source || undefined,
      notes: snapshotForm.notes || undefined,
    };
    for (const f of numericFields) {
      const val = (snapshotForm as any)[f];
      if (val !== "" && val != null) input[f] = Number(val);
    }
    if (snapshotForm.number_of_occupied_units) input.number_of_occupied_units = Number(snapshotForm.number_of_occupied_units);
    if (snapshotForm.number_of_vacant_units) input.number_of_vacant_units = Number(snapshotForm.number_of_vacant_units);

    const result = await createSnapshotAction(input);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Snapshot created" });
      router.refresh();
    }
    setSaving(false);
    setAddSnapshotDialog(false);
    setSnapshotForm({
      snapshot_type: "", effective_date: "", source: "",
      gross_scheduled_rent: "", vacancy_loss: "", vacancy_rate_pct: "",
      other_income: "", effective_gross_income: "", total_operating_expenses: "",
      taxes: "", insurance: "", management_fee: "", repairs_maintenance: "",
      net_operating_income: "", occupancy_pct: "", number_of_occupied_units: "",
      number_of_vacant_units: "", avg_rent_per_unit: "", dscr: "", notes: "",
    });
  }

  async function handleDeleteSnapshot(snapshotId: string) {
    setSaving(true);
    const result = await deleteSnapshotAction(snapshotId);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setSnapshots(snapshots.filter((s: any) => s.id !== snapshotId));
      toast({ title: "Snapshot deleted" });
    }
    setSaving(false);
  }

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const currentStageIndex = OPPORTUNITY_PIPELINE_STAGES.indexOf(opp.stage as any);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < OPPORTUNITY_PIPELINE_STAGES.length - 1
    ? OPPORTUNITY_PIPELINE_STAGES[currentStageIndex + 1]
    : null;
  const prevStage = currentStageIndex > 0 ? OPPORTUNITY_PIPELINE_STAGES[currentStageIndex - 1] : null;
  const showLeaseType = property?.property_type && ["retail", "office", "industrial", "mixed_use"].includes(property.property_type);
  const combinedLiquidity = borrowers.reduce((sum: number, b: any) => sum + (b.verified_liquidity_at_intake || 0), 0);
  const combinedNetWorth = borrowers.reduce((sum: number, b: any) => sum + (b.verified_net_worth_at_intake || 0), 0);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className={`text-sm px-3 py-1 ${OPPORTUNITY_STAGE_COLORS[opp.stage] || ""}`}>
              {OPPORTUNITY_STAGE_LABELS[opp.stage] || opp.stage}
            </Badge>
            <h1 className="text-xl font-bold text-foreground">
              {opp.deal_name || property?.address_line1 || "Untitled Deal"}
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {opp.loan_type && (
              <span>{LOAN_DB_TYPES.find((t) => t.value === opp.loan_type)?.label || opp.loan_type}</span>
            )}
            {opp.loan_purpose && (
              <span>{LOAN_PURPOSES.find((p) => p.value === opp.loan_purpose)?.label || opp.loan_purpose}</span>
            )}
            {opp.funding_channel && (
              <span>{FUNDING_CHANNELS.find((f) => f.value === opp.funding_channel)?.label || opp.funding_channel}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {opp.stage === "uw" && opp.approval_status !== "pending" && opp.approval_status !== "approved" && opp.approval_status !== "auto_approved" && (
            <Button size="sm" onClick={handleRequestApproval} disabled={saving}>
              <Shield className="h-4 w-4 mr-1" /> Request Approval
            </Button>
          )}
          {opp.approval_status && opp.approval_status !== "not_required" && (
            <Badge className={`${APPROVAL_STATUS_COLORS[opp.approval_status] || ""}`}>
              {opp.approval_status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Badge>
          )}
          {isSuperAdmin && opp.approval_status === "pending" && (
            <>
              <Button size="sm" onClick={() => handleDecideApproval("approved")} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDecideApproval("denied")} disabled={saving} className="text-red-600 border-red-300 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-1" /> Deny
              </Button>
            </>
          )}
          {prevStage && (
            <Button variant="outline" size="sm" onClick={() => handleMoveStage(prevStage)} disabled={saving}>
              Back to {OPPORTUNITY_STAGE_LABELS[prevStage]}
            </Button>
          )}
          {nextStage && (
            <Button size="sm" onClick={() => handleMoveStage(nextStage)} disabled={saving}>
              Move to {OPPORTUNITY_STAGE_LABELS[nextStage]}
            </Button>
          )}
          {opp.stage !== "closed_lost" && (
            <Button variant="outline" size="sm" className="text-red-600" onClick={() => setLossDialog(true)} disabled={saving}>
              Close Lost
            </Button>
          )}
        </div>
      </div>

      {/* ═══ PROPERTY ═══ */}
      <Section
        title="Property"
        icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        action={
          property && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingProperty(true); }}>
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
          )
        }
      >
        {property ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Address" value={[property.address_line1, property.address_line2].filter(Boolean).join(", ")} className="col-span-2" />
            <Field label="City" value={property.city} />
            <Field label="State" value={property.state} />
            <Field label="ZIP" value={property.zip} />
            <Field label="County" value={property.county} />
            <Field label="Parcel ID" value={property.parcel_id} />
            <Field label="Asset Type" value={property.asset_type} />
            <Field label="Property Type" value={property.property_type} />
            <Field label="Building Class" value={BUILDING_CLASSES.find((b) => b.value === property.building_class)?.label} />
            <Field label="Building Status" value={BUILDING_STATUSES.find((b) => b.value === property.building_status)?.label} />
            <Field label="Year Built" value={property.year_built} />
            <Field label="Units" value={property.number_of_units} />
            <Field label="Lot Size (Acres)" value={property.lot_size_acres} />
            <Field label="GBA (sqft)" value={property.gross_building_area_sqft?.toLocaleString()} />
            <Field label="Sewer" value={SEWER_SYSTEMS.find((s) => s.value === property.sewer_system)?.label} />
            <Field label="Water" value={WATER_SYSTEMS.find((w) => w.value === property.water_system)?.label} />
            <Field label="Flood Zone" value={property.flood_zone} />
            <Field label="Permits" value={PERMITTING_STATUSES.find((p) => p.value === property.permitting_status)?.label} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No property linked to this deal.</p>
        )}
      </Section>

      {/* ═══ PROPERTY FINANCIALS ═══ */}
      <Section
        title="Property Financials"
        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        action={
          property && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setAddSnapshotDialog(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Add Snapshot
            </Button>
          )
        }
      >
        {snapshots.length > 0 ? (
          <div className="space-y-3">
            {snapshots.map((snap: any) => (
              <Card key={snap.id} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {SNAPSHOT_TYPES.find((t) => t.value === snap.snapshot_type)?.label || snap.snapshot_type}
                      </Badge>
                      {snap.source && (
                        <span className="text-xs text-muted-foreground">
                          ({SNAPSHOT_SOURCES.find((s) => s.value === snap.source)?.label || snap.source})
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        As of: {formatDate(snap.effective_date)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteSnapshot(snap.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {snap.occupancy_pct != null && <Field label="Occupancy" value={`${snap.occupancy_pct}%`} />}
                    {snap.avg_rent_per_unit != null && <Field label="Avg Rent/Unit" value={formatCurrency(snap.avg_rent_per_unit) + "/mo"} />}
                    {snap.gross_scheduled_rent != null && <Field label="Gross Scheduled" value={formatCurrency(snap.gross_scheduled_rent) + "/yr"} />}
                    {snap.vacancy_loss != null && <Field label="Vacancy Loss" value={formatCurrency(snap.vacancy_loss) + "/yr"} />}
                    {snap.effective_gross_income != null && <Field label="EGI" value={formatCurrency(snap.effective_gross_income) + "/yr"} />}
                    {snap.total_operating_expenses != null && <Field label="OpEx" value={formatCurrency(snap.total_operating_expenses) + "/yr"} />}
                    {snap.net_operating_income != null && <Field label="NOI" value={formatCurrency(snap.net_operating_income) + "/yr"} />}
                    {snap.dscr != null && <Field label="DSCR" value={`${snap.dscr}x`} />}
                    {snap.taxes != null && <Field label="Taxes" value={formatCurrency(snap.taxes)} />}
                    {snap.insurance != null && <Field label="Insurance" value={formatCurrency(snap.insurance)} />}
                  </div>
                  {snap.notes && <p className="text-xs text-muted-foreground mt-2 italic">{snap.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No financial snapshots yet.</p>
        )}
      </Section>

      {/* ═══ BORROWING ENTITY ═══ */}
      <Section
        title="Borrowing Entity"
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
      >
        {entity ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Field label="Entity Name" value={entity.entity_name} />
              <Field label="Entity Type" value={ENTITY_TYPES.find((t) => t.value === entity.entity_type)?.label || entity.entity_type} />
              <Field label="EIN" value={entity.ein ? "**-*******" : "—"} />
              <Field label="State of Formation" value={entity.state_of_formation} />
              {entity.formation_date && <Field label="Formation Date" value={formatDate(entity.formation_date)} />}
            </div>
            {entityOwners.length > 0 && (
              <>
                <Separator className="my-3" />
                <p className="text-sm font-medium mb-2">Owners</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Name</th>
                        <th className="text-left px-3 py-2 font-medium">%</th>
                        <th className="text-left px-3 py-2 font-medium">Title</th>
                        <th className="text-center px-3 py-2 font-medium">Signing</th>
                        <th className="text-center px-3 py-2 font-medium">Guarantor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entityOwners.map((owner: any) => (
                        <tr key={owner.id} className="border-t">
                          <td className="px-3 py-2">{owner.borrower_name || "—"}</td>
                          <td className="px-3 py-2">{owner.ownership_pct != null ? `${owner.ownership_pct}%` : "—"}</td>
                          <td className="px-3 py-2">{ENTITY_OWNER_TITLES.find((t) => t.value === owner.title)?.label || owner.title || "—"}</td>
                          <td className="px-3 py-2 text-center">{owner.is_signing_member ? "Yes" : ""}</td>
                          <td className="px-3 py-2 text-center">{owner.is_guarantor ? "Yes" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No entity linked to this deal.</p>
        )}
      </Section>

      {/* ═══ BORROWERS ═══ */}
      <Section
        title="Borrowers"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        action={
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setAddBorrowerDialog(true); }}>
            <Plus className="h-3 w-3 mr-1" /> Add Borrower
          </Button>
        }
      >
        {borrowers.length > 0 ? (
          <div className="space-y-3">
            {borrowers.map((b: any, idx: number) => (
              <Card key={b.id || idx} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        B{b.sort_order || idx + 1}
                      </Badge>
                      <span className="text-sm font-medium">
                        {b.borrower_name || "Unknown"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {BORROWER_ROLES.find((r) => r.value === b.role)?.label || b.role}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() =>
                        setConfirmDialog({
                          message: `Remove ${b.borrower_name || "this borrower"} from this deal?`,
                          onConfirm: () => handleRemoveBorrower(b.borrower_id),
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {b.email && <Field label="Email" value={b.email} />}
                    {b.phone && <Field label="Phone" value={b.phone} />}
                    <Field label="Credit Score" value={b.credit_score_at_intake} />
                    <Field label="Credit Report Date" value={formatDate(b.credit_report_date_at_intake)} />
                    <Field label="Stated Liquidity" value={formatCurrency(b.stated_liquidity_at_intake)} />
                    <Field label="Verified Liquidity" value={formatCurrency(b.verified_liquidity_at_intake)} />
                    <Field label="Stated Net Worth" value={formatCurrency(b.stated_net_worth_at_intake)} />
                    <Field label="Verified Net Worth" value={formatCurrency(b.verified_net_worth_at_intake)} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Field label="Combined Liquidity (auto)" value={formatCurrency(combinedLiquidity)} />
              <Field label="Combined Net Worth (auto)" value={formatCurrency(combinedNetWorth)} />
              <Field label="Number of Borrowers" value={borrowers.length} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No borrowers added to this deal.</p>
        )}
      </Section>

      {/* ═══ DEAL TERMS ═══ */}
      <Section
        title="Deal Terms"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        action={
          !editingTerms ? (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingTerms(true); }}>
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingTerms(false); }}>Cancel</Button>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); saveTerms(); }} disabled={saving}>Save</Button>
            </div>
          )
        }
      >
        {editingTerms ? (
          <div className="space-y-6">
            {/* Proposed Terms */}
            <div>
              <p className="text-sm font-medium mb-2">Proposed Loan Terms</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Loan Amount</Label><Input type="number" value={terms.proposed_loan_amount} onChange={(e) => setTerms({ ...terms, proposed_loan_amount: e.target.value })} /></div>
                <div><Label className="text-xs">Interest Rate (%)</Label><Input type="number" step="0.01" value={terms.proposed_interest_rate} onChange={(e) => setTerms({ ...terms, proposed_interest_rate: e.target.value })} /></div>
                <div><Label className="text-xs">Term (months)</Label><Input type="number" value={terms.proposed_loan_term_months} onChange={(e) => setTerms({ ...terms, proposed_loan_term_months: e.target.value })} /></div>
                <div><Label className="text-xs">LTV (%)</Label><Input type="number" step="0.01" value={terms.proposed_ltv} onChange={(e) => setTerms({ ...terms, proposed_ltv: e.target.value })} /></div>
                <div><Label className="text-xs">LTARV (%)</Label><Input type="number" step="0.01" value={terms.proposed_ltarv} onChange={(e) => setTerms({ ...terms, proposed_ltarv: e.target.value })} /></div>
                <div>
                  <Label className="text-xs">Loan Type</Label>
                  <Select value={terms.loan_type} onValueChange={(v) => setTerms({ ...terms, loan_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{LOAN_DB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Purpose</Label>
                  <Select value={terms.loan_purpose} onValueChange={(v) => setTerms({ ...terms, loan_purpose: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{LOAN_PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Funding */}
            <div>
              <p className="text-sm font-medium mb-2">Funding</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Funding Channel</Label>
                  <Select value={terms.funding_channel} onValueChange={(v) => setTerms({ ...terms, funding_channel: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FUNDING_CHANNELS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Capital Partner</Label><Input value={terms.capital_partner} onChange={(e) => setTerms({ ...terms, capital_partner: e.target.value })} /></div>
                <div><Label className="text-xs">Cash to Close</Label><Input type="number" value={terms.cash_to_close} onChange={(e) => setTerms({ ...terms, cash_to_close: e.target.value })} /></div>
                <div><Label className="text-xs">Source of Funds</Label><Input value={terms.source_of_funds} onChange={(e) => setTerms({ ...terms, source_of_funds: e.target.value })} /></div>
              </div>
            </div>
            {/* Classification */}
            <div>
              <p className="text-sm font-medium mb-2">Classification</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Debt Tranche</Label>
                  <Select value={terms.debt_tranche} onValueChange={(v) => setTerms({ ...terms, debt_tranche: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{DEBT_TRANCHES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Investment Strategy</Label>
                  <Select value={terms.investment_strategy} onValueChange={(v) => setTerms({ ...terms, investment_strategy: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{INVESTMENT_STRATEGIES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Deal Financing</Label>
                  <Select value={terms.deal_financing} onValueChange={(v) => setTerms({ ...terms, deal_financing: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{DEAL_FINANCING_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value Method</Label>
                  <Select value={terms.value_method} onValueChange={(v) => setTerms({ ...terms, value_method: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{VALUE_METHODS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Prepayment */}
            <div>
              <p className="text-sm font-medium mb-2">Prepayment</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Penalty Type</Label>
                  <Select value={terms.prepayment_penalty_type} onValueChange={(v) => setTerms({ ...terms, prepayment_penalty_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PREPAYMENT_PENALTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Penalty %</Label><Input type="number" step="0.01" value={terms.prepayment_penalty_pct} onChange={(e) => setTerms({ ...terms, prepayment_penalty_pct: e.target.value })} /></div>
                <div><Label className="text-xs">Penalty Months</Label><Input type="number" value={terms.prepayment_penalty_months} onChange={(e) => setTerms({ ...terms, prepayment_penalty_months: e.target.value })} /></div>
                <div><Label className="text-xs">Step-Down Schedule</Label><Input value={terms.prepayment_terms} onChange={(e) => setTerms({ ...terms, prepayment_terms: e.target.value })} placeholder="e.g. 5/4/3/2/1" /></div>
              </div>
            </div>
            {/* Deal-specific property conditions */}
            <div>
              <p className="text-sm font-medium mb-2">Deal-Specific Property Conditions</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Occupancy %</Label><Input type="number" value={terms.occupancy_pct} onChange={(e) => setTerms({ ...terms, occupancy_pct: e.target.value })} /></div>
                <div>
                  <Label className="text-xs">Rental Status</Label>
                  <Select value={terms.rental_status} onValueChange={(v) => setTerms({ ...terms, rental_status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{RENTAL_STATUSES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {showLeaseType && (
                  <div>
                    <Label className="text-xs">Lease Type</Label>
                    <Select value={terms.lease_type} onValueChange={(v) => setTerms({ ...terms, lease_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{LEASE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            {/* Team */}
            <div>
              <p className="text-sm font-medium mb-2">Team</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Originator</Label>
                  <Select value={terms.originator} onValueChange={(v) => setTerms({ ...terms, originator: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{teamMembers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Processor</Label>
                  <Select value={terms.processor} onValueChange={(v) => setTerms({ ...terms, processor: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{teamMembers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Underwriter</Label>
                  <Select value={terms.assigned_underwriter} onValueChange={(v) => setTerms({ ...terms, assigned_underwriter: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{teamMembers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Notes */}
            <div>
              <Label className="text-xs">Internal Notes</Label>
              <Textarea value={terms.internal_notes} onChange={(e) => setTerms({ ...terms, internal_notes: e.target.value })} rows={3} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Proposed Amount" value={formatCurrency(opp.proposed_loan_amount)} />
              <Field label="Interest Rate" value={opp.proposed_interest_rate ? `${opp.proposed_interest_rate}%` : "—"} />
              <Field label="Term" value={opp.proposed_loan_term_months ? `${opp.proposed_loan_term_months} months` : "—"} />
              <Field label="LTV" value={opp.proposed_ltv ? `${opp.proposed_ltv}%` : "—"} />
              <Field label="LTARV" value={opp.proposed_ltarv ? `${opp.proposed_ltarv}%` : "—"} />
              <Field label="Funding Channel" value={FUNDING_CHANNELS.find((f) => f.value === opp.funding_channel)?.label} />
              <Field label="Capital Partner" value={opp.capital_partner} />
              <Field label="Value Method" value={VALUE_METHODS.find((v) => v.value === opp.value_method)?.label} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Cash to Close" value={formatCurrency(opp.cash_to_close)} />
              <Field label="Source of Funds" value={opp.source_of_funds} />
              <Field label="Debt Tranche" value={DEBT_TRANCHES.find((d) => d.value === opp.debt_tranche)?.label} />
              <Field label="Investment Strategy" value={INVESTMENT_STRATEGIES.find((i) => i.value === opp.investment_strategy)?.label} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Originator" value={teamMembers.find((t) => t.id === opp.originator)?.full_name} />
              <Field label="Processor" value={teamMembers.find((t) => t.id === opp.processor)?.full_name} />
              <Field label="Underwriter" value={teamMembers.find((t) => t.id === opp.assigned_underwriter)?.full_name} />
            </div>
            {opp.internal_notes && (
              <>
                <Separator />
                <Field label="Internal Notes" value={opp.internal_notes} />
              </>
            )}
          </div>
        )}
      </Section>

      {/* ═══ DIALOGS ═══ */}

      {/* Closed Lost Dialog */}
      <Dialog open={lossDialog} onOpenChange={setLossDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Deal as Lost</DialogTitle>
            <DialogDescription>Select the reason for closing this deal.</DialogDescription>
          </DialogHeader>
          <Select value={lossReason} onValueChange={setLossReason}>
            <SelectTrigger><SelectValue placeholder="Select loss reason" /></SelectTrigger>
            <SelectContent>
              {LOSS_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLossDialog(false); setLossReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleCloseLost} disabled={!lossReason || saving}>Close as Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Borrower Dialog */}
      <Dialog open={addBorrowerDialog} onOpenChange={setAddBorrowerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Borrower to Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Borrower</Label>
              <Select value={selectedBorrowerId} onValueChange={setSelectedBorrowerId}>
                <SelectTrigger><SelectValue placeholder="Select borrower" /></SelectTrigger>
                <SelectContent>
                  {allBorrowers
                    .filter((ab) => !borrowers.some((b: any) => b.borrower_id === ab.id))
                    .map((ab) => (
                      <SelectItem key={ab.id} value={ab.id}>
                        {ab.name} {ab.email ? `(${ab.email})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={selectedBorrowerRole} onValueChange={setSelectedBorrowerRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BORROWER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBorrowerDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBorrower} disabled={!selectedBorrowerId || saving}>Add Borrower</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Snapshot Dialog */}
      <Dialog open={addSnapshotDialog} onOpenChange={setAddSnapshotDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Financial Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={snapshotForm.snapshot_type} onValueChange={(v) => setSnapshotForm({ ...snapshotForm, snapshot_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SNAPSHOT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Effective Date *</Label>
                <Input type="date" value={snapshotForm.effective_date} onChange={(e) => setSnapshotForm({ ...snapshotForm, effective_date: e.target.value })} />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={snapshotForm.source} onValueChange={(v) => setSnapshotForm({ ...snapshotForm, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SNAPSHOT_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <p className="text-sm font-medium">Income ($/yr)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Gross Scheduled Rent</Label><Input type="number" value={snapshotForm.gross_scheduled_rent} onChange={(e) => setSnapshotForm({ ...snapshotForm, gross_scheduled_rent: e.target.value })} /></div>
              <div><Label className="text-xs">Vacancy Loss</Label><Input type="number" value={snapshotForm.vacancy_loss} onChange={(e) => setSnapshotForm({ ...snapshotForm, vacancy_loss: e.target.value })} /></div>
              <div><Label className="text-xs">Vacancy Rate %</Label><Input type="number" value={snapshotForm.vacancy_rate_pct} onChange={(e) => setSnapshotForm({ ...snapshotForm, vacancy_rate_pct: e.target.value })} /></div>
              <div><Label className="text-xs">Other Income</Label><Input type="number" value={snapshotForm.other_income} onChange={(e) => setSnapshotForm({ ...snapshotForm, other_income: e.target.value })} /></div>
              <div><Label className="text-xs">EGI</Label><Input type="number" value={snapshotForm.effective_gross_income} onChange={(e) => setSnapshotForm({ ...snapshotForm, effective_gross_income: e.target.value })} /></div>
            </div>
            <Separator />
            <p className="text-sm font-medium">Expenses ($/yr)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Total OpEx</Label><Input type="number" value={snapshotForm.total_operating_expenses} onChange={(e) => setSnapshotForm({ ...snapshotForm, total_operating_expenses: e.target.value })} /></div>
              <div><Label className="text-xs">Taxes</Label><Input type="number" value={snapshotForm.taxes} onChange={(e) => setSnapshotForm({ ...snapshotForm, taxes: e.target.value })} /></div>
              <div><Label className="text-xs">Insurance</Label><Input type="number" value={snapshotForm.insurance} onChange={(e) => setSnapshotForm({ ...snapshotForm, insurance: e.target.value })} /></div>
              <div><Label className="text-xs">Management Fee</Label><Input type="number" value={snapshotForm.management_fee} onChange={(e) => setSnapshotForm({ ...snapshotForm, management_fee: e.target.value })} /></div>
              <div><Label className="text-xs">R&M</Label><Input type="number" value={snapshotForm.repairs_maintenance} onChange={(e) => setSnapshotForm({ ...snapshotForm, repairs_maintenance: e.target.value })} /></div>
            </div>
            <Separator />
            <p className="text-sm font-medium">Performance</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">NOI</Label><Input type="number" value={snapshotForm.net_operating_income} onChange={(e) => setSnapshotForm({ ...snapshotForm, net_operating_income: e.target.value })} /></div>
              <div><Label className="text-xs">Occupancy %</Label><Input type="number" value={snapshotForm.occupancy_pct} onChange={(e) => setSnapshotForm({ ...snapshotForm, occupancy_pct: e.target.value })} /></div>
              <div><Label className="text-xs">Avg Rent/Unit ($/mo)</Label><Input type="number" value={snapshotForm.avg_rent_per_unit} onChange={(e) => setSnapshotForm({ ...snapshotForm, avg_rent_per_unit: e.target.value })} /></div>
              <div><Label className="text-xs">Occupied Units</Label><Input type="number" value={snapshotForm.number_of_occupied_units} onChange={(e) => setSnapshotForm({ ...snapshotForm, number_of_occupied_units: e.target.value })} /></div>
              <div><Label className="text-xs">Vacant Units</Label><Input type="number" value={snapshotForm.number_of_vacant_units} onChange={(e) => setSnapshotForm({ ...snapshotForm, number_of_vacant_units: e.target.value })} /></div>
              <div><Label className="text-xs">DSCR</Label><Input type="number" step="0.01" value={snapshotForm.dscr} onChange={(e) => setSnapshotForm({ ...snapshotForm, dscr: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={snapshotForm.notes} onChange={(e) => setSnapshotForm({ ...snapshotForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSnapshotDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSnapshot} disabled={!snapshotForm.snapshot_type || !snapshotForm.effective_date || saving}>Create Snapshot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={editingProperty} onOpenChange={setEditingProperty}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              This updates the property record across all deals that reference it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Address Line 1</Label><Input value={propForm.address_line1} onChange={(e) => setPropForm({ ...propForm, address_line1: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Address Line 2</Label><Input value={propForm.address_line2} onChange={(e) => setPropForm({ ...propForm, address_line2: e.target.value })} /></div>
              <div><Label className="text-xs">City</Label><Input value={propForm.city} onChange={(e) => setPropForm({ ...propForm, city: e.target.value })} /></div>
              <div><Label className="text-xs">State</Label><Input value={propForm.state} onChange={(e) => setPropForm({ ...propForm, state: e.target.value })} /></div>
              <div><Label className="text-xs">ZIP</Label><Input value={propForm.zip} onChange={(e) => setPropForm({ ...propForm, zip: e.target.value })} /></div>
              <div><Label className="text-xs">County</Label><Input value={propForm.county} onChange={(e) => setPropForm({ ...propForm, county: e.target.value })} /></div>
              <div><Label className="text-xs">Parcel ID</Label><Input value={propForm.parcel_id} onChange={(e) => setPropForm({ ...propForm, parcel_id: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Asset Type</Label>
                <Select value={propForm.asset_type} onValueChange={(v) => setPropForm({ ...propForm, asset_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Building Class</Label>
                <Select value={propForm.building_class} onValueChange={(v) => setPropForm({ ...propForm, building_class: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BUILDING_CLASSES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Building Status</Label>
                <Select value={propForm.building_status} onValueChange={(v) => setPropForm({ ...propForm, building_status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BUILDING_STATUSES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Year Built</Label><Input type="number" value={propForm.year_built} onChange={(e) => setPropForm({ ...propForm, year_built: e.target.value })} /></div>
              <div><Label className="text-xs">Units</Label><Input type="number" value={propForm.number_of_units} onChange={(e) => setPropForm({ ...propForm, number_of_units: e.target.value })} /></div>
              <div><Label className="text-xs">Lot Size (Acres)</Label><Input type="number" step="0.01" value={propForm.lot_size_acres} onChange={(e) => setPropForm({ ...propForm, lot_size_acres: e.target.value })} /></div>
              <div><Label className="text-xs">GBA (sqft)</Label><Input type="number" value={propForm.gross_building_area_sqft} onChange={(e) => setPropForm({ ...propForm, gross_building_area_sqft: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProperty(false)}>Cancel</Button>
            <Button onClick={saveProperty} disabled={saving}>Save Property</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog?.onConfirm(); setConfirmDialog(null); }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
