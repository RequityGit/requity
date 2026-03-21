"use client";

import { useState, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Activity,
  Bell,
  Users,
  Globe,
  Hash,
  Mail,
  CheckCircle2,
  PhoneCall,
  Plus,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import { cn } from "@/lib/utils";
import { MonoValue, relTime } from "./contact-detail-shared";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CRM_CONTACT_SOURCES, CRM_RELATIONSHIP_TYPES, CRM_LENDER_DIRECTIONS, CRM_VENDOR_TYPES } from "@/lib/constants/db-enums";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ContactData, RelationshipData } from "./types";
import { RELATIONSHIP_BADGE_COLORS } from "./types";

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "portuguese", label: "Portuguese" },
  { value: "french", label: "French" },
  { value: "other", label: "Other" },
] as const;

interface ContactDetailSidebarProps {
  contact: ContactData;
  relationships: RelationshipData[];
  assignedToName: string | null;
  sourceLabel: string | null;
  currentUserId: string;
  currentUserName: string;
  onComposeEmail?: () => void;
  onTabChange?: (tab: string) => void;
  onLogCall?: () => void;
  onRelationshipAdded?: () => void;
}

export function ContactDetailSidebar({
  contact,
  relationships,
  assignedToName,
  sourceLabel,
  currentUserId,
  currentUserName,
  onComposeEmail,
  onTabChange,
  onLogCall,
  onRelationshipAdded,
}: ContactDetailSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [localContact, setLocalContact] = useState(contact);
  const [localRelationships, setLocalRelationships] = useState(relationships);
  const [addRelOpen, setAddRelOpen] = useState(false);
  const [newRelType, setNewRelType] = useState("");
  const [newLenderDir, setNewLenderDir] = useState("");
  const [newVendorType, setNewVendorType] = useState("");
  const [addingRel, setAddingRel] = useState(false);
  const [, startTransition] = useTransition();
  const supabase = createClient();
  const { toast } = useToast();

  const saveField = useCallback(async (field: string, value: unknown) => {
    const { error } = await supabase
      .from("crm_contacts")
      .update({ [field]: value })
      .eq("id", contact.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [contact.id, supabase, toast]);

  async function addRelationship() {
    if (!newRelType) return;
    setAddingRel(true);
    const payload: Record<string, unknown> = {
      contact_id: contact.id,
      relationship_type: newRelType,
      is_active: true,
    };
    if (newRelType === "lender" && newLenderDir) payload.lender_direction = newLenderDir;
    if (newRelType === "vendor" && newVendorType) payload.vendor_type = newVendorType;

    const { data, error } = await supabase
      .from("contact_relationship_types")
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding relationship", description: error.message, variant: "destructive" });
    } else if (data) {
      setLocalRelationships((prev) => [data as unknown as RelationshipData, ...prev]);
      toast({ title: "Relationship added" });
      onRelationshipAdded?.();
    }
    setAddRelOpen(false);
    setNewRelType("");
    setNewLenderDir("");
    setNewVendorType("");
    setAddingRel(false);
  }

  const quickActions = [
    {
      icon: Mail,
      label: "Send Email",
      onClick: () => onComposeEmail?.(),
    },
    {
      icon: CheckCircle2,
      label: "Create Task",
      onClick: () => onTabChange?.("tasks"),
    },
    {
      icon: PhoneCall,
      label: "Log Call",
      onClick: () => onLogCall?.(),
    },
  ];

  const assignedInitials = assignedToName
    ? assignedToName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Actions */}
      <Card className="rounded-xl border-border">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity size={14} className="text-muted-foreground" strokeWidth={1.5} />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="flex flex-col gap-1.5">
            {quickActions.map(({ icon: Icon, label, onClick }) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                onClick={onClick}
                className="justify-start gap-3 h-9 px-2.5 text-[13px] font-normal text-foreground hover:bg-muted rounded-lg w-full"
              >
                <Icon
                  size={14}
                  className="text-muted-foreground"
                  strokeWidth={1.5}
                />
                {label}
              </Button>
            ))}
            <GenerateDocumentDialog
              recordType="contact"
              recordId={contact.id}
              recordLabel={[contact.first_name, contact.last_name].filter(Boolean).join(" ")}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-3 h-9 px-2.5 text-[13px] font-normal text-foreground hover:bg-muted rounded-lg w-full"
                >
                  <FileText
                    size={14}
                    className="text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  Generate Document
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Followers */}
      <Card className="rounded-xl border-border">
        <CardHeader className="px-5 py-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Bell size={14} className="text-muted-foreground" strokeWidth={1.5} />
              Followers
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-6 text-muted-foreground px-1.5"
            >
              <Plus size={12} strokeWidth={1.5} /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="flex gap-2 flex-wrap">
            {assignedToName && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted cursor-pointer">
                    <Avatar className="h-[22px] w-[22px] rounded-md">
                      <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                        {assignedInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {assignedToName.split(" ")[0]}
                    </span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-48"
                  side="left"
                  align="start"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-foreground/[0.06] text-foreground text-xs font-semibold">
                        {assignedInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{assignedToName}</p>
                      <p className="text-xs text-muted-foreground">Assigned Owner</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
            {!assignedToName && (
              <p className="text-xs text-muted-foreground">No followers yet. Assign an owner to add followers.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card className="rounded-xl border-border">
        <CardHeader className="px-5 py-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users size={14} className="text-muted-foreground" strokeWidth={1.5} />
              Relationships
            </CardTitle>
            <Popover open={addRelOpen} onOpenChange={setAddRelOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-6 text-muted-foreground px-1.5"
                >
                  <Plus size={12} strokeWidth={1.5} /> Add
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" side="left" align="start">
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-foreground">Add Relationship</span>
                  <Select value={newRelType} onValueChange={setNewRelType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_RELATIONSHIP_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newRelType === "lender" && (
                    <Select value={newLenderDir} onValueChange={setNewLenderDir}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Lender direction..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_LENDER_DIRECTIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value} className="text-xs">
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {newRelType === "vendor" && (
                    <Select value={newVendorType} onValueChange={setNewVendorType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Vendor type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_VENDOR_TYPES.map((v) => (
                          <SelectItem key={v.value} value={v.value} className="text-xs">
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    className="h-7 text-xs w-full"
                    disabled={!newRelType || addingRel}
                    onClick={addRelationship}
                  >
                    {addingRel ? "Adding..." : "Add"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {localRelationships.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No relationships defined. Click Add to create one.
            </p>
          ) : (
            <div className="flex flex-col">
              {localRelationships.map((r, i) => {
                const key = r.relationship_type.toLowerCase();
                const colors = RELATIONSHIP_BADGE_COLORS[key];
                const typeLabel =
                  r.relationship_type.charAt(0).toUpperCase() +
                  r.relationship_type.slice(1);
                return (
                  <div key={r.id}>
                    <div className="flex justify-between items-center py-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {colors ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] gap-1 shrink-0"
                            style={{
                              color: colors.text,
                              borderColor: `${colors.text}30`,
                              backgroundColor: colors.bg,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: r.is_active
                                  ? colors.dot
                                  : "hsl(var(--muted-foreground))",
                              }}
                            />
                            {typeLabel}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px] shrink-0">
                            {typeLabel}
                          </Badge>
                        )}
                        {contact.company_name && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            @ {contact.company_name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        Since {formatDate(r.started_at)}
                      </span>
                    </div>
                    {i < localRelationships.length - 1 && (
                      <Separator className="bg-muted" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication */}
      <Card className="rounded-xl border-border">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Globe size={14} className="text-muted-foreground" strokeWidth={1.5} />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="flex flex-col gap-1.5">
            {/* Language */}
            <div className="flex justify-between items-center py-2">
              <span className="inline-field-label">Language</span>
              <Select
                value={localContact.language_preference ?? ""}
                onValueChange={(val) => {
                  setLocalContact((prev) => ({ ...prev, language_preference: val }));
                  startTransition(async () => {
                    const ok = await saveField("language_preference", val);
                    if (!ok) setLocalContact((prev) => ({ ...prev, language_preference: contact.language_preference }));
                  });
                }}
              >
                <SelectTrigger className="inline-field w-[120px] h-7 text-[11px] font-medium text-right">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Marketing Consent */}
            <div className="flex justify-between items-center py-2">
              <span className="inline-field-label">Marketing Consent</span>
              <Switch
                checked={!!localContact.marketing_consent}
                onCheckedChange={(checked) => {
                  setLocalContact((prev) => ({ ...prev, marketing_consent: checked }));
                  startTransition(async () => {
                    const ok = await saveField("marketing_consent", checked);
                    if (!ok) setLocalContact((prev) => ({ ...prev, marketing_consent: contact.marketing_consent }));
                  });
                }}
              />
            </div>

            {/* Do Not Contact */}
            <div className="flex justify-between items-center py-2">
              <span className={cn("inline-field-label", localContact.dnc && "text-[#E5453D]")}>
                Do Not Contact
              </span>
              <Switch
                checked={!!localContact.dnc}
                onCheckedChange={(checked) => {
                  setLocalContact((prev) => ({ ...prev, dnc: checked }));
                  startTransition(async () => {
                    const ok = await saveField("dnc", checked);
                    if (!ok) setLocalContact((prev) => ({ ...prev, dnc: contact.dnc }));
                  });
                }}
              />
            </div>

            {/* Source */}
            <div className="flex justify-between items-center py-2">
              <span className="inline-field-label">Source</span>
              <Select
                value={localContact.source ?? ""}
                onValueChange={(val) => {
                  setLocalContact((prev) => ({ ...prev, source: val }));
                  startTransition(async () => {
                    const ok = await saveField("source", val);
                    if (!ok) setLocalContact((prev) => ({ ...prev, source: contact.source }));
                  });
                }}
              >
                <SelectTrigger className="inline-field w-[120px] h-7 text-[11px] font-medium text-right">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CRM_CONTACT_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="rounded-xl border-border">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Hash size={14} className="text-muted-foreground" strokeWidth={1.5} />
            System Info
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <SidebarFieldRow
              label="Created"
              value={formatDate(contact.created_at)}
            />
            <SidebarFieldRow
              label="Updated"
              value={relTime(contact.updated_at)}
            />
            <div className="flex justify-between items-center py-2.5">
              <Label className="text-[11px] text-muted-foreground font-normal">
                Contact ID
              </Label>
              <div className="flex items-center gap-1">
                <MonoValue className="text-[11px] text-foreground" title={contact.id}>
                  {contact.id.slice(0, 8)}...
                </MonoValue>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contact.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Copy full ID"
                >
                  {copied ? <Check size={11} className="text-[#22A861]" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

/** Sidebar field row using Label */
function SidebarFieldRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <Label className="text-[11px] text-muted-foreground font-normal">{label}</Label>
      <span
        className={cn("text-[11px] font-medium text-foreground", danger && "text-[#E5453D]")}
      >
        {value}
      </span>
    </div>
  );
}
