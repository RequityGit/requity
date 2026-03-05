"use client";

import { useDialer } from "@/lib/dialer/dialer-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  Mail,
  Building2,
  MapPin,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function formatDate(date: string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactInfoPanel() {
  const { state } = useDialer();
  const contact = state.currentContact?.contact;

  if (state.phase === "loading") {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loading Contact...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
          No contact loaded
        </CardContent>
      </Card>
    );
  }

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle className="text-base">{fullName}</CardTitle>
              {contact.lifecycle_stage && (
                <Badge variant="secondary" className="mt-0.5 text-[10px]">
                  {contact.lifecycle_stage.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
          {state.currentContact && (
            <span className="text-xs text-muted-foreground font-mono">
              #{state.currentContact.position + 1}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <span className="font-mono">{formatPhone(contact.phone)}</span>
        </div>

        {contact.email && (
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <span className="truncate">{contact.email}</span>
          </div>
        )}

        {contact.company_name && (
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <span>{contact.company_name}</span>
          </div>
        )}

        {(contact.city || contact.state) && (
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <span>
              {[contact.city, contact.state].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {contact.source && (
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <span className="text-muted-foreground">Source:</span>
            <span>{contact.source.replace(/_/g, " ")}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <span className="text-muted-foreground">Last Contact:</span>
          <span>{formatDate(contact.last_contacted_at)}</span>
        </div>

        {contact.notes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm leading-relaxed line-clamp-4">
              {contact.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
