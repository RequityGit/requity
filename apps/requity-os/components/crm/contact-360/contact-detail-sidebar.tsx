"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useToast } from "@/components/ui/use-toast";
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
import type { ContactData, RelationshipData } from "./types";
import { RELATIONSHIP_BADGE_COLORS } from "./types";

interface ContactDetailSidebarProps {
  contact: ContactData;
  relationships: RelationshipData[];
  assignedToName: string | null;
  sourceLabel: string | null;
  currentUserId: string;
  currentUserName: string;
  onComposeEmail?: () => void;
}

export function ContactDetailSidebar({
  contact,
  relationships,
  assignedToName,
  sourceLabel,
  currentUserId,
  currentUserName,
  onComposeEmail,
}: ContactDetailSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [logging, setLogging] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleLogCall() {
    setLogging(true);
    try {
      const supabase = createClient();
      await supabase.from("crm_activities").insert({
        contact_id: contact.id,
        activity_type: "call" as never,
        subject: "Phone call logged",
        performed_by: currentUserId,
      });
      await supabase
        .from("crm_contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", contact.id);
      toast({ title: "Call logged" });
      router.refresh();
    } catch {
      toast({ title: "Error logging call", variant: "destructive" });
    } finally {
      setLogging(false);
    }
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
      onClick: () => {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", "tasks");
        router.replace(`?${params.toString()}`, { scroll: false });
      },
    },
    {
      icon: PhoneCall,
      label: "Log Call",
      onClick: handleLogCall,
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
                disabled={logging && label === "Log Call"}
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
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users size={14} className="text-muted-foreground" strokeWidth={1.5} />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {relationships.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No relationships defined. Edit the contact to add relationship types.
            </p>
          ) : (
            <div className="flex flex-col">
              {relationships.map((r, i) => {
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
                    {i < relationships.length - 1 && (
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
            <SidebarFieldRow
              label="Language"
              value={
                contact.language_preference
                  ? contact.language_preference.charAt(0).toUpperCase() +
                    contact.language_preference.slice(1)
                  : "—"
              }
            />
            <SidebarFieldRow
              label="Marketing Consent"
              value={contact.marketing_consent ? "Yes" : "No"}
            />
            <SidebarFieldRow
              label="Do Not Contact"
              value={contact.dnc ? "Yes" : "No"}
              danger={!!contact.dnc}
            />
            <SidebarFieldRow
              label="Source"
              value={
                sourceLabel ||
                (contact.source
                  ? contact.source.charAt(0).toUpperCase() +
                    contact.source.slice(1)
                  : "—")
              }
            />
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
