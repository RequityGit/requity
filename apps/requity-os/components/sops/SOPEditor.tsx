"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Save, Eye, Send, ArrowLeft } from "lucide-react";
import { sopClient } from "@/lib/sops/client";
import Link from "next/link";
import type { SOP, SOPCategory } from "@/lib/sops/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface SOPEditorProps {
  sop?: SOP | null;
  categories: SOPCategory[];
  userId: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function SOPEditor({ sop, categories, userId }: SOPEditorProps) {
  const router = useRouter();
  const isNew = !sop;

  const [title, setTitle] = useState(sop?.title ?? "");
  const [slug, setSlug] = useState(sop?.slug ?? "");
  const [department, setDepartment] = useState(sop?.department ?? "");
  const [categoryId, setCategoryId] = useState(sop?.category_id ?? "");
  const [tags, setTags] = useState(sop?.tags?.join(", ") ?? "");
  const [visibility, setVisibility] = useState(sop?.visibility ?? "internal");
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(
    sop?.visible_to_roles ?? []
  );
  const [content, setContent] = useState(sop?.content ?? "");
  const [summary, setSummary] = useState(sop?.summary ?? "");
  const [changeNotes, setChangeNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title if creating new
  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (isNew) setSlug(generateSlug(val));
    },
    [isNew]
  );

  // Get unique departments from categories
  const departments = Array.from(
    new Set(categories.map((c) => c.department).filter(Boolean))
  ) as string[];

  // Filter categories by selected department
  const filteredCategories = department
    ? categories.filter((c) => c.department === department)
    : categories;

  async function handleSave(publish: boolean) {
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = sopClient();
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const autoSummary =
        summary.trim() ||
        content.slice(0, 200).replace(/[#*_\[\]]/g, "").trim();

      const sopData = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        summary: autoSummary,
        department: department || null,
        category: filteredCategories.find((c) => c.id === categoryId)?.name ?? null,
        category_id: categoryId || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        visibility,
        visible_to_roles: visibility === "role" ? visibleToRoles : null,
        status: publish ? "published" : "draft",
        ...(publish && {
          approved_by: userId,
          approved_at: new Date().toISOString(),
        }),
      };

      let sopId = sop?.id;
      let newVersion = (sop?.version ?? 0) + 1;

      if (isNew) {
        const { data, error: insertErr } = await supabase
          .from("sops")
          .insert({
            ...sopData,
            created_by: userId,
            version: 1,
            source_type: "manual",
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        sopId = data.id;
        newVersion = 1;
      } else {
        const { error: updateErr } = await supabase
          .from("sops")
          .update({
            ...sopData,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sop.id);

        if (updateErr) throw updateErr;
      }

      // Create version entry
      if (sopId) {
        await supabase.from("sop_versions").insert({
          sop_id: sopId,
          version_number: newVersion,
          content,
          summary: autoSummary,
          changed_by: userId,
          change_notes: changeNotes || null,
        });
      }

      router.push(`/sops/${slug.trim()}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save SOP.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Back link */}
        <Link
          href={sop ? `/sops/${sop.slug}` : "/sops"}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {sop ? "Back to SOP" : "Back to Knowledge Base"}
        </Link>

        <h1 className="mb-8 text-3xl font-semibold text-foreground">
          {isNew ? "Create New SOP" : `Edit: ${sop.title}`}
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 p-3 text-sm text-[#C0392B]">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="SOP title..."
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Department & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setCategoryId("");
                }}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="onboarding, compliance, process..."
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Visibility
            </label>
            <div className="flex gap-4">
              {(["internal", "public", "role"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={visibility === v}
                    onChange={() => setVisibility(v)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-muted-foreground capitalize">{v === "role" ? "Role-based" : v}</span>
                </label>
              ))}
            </div>
            {visibility === "role" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {["admin", "borrower", "investor"].map((r) => (
                  <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleToRoles.includes(r)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisibleToRoles((prev) => [...prev, r]);
                        } else {
                          setVisibleToRoles((prev) =>
                            prev.filter((x) => x !== r)
                          );
                        }
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm text-muted-foreground capitalize">
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Content editor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Content (Markdown)
            </label>
            <div data-color-mode="dark" className="rounded-lg overflow-hidden border border-border">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val ?? "")}
                height={500}
                preview="live"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Summary (auto-generated if empty)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief summary of this SOP..."
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Change notes (for edits) */}
          {!isNew && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Change Notes (optional)
              </label>
              <input
                type="text"
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="What did you change?"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <button
              onClick={() => setPreviewOpen(!previewOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-accent"
            >
              <Eye className="h-4 w-4" />
              {previewOpen ? "Hide Preview" : "Preview"}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          {/* Preview area */}
          {previewOpen && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Preview
              </h3>
              {content ? (
                <SOPContentPreview content={content} />
              ) : (
                <p className="text-muted-foreground">
                  Start writing to see a preview...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SOPContentPreview = dynamic(
  () =>
    import("@/components/sops/SOPContent").then((mod) => ({
      default: mod.SOPContent,
    })),
  { ssr: false }
);
