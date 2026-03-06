"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Search, Loader2 } from "lucide-react";
import type { UserEmailTemplate } from "@/lib/types/user-email-templates";

interface TemplatePickerProps {
  /** Where this picker is being opened from */
  context: "deal" | "contact" | "any";
  /** Called when a template is selected */
  onSelect: (template: UserEmailTemplate) => void;
}

const categoryColors: Record<string, string> = {
  lending: "bg-blue-100 text-blue-700",
  investor: "bg-emerald-100 text-emerald-700",
  servicing: "bg-purple-100 text-purple-700",
  closing: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

export function TemplatePicker({ context, onSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<UserEmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!open) return;

    async function loadTemplates() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("user_email_templates" as never)
        .select("*" as never)
        .eq("is_active" as never, true as never)
        .order("sort_order" as never, { ascending: true } as never);

      // Filter by context: show templates that match the current context or "any"
      const filtered = ((data ?? []) as unknown as UserEmailTemplate[]).filter(
        (t) => t.context === "any" || t.context === context
      );
      setTemplates(filtered);
      setLoading(false);
    }

    loadTemplates();
  }, [open, context]);

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filtered = templates.filter((t) => {
    const matchesCategory =
      activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category
  const grouped = filtered.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, UserEmailTemplate[]>
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-3.5 w-3.5" />
        Use Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
            <DialogDescription>
              Choose a template to pre-fill your email with merge fields.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    activeCategory === "all"
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize transition-colors ${
                      activeCategory === cat
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Template list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No templates available.
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          className="w-full text-left p-3 rounded-md border hover:border-foreground/30 hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            onSelect(tmpl);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium">
                              {tmpl.name}
                            </span>
                            {tmpl.is_default && (
                              <Badge variant="outline" className="text-[9px]">
                                Default
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize ml-auto ${categoryColors[tmpl.category] ?? ""}`}
                            >
                              {tmpl.category}
                            </Badge>
                          </div>
                          {tmpl.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {tmpl.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
