"use client";

import { Phone, Mail, Building2, Calendar, FileText, AlertTriangle } from "lucide-react";
import { useDialer } from "@/lib/dialer/dialer-context";
import type { ContactForDialer } from "@/lib/dialer/types";

function ContactCard({ contact }: { contact: ContactForDialer }) {
  const name = [contact.contact.first_name, contact.contact.last_name]
    .filter(Boolean)
    .join(" ") || "Unknown";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        {contact.contact.company_name && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3" strokeWidth={1.5} />
            {contact.contact.company_name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        {contact.contact.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span className="font-mono">{contact.contact.phone}</span>
          </div>
        )}
        {contact.contact.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{contact.contact.email}</span>
          </div>
        )}
        {contact.contact.source && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            Source: {contact.contact.source}
          </div>
        )}
        {contact.contact.last_contacted_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            Last contact: {new Date(contact.contact.last_contacted_at).toLocaleDateString()}
          </div>
        )}
        {contact.contact.dnc && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            DNC flagged
          </div>
        )}
      </div>

      {/* Phone numbers list */}
      {contact.phone_numbers.length > 1 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Phone Numbers:</p>
          {contact.phone_numbers.map((pn, i) => (
            <div
              key={pn.number}
              className={`flex items-center gap-2 text-xs ${
                i === contact.current_number_index
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Phone className="h-3 w-3" strokeWidth={1.5} />
              <span className="font-mono">{pn.number}</span>
              <span className="text-[10px]">({pn.type})</span>
              {i === contact.current_number_index && (
                <span className="text-[10px] text-emerald-500">current</span>
              )}
            </div>
          ))}
        </div>
      )}

      {contact.contact.notes && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">
            {contact.contact.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export function ContactInfoPanel() {
  const { session, currentContacts } = useDialer();

  // During on_call or dispositioning, show the connected contact
  if (
    (session.state === "on_call" || session.state === "dispositioning") &&
    session.connectedContactId
  ) {
    const connected = currentContacts.find(
      (c) => c.contact_id === session.connectedContactId
    );
    if (connected) {
      return (
        <div className="p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Connected Contact
          </h3>
          <ContactCard contact={connected} />
        </div>
      );
    }
  }

  // During dialing, show all contacts being dialed
  if (session.state === "dialing" && currentContacts.length > 0) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Dialing {currentContacts.length} Contacts
        </h3>
        {currentContacts.map((contact) => (
          <div key={contact.id} className="pb-3 border-b border-border last:border-0">
            <ContactCard contact={contact} />
          </div>
        ))}
      </div>
    );
  }

  // Default: waiting state
  return (
    <div className="p-4 flex items-center justify-center h-full text-sm text-muted-foreground">
      {session.state === "ready"
        ? "Ready to dial next group..."
        : session.state === "paused"
          ? "Session paused"
          : "Waiting..."}
    </div>
  );
}
