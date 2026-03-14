"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES } from "@/app/(authenticated)/(admin)/email-templates/types";

interface TemplateFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function TemplateFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: TemplateFiltersProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              <span className="capitalize">{cat}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
