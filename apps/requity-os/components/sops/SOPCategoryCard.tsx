"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { SOPCategory } from "@/lib/sops/types";

interface SOPCategoryCardProps {
  category: SOPCategory;
  sopCount: number;
}

function getIcon(iconName: string | null) {
  if (!iconName) return LucideIcons.FolderOpen;
  const key = iconName
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("") as keyof typeof LucideIcons;
  const Icon = LucideIcons[key];
  return typeof Icon === "function"
    ? (Icon as React.ElementType)
    : LucideIcons.FolderOpen;
}

export function SOPCategoryCard({ category, sopCount }: SOPCategoryCardProps) {
  const Icon = getIcon(category.icon);

  return (
    <Link
      href={`/sops?category=${category.slug}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-md transition hover:border-border hover:shadow-lg"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {category.name}
        </h3>
      </div>
      {category.description && (
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      )}
      <div className="text-xs font-medium text-primary">
        {sopCount} {sopCount === 1 ? "SOP" : "SOPs"}
      </div>
    </Link>
  );
}
