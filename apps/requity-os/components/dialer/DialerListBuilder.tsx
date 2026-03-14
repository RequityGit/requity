"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  Check,
  AlertTriangle,
  Phone,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createDialerList } from "@/lib/dialer/dialer-api";
import { DEFAULT_DIALER_SETTINGS } from "@/lib/dialer/types";
import type { DialerListSettings } from "@/lib/dialer/types";

interface CrmContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  dnc: boolean | null;
  lifecycle_stage: string | null;
  last_contacted_at: string | null;
}

interface Props {
  contacts: CrmContact[];
  teamMembers: { id: string; full_name: string }[];
  currentUserId: string;
}

export function DialerListBuilder({ contacts, teamMembers, currentUserId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [settings, setSettings] = useState<DialerListSettings>(DEFAULT_DIALER_SETTINGS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  // Filter contacts
  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (!c.phone) return false; // Must have phone
      if (stageFilter !== "all" && c.lifecycle_stage !== stageFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
        if (
          !fullName.includes(q) &&
          !(c.phone || "").includes(q) &&
          !(c.email || "").toLowerCase().includes(q) &&
          !(c.company_name || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [contacts, search, stageFilter, sourceFilter]);

  const dncCount = useMemo(
    () => Array.from(selectedIds).filter((id) => contacts.find((c) => c.id === id)?.dnc).length,
    [selectedIds, contacts]
  );
  const validSelected = selectedIds.size - dncCount;

  // Get unique stages/sources for filters
  const stages = useMemo(() => {
    const s = new Set(contacts.map((c) => c.lifecycle_stage).filter(Boolean));
    return Array.from(s).sort();
  }, [contacts]);

  const sources = useMemo(() => {
    const s = new Set(contacts.map((c) => c.source).filter(Boolean));
    return Array.from(s).sort();
  }, [contacts]);

  const toggleContact = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filtered.forEach((c) => next.add(c.id));
    setSelectedIds(next);
  };

  const deselectAll = () => setSelectedIds(new Set());

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0) return;
    setSaving(true);
    try {
      const nonDncIds = Array.from(selectedIds).filter(
        (id) => !contacts.find((c) => c.id === id)?.dnc
      );
      const res = await createDialerList({
        name: name.trim(),
        description: description.trim() || undefined,
        assigned_to: assignedTo,
        settings: settings as unknown as Record<string, unknown>,
        contactIds: nonDncIds,
      });
      router.push(`/dialer/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create list:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* List details */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">List Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., FL FUB List - March 2026"
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {teamMembers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dialer Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pause Between Calls (s)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={settings.pause_between_calls}
              onChange={(e) =>
                setSettings({ ...settings, pause_between_calls: Number(e.target.value) })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Max Attempts</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.max_attempts}
              onChange={(e) =>
                setSettings({ ...settings, max_attempts: Number(e.target.value) })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Redial Cooldown (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.redial_cooldown_minutes}
              onChange={(e) =>
                setSettings({ ...settings, redial_cooldown_minutes: Number(e.target.value) })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={settings.auto_advance}
                onCheckedChange={(v) =>
                  setSettings({ ...settings, auto_advance: !!v })
                }
              />
              <span>Auto-Advance</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={settings.amd_enabled}
                onCheckedChange={(v) =>
                  setSettings({ ...settings, amd_enabled: !!v })
                }
              />
              <span>AMD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact selection */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Select Contacts</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{validSelected}</span> selected
              {dncCount > 0 && (
                <span className="text-red-500">
                  ({dncCount} DNC excluded)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s!}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s!}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={selectAllFiltered}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Select All ({filtered.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={deselectAll}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No contacts match your filters.
            </div>
          ) : (
            filtered.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              const isDnc = contact.dnc;
              const fullName = [contact.first_name, contact.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown";

              return (
                <div
                  key={contact.id}
                  onClick={() => !isDnc && toggleContact(contact.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 transition-colors",
                    isDnc
                      ? "opacity-50 cursor-not-allowed bg-red-50/50 dark:bg-red-950/20"
                      : isSelected
                        ? "bg-foreground/[0.03] cursor-pointer"
                        : "hover:bg-muted/30 cursor-pointer"
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                      isDnc
                        ? "border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950"
                        : isSelected
                          ? "border-foreground bg-foreground"
                          : "border-border"
                    )}
                  >
                    {isDnc ? (
                      <X className="h-2.5 w-2.5 text-red-500" strokeWidth={2} />
                    ) : isSelected ? (
                      <Check className="h-2.5 w-2.5 text-background" strokeWidth={2} />
                    ) : null}
                  </div>

                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {fullName}
                      </span>
                      {isDnc && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={1.5} />
                          DNC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {contact.phone}
                        </span>
                      )}
                      {contact.source && <span>{contact.source}</span>}
                      {contact.lifecycle_stage && <span>{contact.lifecycle_stage}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create button */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push("/dialer")}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || validSelected === 0 || saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
          ) : (
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          Create List ({validSelected} contacts)
        </button>
      </div>
    </div>
  );
}
