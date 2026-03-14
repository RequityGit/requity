"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { DealBorrowerMember } from "@/app/types/borrower";
import { BORROWER_ROLES } from "./constants";
import { updateBorrowerMemberAction, removeBorrowerMemberAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function contactName(m: DealBorrowerMember): string {
  const c = m.contact;
  if (!c) return "Unknown";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const FICO_MIN = 300;
const FICO_MAX = 850;

interface BorrowerMemberRowProps {
  member: DealBorrowerMember;
  dealId: string;
  onOptimisticUpdate: (memberId: string, updates: Partial<DealBorrowerMember>) => void;
  onUpdated: () => void;
}

export function BorrowerMemberRow({ member, dealId, onOptimisticUpdate, onUpdated }: BorrowerMemberRowProps) {
  const [removing, setRemoving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [pendingValue, setPendingValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editingField]);

  const saveField = useCallback(
    async (field: keyof DealBorrowerMember, value: unknown) => {
      setEditingField(null);
      const current = (member as unknown as Record<string, unknown>)[field];
      if (current === value) return;
      const updates = { [field]: value };
      onOptimisticUpdate(member.id, updates);
      const result = await updateBorrowerMemberAction(member.id, dealId, updates);
      if (result.error) {
        onOptimisticUpdate(member.id, { [field]: current });
        toast.error(result.error);
      } else {
        onUpdated();
      }
    },
    [member.id, dealId, member, onOptimisticUpdate, onUpdated]
  );

  const handleBlur = useCallback(
    (field: keyof DealBorrowerMember, parse: (s: string) => unknown) => {
      const val = parse(pendingValue);
      saveField(field, val);
    },
    [pendingValue, saveField]
  );

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      const result = await removeBorrowerMemberAction(member.id, dealId);
      if (result.error) toast.error(result.error);
      else {
        setRemoveOpen(false);
        onUpdated();
      }
    } finally {
      setRemoving(false);
    }
  }, [member.id, dealId, onUpdated]);

  const startEdit = (field: string, value: string | number) => {
    setEditingField(field);
    setPendingValue(String(value));
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          href={`/contacts/${member.contact_id}`}
          className="hover:underline"
        >
          {contactName(member)}
        </Link>
      </TableCell>
      <TableCell>
        {editingField === "role" ? (
          <Select
            value={pendingValue}
            onValueChange={(v) => {
              setPendingValue(v);
              saveField("role", v);
              setEditingField(null);
            }}
            onOpenChange={(open) => !open && setEditingField(null)}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BORROWER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            type="button"
            className="text-left w-full min-w-[100px] cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
            onClick={() => startEdit("role", member.role)}
          >
            {member.role || "—"}
          </button>
        )}
      </TableCell>
      <TableCell className="text-right num tabular-nums">
        {editingField === "ownership_pct" ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className="h-8 w-16 text-right"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onBlur={() => handleBlur("ownership_pct", (s) => Math.min(100, Math.max(0, parseNum(s))))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur("ownership_pct", (s) => Math.min(100, Math.max(0, parseNum(s))));
            }}
          />
        ) : (
          <button
            type="button"
            className="cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
            onClick={() => startEdit("ownership_pct", member.ownership_pct ?? 0)}
          >
            {member.ownership_pct != null ? `${Number(member.ownership_pct)}%` : "—"}
          </button>
        )}
      </TableCell>
      <TableCell className="text-right num tabular-nums">
        {editingField === "credit_score" ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            min={FICO_MIN}
            max={FICO_MAX}
            className="h-8 w-20 text-right"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onBlur={() => {
              const n = parseNum(pendingValue);
              const clamped = Math.min(FICO_MAX, Math.max(FICO_MIN, n));
              saveField("credit_score", clamped);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseNum(pendingValue);
                saveField("credit_score", Math.min(FICO_MAX, Math.max(FICO_MIN, n)));
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
            onClick={() => startEdit("credit_score", member.credit_score ?? 0)}
          >
            {member.credit_score != null && member.credit_score > 0 ? member.credit_score : "—"}
          </button>
        )}
      </TableCell>
      <TableCell className="text-right num tabular-nums font-mono">
        {editingField === "liquidity" ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className="h-8 w-24 text-right"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onBlur={() => handleBlur("liquidity", (s) => Math.max(0, parseNum(s)))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur("liquidity", (s) => Math.max(0, parseNum(s)));
            }}
          />
        ) : (
          <button
            type="button"
            className="cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
            onClick={() => startEdit("liquidity", member.liquidity ?? 0)}
          >
            {member.liquidity != null && Number(member.liquidity) > 0
              ? CURRENCY_FORMAT.format(Number(member.liquidity))
              : "—"}
          </button>
        )}
      </TableCell>
      <TableCell className="text-right num tabular-nums font-mono">
        {editingField === "net_worth" ? (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className="h-8 w-24 text-right"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onBlur={() => handleBlur("net_worth", (s) => Math.max(0, parseNum(s)))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBlur("net_worth", (s) => Math.max(0, parseNum(s)));
            }}
          />
        ) : (
          <button
            type="button"
            className="cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5"
            onClick={() => startEdit("net_worth", member.net_worth ?? 0)}
          >
            {member.net_worth != null && Number(member.net_worth) > 0
              ? CURRENCY_FORMAT.format(Number(member.net_worth))
              : "—"}
          </button>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={member.is_guarantor}
          onCheckedChange={async (checked) => {
            const previous = member.is_guarantor;
            onOptimisticUpdate(member.id, { is_guarantor: checked });
            const result = await updateBorrowerMemberAction(member.id, dealId, { is_guarantor: checked });
            if (result.error) {
              onOptimisticUpdate(member.id, { is_guarantor: previous });
              toast.error(result.error);
            } else {
              onUpdated();
            }
          }}
        />
      </TableCell>
      <TableCell className="w-10">
        <Popover open={removeOpen} onOpenChange={setRemoveOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <p className="text-sm mb-3">Remove this borrower?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleRemove} disabled={removing}>
                {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRemoveOpen(false)}>
                No
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    </TableRow>
  );
}
