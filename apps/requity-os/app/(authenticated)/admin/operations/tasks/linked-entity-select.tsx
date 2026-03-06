"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EntityOption {
  type: string;
  id: string;
  label: string;
}

interface LinkedEntitySelectProps {
  entityType: string;
  entityId: string;
  entityLabel: string;
  onChange: (type: string, id: string, label: string) => void;
}

export function LinkedEntitySelect({
  entityType,
  entityId,
  entityLabel,
  onChange,
}: LinkedEntitySelectProps) {
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadOptions = useCallback(async () => {
    if (loaded) return;
    const supabase = createClient();

    const [loansRes, borrowersRes, fundsRes] = await Promise.all([
      supabase
        .from("loans")
        .select("id, loan_number, property_address, loan_amount")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("borrowers_portal" as never)
        .select("id, first_name, last_name" as never)
        .order("last_name" as never)
        .limit(50) as unknown as { data: { id: string; first_name: string | null; last_name: string | null }[] | null },
      supabase
        .from("funds")
        .select("id, name")
        .is("deleted_at", null)
        .order("name")
        .limit(50),
    ]);

    const opts: EntityOption[] = [];

    (loansRes.data ?? []).forEach((l) => {
      const lbl =
        l.property_address ||
        `Loan ${l.loan_number || l.id.slice(0, 8)}`;
      opts.push({ type: "loan", id: l.id, label: lbl });
    });

    (borrowersRes.data ?? []).forEach((b) => {
      opts.push({
        type: "borrower",
        id: b.id,
        label: `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Borrower",
      });
    });

    (fundsRes.data ?? []).forEach((f) => {
      opts.push({
        type: "fund",
        id: f.id,
        label: f.name || "Unnamed Fund",
      });
    });

    setOptions(opts);
    setLoaded(true);
  }, [loaded]);

  const handleChange = (compositeValue: string) => {
    if (compositeValue === "none") {
      onChange("", "", "");
      return;
    }
    const opt = options.find((o) => `${o.type}:${o.id}` === compositeValue);
    if (opt) {
      onChange(opt.type, opt.id, opt.label);
    }
  };

  const currentValue =
    entityType && entityId ? `${entityType}:${entityId}` : "none";

  const groupedOptions = {
    loan: options.filter((o) => o.type === "loan"),
    borrower: options.filter((o) => o.type === "borrower"),
    fund: options.filter((o) => o.type === "fund"),
  };

  return (
    <Select value={currentValue} onValueChange={handleChange} onOpenChange={(open) => {
      if (open) loadOptions();
    }}>
      <SelectTrigger>
        <SelectValue placeholder="None">
          {entityLabel || "None"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {groupedOptions.loan.length > 0 && (
          <SelectGroup>
            <SelectLabel>Loans</SelectLabel>
            {groupedOptions.loan.map((o) => (
              <SelectItem key={o.id} value={`${o.type}:${o.id}`}>
                <span className="truncate">{o.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {groupedOptions.borrower.length > 0 && (
          <SelectGroup>
            <SelectLabel>Borrowers</SelectLabel>
            {groupedOptions.borrower.map((o) => (
              <SelectItem key={o.id} value={`${o.type}:${o.id}`}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {groupedOptions.fund.length > 0 && (
          <SelectGroup>
            <SelectLabel>Funds</SelectLabel>
            {groupedOptions.fund.map((o) => (
              <SelectItem key={o.id} value={`${o.type}:${o.id}`}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
