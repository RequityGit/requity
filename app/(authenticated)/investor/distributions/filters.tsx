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

interface DistributionFiltersProps {
  funds: { id: string; name: string }[];
  years: string[];
  distributionTypes: { value: string; label: string }[];
  currentFund?: string;
  currentYear?: string;
  currentType?: string;
}

export function DistributionFilters({
  funds,
  years,
  distributionTypes,
  currentFund,
  currentYear,
  currentType,
}: DistributionFiltersProps) {
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

  const hasFilters = currentFund || currentYear || currentType;

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
        value={currentYear ?? "all"}
        onValueChange={(val) =>
          handleFilterChange("year", val === "all" ? undefined : val)
        }
      >
        <SelectTrigger className="w-[140px] bg-navy-mid">
          <SelectValue placeholder="All Years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentType ?? "all"}
        onValueChange={(val) =>
          handleFilterChange("type", val === "all" ? undefined : val)
        }
      >
        <SelectTrigger className="w-[200px] bg-navy-mid">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {distributionTypes.map((dt) => (
            <SelectItem key={dt.value} value={dt.value}>
              {dt.label}
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
