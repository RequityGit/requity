"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SectionBlock } from "../styled-doc-parts/types";

const SECTION_TYPES = [
  { type: "term_table", label: "Term Table", description: "Key-value rows" },
  { type: "bullet_list", label: "Bullet List", description: "Itemized list" },
  { type: "paragraph", label: "Paragraph", description: "Free text block" },
  { type: "signature", label: "Signature Block", description: "Signer lines" },
  { type: "divider", label: "Divider", description: "Line or space" },
] as const;

interface SectionTypeSelectProps {
  onAdd: (section: SectionBlock) => void;
}

function createDefaultSection(type: string): SectionBlock {
  switch (type) {
    case "term_table":
      return { type: "term_table", title: "New Section", rows: [] };
    case "bullet_list":
      return { type: "bullet_list", title: "New List", items: [] };
    case "paragraph":
      return { type: "paragraph", title: "", text: "" };
    case "signature":
      return {
        type: "signature",
        title: "Execution",
        blocks: [{ role: "Lender", show_date_line: true }],
      };
    case "divider":
      return { type: "divider", style: "line" };
    default:
      return { type: "divider", style: "line" };
  }
}

export function SectionTypeSelect({ onAdd }: SectionTypeSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus size={14} className="mr-1.5" />
          Add Section
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {SECTION_TYPES.map((st) => (
          <DropdownMenuItem
            key={st.type}
            onClick={() => onAdd(createDefaultSection(st.type))}
            className="flex flex-col items-start"
          >
            <span className="text-sm font-medium">{st.label}</span>
            <span className="text-[11px] text-muted-foreground">{st.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
