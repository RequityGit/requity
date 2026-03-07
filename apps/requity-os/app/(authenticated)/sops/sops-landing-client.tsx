"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle, HelpCircle } from "lucide-react";
import { SOPCategoryCard } from "@/components/sops/SOPCategoryCard";
import { SOPCard } from "@/components/sops/SOPCard";
import { SOPSearchBar } from "@/components/sops/SOPSearchBar";
import { SOPFilterChips } from "@/components/sops/SOPFilterChips";
import type { SOPCategory, SOP } from "@/lib/sops/types";

interface SOPsLandingClientProps {
  categories: SOPCategory[];
  sops: SOP[];
  isAdmin: boolean;
  openFlagCount: number;
  uncoveredQuestionCount: number;
}

export function SOPsLandingClient({
  categories,
  sops,
  isAdmin,
  openFlagCount,
  uncoveredQuestionCount,
}: SOPsLandingClientProps) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "";
  const [activeDepartment, setActiveDepartment] = useState("");

  const departments = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    return Array.from(set).sort();
  }, [categories]);

  // Filter categories by active department
  const filteredCategories = useMemo(() => {
    if (!activeDepartment) return categories;
    return categories.filter((c) => c.department === activeDepartment);
  }, [categories, activeDepartment]);

  // Build a lookup from category name → category id for fallback matching
  const categoryNameToId = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.name] = c.id;
    });
    return map;
  }, [categories]);

  // Count SOPs per category (use category_id, fall back to matching category name)
  const sopCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    sops.forEach((s) => {
      const catId = s.category_id ?? (s.category ? categoryNameToId[s.category] : null);
      if (catId) {
        map[catId] = (map[catId] || 0) + 1;
      }
    });
    return map;
  }, [sops, categoryNameToId]);

  // Filter SOPs when a category slug is selected via URL
  const displaySops = useMemo(() => {
    if (!categoryParam) return sops.slice(0, 10);
    const cat = categories.find((c) => c.slug === categoryParam);
    if (!cat) return sops.slice(0, 10);
    return sops.filter((s) => s.category_id === cat.id || s.category === cat.name);
  }, [sops, categoryParam, categories]);

  const selectedCategoryName = categoryParam
    ? categories.find((c) => c.slug === categoryParam)?.name
    : null;

  return (
    <div className="min-h-screen bg-background -m-4 md:-m-6 lg:-m-8 -mb-20 md:-mb-6 lg:-mb-8">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Knowledge Base
              </h1>
              <p className="mt-1 text-muted-foreground">
                Standard Operating Procedures &amp; Process Documentation
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                {openFlagCount > 0 && (
                  <Link
                    href="/sops/admin"
                    className="flex items-center gap-1.5 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-3 py-2 text-xs font-medium text-[#C0392B] transition hover:bg-[#C0392B]/20"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {openFlagCount} Stale
                  </Link>
                )}
                {uncoveredQuestionCount > 0 && (
                  <Link
                    href="/sops/admin"
                    className="flex items-center gap-1.5 rounded-lg border border-[#D4952B]/30 bg-[#D4952B]/10 px-3 py-2 text-xs font-medium text-[#D4952B] transition hover:bg-[#D4952B]/20"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {uncoveredQuestionCount} Unanswered
                  </Link>
                )}
                <Link
                  href="/sops/new"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create SOP
                </Link>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mt-6">
            <SOPSearchBar />
          </div>

          {/* Filter chips */}
          {departments.length > 0 && (
            <div className="mt-4">
              <SOPFilterChips
                departments={departments}
                activeDepartment={activeDepartment}
                onSelect={setActiveDepartment}
              />
            </div>
          )}
        </div>

        {/* Category Grid */}
        {!categoryParam && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Browse by Category
            </h2>
            {filteredCategories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((cat) => (
                  <SOPCategoryCard
                    key={cat.id}
                    category={cat}
                    sopCount={sopCountByCategory[cat.id] ?? 0}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No categories found.</p>
              </div>
            )}
          </section>
        )}

        {/* SOPs List */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {selectedCategoryName
              ? selectedCategoryName
              : "Recently Updated SOPs"}
          </h2>
          {selectedCategoryName && (
            <div className="mb-4">
              <Link
                href="/sops"
                className="text-sm text-primary hover:text-foreground transition"
              >
                &larr; Back to all categories
              </Link>
            </div>
          )}
          {displaySops.length > 0 ? (
            <div className="grid gap-3">
              {displaySops.map((sop) => (
                <SOPCard key={sop.id} sop={sop} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                {selectedCategoryName
                  ? "No SOPs in this category yet."
                  : "No SOPs yet. Create your first SOP to start building your knowledge base."}
              </p>
              {isAdmin && (
                <Link
                  href="/sops/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create SOP
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
