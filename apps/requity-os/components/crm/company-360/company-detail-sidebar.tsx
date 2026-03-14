"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Zap,
  Mail,
  CheckCircle2,
  PhoneCall,
  Upload,
  Bell,
  Users,
  Hash,
  Phone,
  Plus,
  FileText,
  X,
} from "lucide-react";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import {
  SectionCard,
  FieldRow,
  MonoValue,
  relTime,
} from "@/components/crm/contact-360/contact-detail-shared";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  addCompanyFollowerAction,
  removeCompanyFollowerAction,
} from "@/app/(authenticated)/(admin)/companies/actions";
import type {
  CompanyDetailData,
  CompanyContactData,
  CompanyFollowerData,
} from "./types";

interface CompanyDetailSidebarProps {
  company: CompanyDetailData;
  contacts: CompanyContactData[];
  followers: CompanyFollowerData[];
  currentUserId: string;
  currentUserName: string;
  teamMembers: { id: string; full_name: string }[];
  onTabChange: (tab: string) => void;
  onComposeEmail?: () => void;
  onLogCall?: () => void;
}

export function CompanyDetailSidebar({
  company,
  contacts,
  followers,
  teamMembers,
  onTabChange,
  onComposeEmail,
  onLogCall,
}: CompanyDetailSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [followerPopoverOpen, setFollowerPopoverOpen] = useState(false);
  const [loadingFollower, setLoadingFollower] = useState<string | null>(null);

  const followerUserIds = new Set(followers.map((f) => f.user_id));
  const availableMembers = teamMembers.filter((m) => !followerUserIds.has(m.id));

  async function handleAddFollower(userId: string) {
    setLoadingFollower(userId);
    const result = await addCompanyFollowerAction(company.id, userId);
    setLoadingFollower(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setFollowerPopoverOpen(false);
      router.refresh();
    }
  }

  async function handleRemoveFollower(followerId: string) {
    setLoadingFollower(followerId);
    const result = await removeCompanyFollowerAction(followerId);
    setLoadingFollower(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      router.refresh();
    }
  }

  const topContacts = [...contacts]
    .sort((a, b) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Zap}>
        <div className="flex flex-col gap-2">
          {[
            {
              icon: Mail,
              label: "Send Email",
              onClick: () => onComposeEmail?.(),
            },
            {
              icon: CheckCircle2,
              label: "Create Task",
              onClick: () => onTabChange("tasks"),
            },
            {
              icon: PhoneCall,
              label: "Log Call",
              onClick: () => onLogCall?.(),
            },
            {
              icon: Upload,
              label: "Upload Document",
              onClick: () => onTabChange("files"),
            },
          ].map(({ icon: I, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/50 cursor-pointer text-[13px] text-foreground font-normal transition-all duration-150 hover:bg-muted"
            >
              <I size={14} className="text-muted-foreground" strokeWidth={1.5} />
              {label}
            </button>
          ))}
          <GenerateDocumentDialog
            recordType="company"
            recordId={company.id}
            recordLabel={company.name}
            trigger={
              <button
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/50 cursor-pointer text-[13px] text-foreground font-normal transition-all duration-150 hover:bg-muted"
              >
                <FileText size={14} className="text-muted-foreground" strokeWidth={1.5} />
                Generate Document
              </button>
            }
          />
        </div>
      </SectionCard>

      {/* Followers */}
      <SectionCard
        title="Followers"
        icon={Bell}
        action={
          <Popover open={followerPopoverOpen} onOpenChange={setFollowerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7 text-muted-foreground"
              >
                <Plus size={12} strokeWidth={1.5} /> Add
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              {availableMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1.5">
                  All team members are already followers.
                </p>
              ) : (
                <div className="flex flex-col">
                  {availableMembers.map((m) => {
                    const initials = m.full_name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <button
                        key={m.id}
                        disabled={loadingFollower === m.id}
                        onClick={() => handleAddFollower(m.id)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[13px] hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        <Avatar className="h-5 w-5 rounded-md">
                          <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[8px] font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {m.full_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </PopoverContent>
          </Popover>
        }
      >
        <div className="flex gap-2 flex-wrap">
          {followers.length === 0 ? (
            <span className="text-xs text-muted-foreground">No followers</span>
          ) : (
            followers.map((f) => {
              const initials = f.user_name
                ? f.user_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "?";
              return (
                <div
                  key={f.id}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted"
                >
                  <Avatar className="h-[22px] w-[22px] rounded-md">
                    <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {f.user_name?.split(" ")[0] || "Unknown"}
                  </span>
                  <button
                    onClick={() => handleRemoveFollower(f.id)}
                    disabled={loadingFollower === f.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {/* Key Contacts */}
      <SectionCard
        title="Key Contacts"
        icon={Users}
        action={
          <span
            className="text-xs text-[#3B82F6] cursor-pointer"
            onClick={() => onTabChange("contacts")}
          >
            View All
          </span>
        }
      >
        <div className="flex flex-col gap-2.5">
          {topContacts.length === 0 ? (
            <span className="text-xs text-muted-foreground">No contacts linked</span>
          ) : (
            topContacts.map((ct) => {
              const name = [ct.first_name, ct.last_name]
                .filter(Boolean)
                .join(" ");
              const initials = [ct.first_name?.[0], ct.last_name?.[0]]
                .filter(Boolean)
                .join("")
                .toUpperCase();
              return (
                <Link
                  key={ct.id}
                  href={`/contacts/${ct.contact_number}`}
                  className="flex items-center gap-2.5 cursor-pointer hover:bg-muted -mx-1 px-1 py-1 rounded-lg transition-colors"
                >
                  <Avatar className="h-7 w-7 rounded-md">
                    <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{name}</div>
                    {ct.user_function && (
                      <div className="text-[11px] text-muted-foreground">
                        {ct.user_function}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {ct.email && (
                      <div className="w-[26px] h-[26px] rounded-md border border-border flex items-center justify-center">
                        <Mail size={12} className="text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                    {ct.phone && (
                      <div className="w-[26px] h-[26px] rounded-md border border-border flex items-center justify-center">
                        <Phone size={12} className="text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard title="System Info" icon={Hash}>
        <div className="flex flex-col gap-0.5">
          <FieldRow label="Created" value={formatDate(company.created_at)} />
          <FieldRow label="Updated" value={relTime(company.updated_at)} />
          <FieldRow
            label="Company ID"
            value={
              <MonoValue className="text-xs">
                {company.id.slice(0, 8)}...
              </MonoValue>
            }
            mono
          />
        </div>
      </SectionCard>
    </div>
  );
}
