"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ExternalLink, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FormDefinition, FormStep } from "@/lib/form-engine/types";

type FormRow = Pick<FormDefinition, "id" | "name" | "slug" | "status" | "mode" | "contexts" | "steps" | "updated_at">;

const STATUS_TABS = ["all", "published", "draft", "archived"] as const;

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
}

function countFields(steps: FormStep[]): number {
  return steps.reduce((sum, step) => sum + step.fields.length, 0);
}

export default function FormsListPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>("all");

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient();
      const { data } = await supabase
        .from("form_definitions")
        .select("id, name, slug, status, mode, contexts, steps, updated_at")
        .order("updated_at", { ascending: false });

      if (data) {
        setForms(
          (data as any[]).map((d: any) => ({
            ...d,
            steps: (d.steps || []) as FormStep[],
            contexts: (d.contexts || []) as FormDefinition["contexts"],
          })) as FormRow[]
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = forms.filter((f) => {
    if (activeTab !== "all" && f.status !== activeTab) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and manage dynamic forms for intake workflows.
          </p>
        </div>
        <Button
          onClick={() => {
            // Create new form and redirect to editor
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const supabase: any = createClient();
            supabase
              .from("form_definitions")
              .insert({
                name: "Untitled Form",
                slug: `form-${Date.now()}`,
                status: "draft",
                steps: [],
              })
              .select("id")
              .single()
              .then(({ data }: { data: any }) => {
                if (data) router.push(`/control-center/forms/${data.id}`);
              });
          }}
        >
          <Plus size={16} strokeWidth={1.5} className="mr-2" />
          New Form
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No forms found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((form) => (
                <TableRow
                  key={form.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/control-center/forms/${form.id}`)}
                >
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{form.name}</span>
                      {form.status === "published" && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-muted-foreground">/forms/{form.slug}</span>
                          <ExternalLink size={10} strokeWidth={1.5} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(form.status)}>{form.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {countFields(form.steps)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {form.steps.length}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(form.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal size={16} strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/control-center/forms/${form.id}`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`/forms/${form.slug}`);
                          }}
                        >
                          Copy URL
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
