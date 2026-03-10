"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Zap,
  Mail,
  CheckCircle2,
  PhoneCall,
  Upload,
  DollarSign,
  Bell,
  Users,
  Shield,
  Hash,
  Phone,
  Plus,
  Check,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import {
  SectionCard,
  FieldRow,
  MonoValue,
  relTime,
} from "@/components/crm/contact-360/contact-detail-shared";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import type {
  CompanyDetailData,
  CompanyContactData,
  CompanyFollowerData,
  CompanyFileData,
} from "./types";

interface CompanyDetailSidebarProps {
  company: CompanyDetailData;
  contacts: CompanyContactData[];
  followers: CompanyFollowerData[];
  files: CompanyFileData[];
  currentUserId: string;
  currentUserName: string;
  onTabChange: (tab: string) => void;
  onComposeEmail?: () => void;
  onLogCall?: () => void;
}

export function CompanyDetailSidebar({
  company,
  contacts,
  followers,
  files,
  onTabChange,
  onComposeEmail,
  onLogCall,
}: CompanyDetailSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();

  const hasW9 = files.some((f) => f.file_type === "w9");
  const rateSheet = files.find((f) => f.file_type === "rate_sheet");

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
            {
              icon: DollarSign,
              label: "Submit Deal",
              onClick: () => toast({ title: "Coming soon" }),
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7 text-muted-foreground"
          >
            <Plus size={12} strokeWidth={1.5} /> Add
          </Button>
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
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted"
                >
                  <Avatar className="h-[22px] w-[22px] rounded-md">
                    <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {f.user_name?.split(" ")[0] || "Unknown"}
                  </span>
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
                  href={`/admin/crm/${ct.id}`}
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

      {/* Document Status */}
      <SectionCard title="Document Status" icon={Shield}>
        <div className="flex flex-col gap-2">
          {[
            {
              label: "W-9",
              status: hasW9,
              warning: false,
              detail: null,
            },
            {
              label: "Rate Sheet",
              status: !!rateSheet,
              warning: false,
              detail: rateSheet?.uploaded_at
                ? `Updated ${formatDate(rateSheet.uploaded_at)}`
                : null,
            },
          ].map((doc, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 py-1.5${i < 1 ? " border-b border-border/40" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  doc.status
                    ? doc.warning
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                }`}
              >
                {doc.status ? (
                  doc.warning ? (
                    <AlertCircle size={12} className="text-[#E5930E]" strokeWidth={1.5} />
                  ) : (
                    <Check size={12} className="text-[#22A861]" strokeWidth={1.5} />
                  )
                ) : (
                  <X size={12} className="text-[#E5453D]" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {doc.label}
                </div>
                {doc.detail && (
                  <div className="text-[10px] text-muted-foreground">{doc.detail}</div>
                )}
              </div>
            </div>
          ))}
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
