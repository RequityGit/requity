"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/shared/data-table";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  Search,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  DollarSign,
  Users,
  FileCheck,
  BarChart3,
  Target,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SoftCommitment, CommitmentStatus } from "@/lib/fundraising/types";
import {
  COMMITMENT_STATUS_OPTIONS,
  COMMITMENT_STATUS_COLORS,
} from "@/lib/fundraising/types";
import {
  updateCommitmentStatus,
  updateCommitmentNotes,
  addManualCommitment,
} from "@/lib/fundraising/actions";
import { showSuccess, showError } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  commitments: SoftCommitment[];
  deals: { id: string; name: string; fundraise_slug: string | null }[];
}

export function SoftCommitmentsClient({ commitments, deals }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dealFilter, setDealFilter] = useState<string>("all");
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{
    id: string;
    notes: string;
  } | null>(null);

  // KPI calculations
  const stats = useMemo(() => {
    const totalCommitted = commitments
      .filter((c) => c.status === "pending" || c.status === "confirmed")
      .reduce((s, c) => s + c.commitment_amount, 0);
    const totalSubscribed = commitments
      .filter((c) => c.status === "subscribed")
      .reduce((s, c) => s + c.commitment_amount, 0);
    const uniqueEmails = new Set(commitments.map((c) => c.email)).size;
    const avg = commitments.length > 0
      ? (totalCommitted + totalSubscribed) / commitments.length
      : 0;
    const subscribedCount = commitments.filter(
      (c) => c.status === "subscribed"
    ).length;
    const subscriptionRate =
      commitments.length > 0
        ? ((subscribedCount / commitments.length) * 100).toFixed(1)
        : "0";
    return { totalCommitted, totalSubscribed, uniqueEmails, avg, subscriptionRate };
  }, [commitments]);

  // Filtered data
  const filtered = useMemo(() => {
    return commitments.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (dealFilter !== "all" && c.deal_id !== dealFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.email.toLowerCase().includes(q) &&
          !(c.deal?.name ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [commitments, search, statusFilter, dealFilter]);

  const handleStatusChange = useCallback(
    async (id: string, status: CommitmentStatus) => {
      const result = await updateCommitmentStatus(id, status);
      if (result.error) {
        showError("Could not update status", result.error);
      } else {
        showSuccess("Status updated");
        router.refresh();
      }
    },
    [router]
  );

  const handleSaveNotes = useCallback(async () => {
    if (!notesDialog) return;
    const result = await updateCommitmentNotes(notesDialog.id, notesDialog.notes);
    if (result.error) {
      showError("Could not save notes", result.error);
    } else {
      showSuccess("Notes saved");
      setNotesDialog(null);
      router.refresh();
    }
  }, [notesDialog, router]);

  const columns: Column<SoftCommitment>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => {
        const content = (
          <div>
            <div className="font-medium text-sm">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        );
        return row.contact_id && row.contact?.contact_number ? (
          <Link
            href={`/contacts/${row.contact.contact_number}`}
            className="hover:underline underline-offset-4"
          >
            {content}
          </Link>
        ) : (
          content
        );
      },
    },
    {
      key: "deal",
      header: "Deal",
      cell: (row) => (
        <span className="text-sm">{row.deal?.name ?? "Unknown"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="num text-sm font-medium">
          {formatCurrency(row.commitment_amount)}
        </span>
      ),
    },
    {
      key: "accredited",
      header: "Accredited",
      cell: (row) => (
        <span className="text-sm">
          {row.is_accredited == null ? "-" : row.is_accredited ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={cn(
            "text-xs capitalize",
            COMMITMENT_STATUS_COLORS[row.status as CommitmentStatus]
          )}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "questions",
      header: "Questions",
      cell: (row) =>
        row.questions ? (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={row.questions}>
            {row.questions}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">&mdash;</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setNotesDialog({ id: row.id, notes: row.notes ?? "" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rq-transition max-w-[200px]"
        >
          {row.notes ? (
            <span className="truncate" title={row.notes}>{row.notes}</span>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Add</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.submitted_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COMMITMENT_STATUS_OPTIONS.filter(
              (o) => o.value !== row.status
            ).map((o) => (
              <DropdownMenuItem
                key={o.value}
                onClick={() => handleStatusChange(row.id, o.value)}
              >
                Mark as {o.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() =>
                setNotesDialog({ id: row.id, notes: row.notes ?? "" })
              }
            >
              Edit Notes
            </DropdownMenuItem>
            {row.contact_id && row.contact?.contact_number && (
              <DropdownMenuItem asChild>
                <Link href={`/contacts/${row.contact.contact_number}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View Contact
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          title="Total Committed"
          value={formatCurrency(stats.totalCommitted)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Subscribed"
          value={formatCurrency(stats.totalSubscribed)}
          icon={<FileCheck className="h-4 w-4" />}
        />
        <KpiCard
          title="Unique Investors"
          value={stats.uniqueEmails}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title="Avg Ticket"
          value={formatCurrency(Math.round(stats.avg))}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          title="Subscription Rate"
          value={`${stats.subscriptionRate}%`}
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or deal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={dealFilter} onValueChange={setDealFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Deals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deals</SelectItem>
            {deals.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {COMMITMENT_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowManualDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Manual
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No soft commitments found"
      />

      {/* Manual Commitment Dialog */}
      <ManualCommitmentDialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
        deals={deals}
        onSuccess={() => {
          setShowManualDialog(false);
          router.refresh();
        }}
      />

      {/* Notes Dialog */}
      <Dialog
        open={!!notesDialog}
        onOpenChange={(open) => !open && setNotesDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesDialog?.notes ?? ""}
            onChange={(e) =>
              notesDialog &&
              setNotesDialog({ ...notesDialog, notes: e.target.value })
            }
            rows={4}
            placeholder="Internal notes about this commitment..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Manual Commitment Dialog ───

function ManualCommitmentDialog({
  open,
  onOpenChange,
  deals,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [dealId, setDealId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [accredited, setAccredited] = useState<string>("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setDealId("");
    setName("");
    setEmail("");
    setPhone("");
    setAmount("");
    setAccredited("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await addManualCommitment({
      deal_id: dealId,
      name,
      email,
      phone: phone || undefined,
      commitment_amount: parseFloat(amount) || 0,
      is_accredited: accredited === "yes" ? true : accredited === "no" ? false : undefined,
      notes: notes || undefined,
    });

    if (result.error) {
      showError("Could not add commitment", result.error);
    } else {
      showSuccess("Commitment added");
      reset();
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Commitment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Deal *</Label>
            <Select value={dealId} onValueChange={setDealId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select deal" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Accredited</Label>
            <Select value={accredited} onValueChange={setAccredited}>
              <SelectTrigger>
                <SelectValue placeholder="Unknown" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !dealId || !name || !email || !amount}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Commitment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
