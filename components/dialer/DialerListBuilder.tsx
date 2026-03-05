"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Trash2,
  Ban,
  Phone,
  UserPlus,
  Play,
  Settings,
  AlertTriangle,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DialerList, DialerListSettings, DialerListContact } from "@/lib/dialer/types";
import { DEFAULT_SETTINGS } from "@/lib/dialer/types";
import Link from "next/link";

interface CrmContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  dnc: boolean | null;
  city: string | null;
  state: string | null;
  lifecycle_stage: string | null;
  last_contacted_at: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface DialerListBuilderProps {
  list: DialerList;
  listContacts: DialerListContact[];
  allContacts: CrmContact[];
  teamMembers: TeamMember[];
  onUpdateList: (data: {
    name?: string;
    description?: string;
    assigned_to?: string;
    settings?: DialerListSettings;
  }) => Promise<{ error?: string }>;
  onAddContacts: (contactIds: string[]) => Promise<{ error?: string }>;
  onRemoveContact: (listContactId: string) => Promise<{ error?: string }>;
}

export function DialerListBuilder({
  list,
  listContacts,
  allContacts,
  teamMembers,
  onUpdateList,
  onAddContacts,
  onRemoveContact,
}: DialerListBuilderProps) {
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [assignedTo, setAssignedTo] = useState(list.assigned_to || "");
  const settings = (list.settings || DEFAULT_SETTINGS) as DialerListSettings;
  const [autoAdvance, setAutoAdvance] = useState(settings.auto_advance);
  const [pauseBetween, setPauseBetween] = useState(settings.pause_between_calls);
  const [maxAttempts, setMaxAttempts] = useState(settings.max_attempts);
  const [amdEnabled, setAmdEnabled] = useState(settings.amd_enabled);
  const [redialCooldown, setRedialCooldown] = useState(settings.redial_cooldown_minutes);
  const [saving, setSaving] = useState(false);

  // Contact picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get contacts already in the list
  const existingContactIds = useMemo(
    () => new Set(listContacts.map((lc) => lc.contact_id)),
    [listContacts]
  );

  // Filter contacts for picker
  const availableContacts = useMemo(() => {
    return allContacts.filter((c) => {
      if (existingContactIds.has(c.id)) return false;
      if (c.dnc) return false;
      if (!c.phone) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
        const match =
          name.includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").includes(q) ||
          (c.company_name || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (stageFilter !== "all" && c.lifecycle_stage !== stageFilter) return false;

      return true;
    });
  }, [allContacts, existingContactIds, searchQuery, sourceFilter, stageFilter]);

  // Count excluded
  const dncCount = allContacts.filter(
    (c) => c.dnc && !existingContactIds.has(c.id)
  ).length;
  const noPhoneCount = allContacts.filter(
    (c) => !c.phone && !c.dnc && !existingContactIds.has(c.id)
  ).length;

  const handleSave = async () => {
    setSaving(true);
    await onUpdateList({
      name,
      description,
      assigned_to: assignedTo || undefined,
      settings: {
        auto_advance: autoAdvance,
        pause_between_calls: pauseBetween,
        max_attempts: maxAttempts,
        amd_enabled: amdEnabled,
        amd_action: "drop",
        redial_cooldown_minutes: redialCooldown,
      },
    });
    setSaving(false);
  };

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return;
    await onAddContacts(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowPicker(false);
  };

  const toggleContact = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const allIds = availableContacts.map((c) => c.id);
    setSelectedIds(new Set(allIds));
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "—";
    const d = phone.replace(/\D/g, "");
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return phone;
  };

  const uniqueSources = Array.from(
    new Set(allContacts.map((c) => c.source).filter(Boolean))
  ) as string[];
  const uniqueStages = Array.from(
    new Set(allContacts.map((c) => c.lifecycle_stage).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6">
      {/* List settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" strokeWidth={1.5} />
              List Settings
            </CardTitle>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional..."
                className="h-16 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs">Pause Between Calls (sec)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={pauseBetween}
                onChange={(e) => setPauseBetween(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Attempts</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Redial Cooldown (min)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={redialCooldown}
                onChange={(e) => setRedialCooldown(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">AMD</Label>
              <Select
                value={amdEnabled ? "on" : "off"}
                onValueChange={(v) => setAmdEnabled(v === "on")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled</SelectItem>
                  <SelectItem value="off">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" strokeWidth={1.5} />
              Contacts ({listContacts.length})
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showPicker} onOpenChange={setShowPicker}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Add Contacts
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Add Contacts to List</DialogTitle>
                  </DialogHeader>

                  {/* Exclusion notice */}
                  {(dncCount > 0 || noPhoneCount > 0) && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span>
                        {dncCount > 0 && `${dncCount} DNC contacts excluded. `}
                        {noPhoneCount > 0 && `${noPhoneCount} contacts without phone excluded.`}
                      </span>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {uniqueSources.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {uniqueStages.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{availableContacts.length} contacts available</span>
                    <div className="flex gap-2">
                      <button onClick={selectAll} className="hover:underline text-primary">
                        Select All ({availableContacts.length})
                      </button>
                      <span>|</span>
                      <button onClick={() => setSelectedIds(new Set())} className="hover:underline">
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Contact list */}
                  <div className="flex-1 overflow-auto border rounded-md max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableContacts.slice(0, 100).map((c) => (
                          <TableRow
                            key={c.id}
                            className={cn(
                              "cursor-pointer",
                              selectedIds.has(c.id) && "bg-primary/5"
                            )}
                            onClick={() => toggleContact(c.id)}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleContact(c.id)}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {[c.first_name, c.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {formatPhone(c.phone)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {c.source?.replace(/_/g, " ") || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {availableContacts.length > 100 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                              Showing first 100 of {availableContacts.length}. Use filters to narrow down.
                            </TableCell>
                          </TableRow>
                        )}
                        {availableContacts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                              No contacts match your filters
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPicker(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddSelected}
                      disabled={selectedIds.size === 0}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Add {selectedIds.size} Contact{selectedIds.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {listContacts.length > 0 && (list.status === "draft" || list.status === "paused") && (
                <Link href={`/admin/dialer/${list.id}/session`}>
                  <Button size="sm" className="gap-1.5">
                    <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Start Dialing
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserPlus className="h-8 w-8 mb-2" strokeWidth={1.5} />
              <p className="text-sm">No contacts added yet</p>
              <p className="text-xs">
                Click &quot;Add Contacts&quot; to build your call list.
              </p>
            </div>
          ) : (
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Disposition</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listContacts.map((lc) => {
                    const contact = lc.contact;
                    return (
                      <TableRow key={lc.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {lc.position + 1}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contact
                            ? [contact.first_name, contact.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {formatPhone(contact?.phone || null)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lc.status === "called"
                                ? "success"
                                : lc.status === "pending"
                                  ? "secondary"
                                  : lc.status === "dnc_skipped"
                                    ? "destructive"
                                    : "outline"
                            }
                            className="text-[10px]"
                          >
                            {lc.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {lc.disposition || "—"}
                        </TableCell>
                        <TableCell>
                          {list.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => onRemoveContact(lc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
