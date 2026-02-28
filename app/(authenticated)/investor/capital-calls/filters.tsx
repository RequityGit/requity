"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CapitalCallFiltersProps {
  funds: { id: string; name: string }[];
  currentFund?: string;
  currentStatus?: string;
}

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function CapitalCallFilters({
  funds,
  currentFund,
  currentStatus,
}: CapitalCallFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });
      return current.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string | undefined) => {
    const qs = createQueryString({ [key]: value });
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentFund || currentStatus;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentFund ?? "all"}
        onValueChange={(val) =>
          handleFilterChange("fund", val === "all" ? undefined : val)
        }
      >
        <SelectTrigger className="w-[200px] bg-navy-mid">
          <SelectValue placeholder="All Investments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Investments</SelectItem>
          {funds.map((fund) => (
            <SelectItem key={fund.id} value={fund.id}>
              {fund.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentStatus ?? "all"}
        onValueChange={(val) =>
          handleFilterChange("status", val === "all" ? undefined : val)
        }
      >
        <SelectTrigger className="w-[160px] bg-navy-mid">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-surface-muted"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
