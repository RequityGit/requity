"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Calendar,
  User,
  X,
} from "lucide-react";
import Link from "next/link";

interface ContextPanelProps {
  channel: ChatChannelWithUnread;
  onClose: () => void;
}

interface LoanContext {
  id: string;
  loan_number: string | null;
  stage: string | null;
  type: string | null;
  purpose: string | null;
  loan_amount: number | null;
  property_address: string | null;
  property_type: string | null;
  interest_rate: number | null;
  loan_term_months: number | null;
  borrower_name: string | null;
  created_at: string;
  stage_updated_at: string | null;
}

const stageColors: Record<string, string> = {
  lead: "bg-slate-100 text-slate-800",
  application: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  underwriting: "bg-purple-100 text-purple-800",
  approved: "bg-emerald-100 text-emerald-800",
  clear_to_close: "bg-green-100 text-green-800",
  funded: "bg-teal-100 text-teal-800",
  servicing: "bg-cyan-100 text-cyan-800",
  default: "bg-red-100 text-red-800",
};

export function ContextPanel({ channel, onClose }: ContextPanelProps) {
  const [loan, setLoan] = useState<LoanContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channel.linked_entity_type !== "loan" || !channel.linked_entity_id)
      return;

    const fetchLoan = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("loans")
        .select(
          "id, loan_number, stage, type, purpose, loan_amount, property_address, property_type, interest_rate, loan_term_months, created_at, stage_updated_at"
        )
        .eq("id", channel.linked_entity_id!)
        .single();

      if (data) {
        // Also fetch borrower name
        let borrowerName = null;
        if ((data as Record<string, unknown>).borrower_id) {
          const { data: bRow } = await supabase
            .from("borrowers")
            .select("crm_contact_id")
            .eq("id", (data as Record<string, unknown>).borrower_id as string)
            .single();
          if (bRow?.crm_contact_id) {
            const { data: contact } = await (supabase as any)
              .from("crm_contacts")
              .select("first_name, last_name")
              .eq("id", bRow.crm_contact_id)
              .single();
            if (contact) {
              borrowerName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
            }
          }
        }

        setLoan({
          ...data,
          borrower_name: borrowerName,
        } as LoanContext);
      }
      setLoading(false);
    };

    fetchLoan();
  }, [channel.linked_entity_id, channel.linked_entity_type]);

  if (channel.linked_entity_type !== "loan") return null;

  return (
    <div className="w-72 border-l border-slate-200 bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Deal Context</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : loan ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Loan number & status */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Loan Number</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {loan.loan_number || "N/A"}
              </span>
              <Badge
                className={
                  stageColors[loan.stage || ""] || "bg-slate-100 text-slate-800"
                }
              >
                {(loan.stage || "unknown").replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          {/* Type */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Type / Purpose</div>
            <div className="text-sm text-slate-900">
              {(loan.type || "N/A").toUpperCase()} &mdash;{" "}
              {(loan.purpose || "N/A").replace(/_/g, " ")}
            </div>
          </div>

          {/* Amount */}
          {loan.loan_amount && (
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Loan Amount
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {formatCurrency(loan.loan_amount)}
              </div>
            </div>
          )}

          {/* Property */}
          {loan.property_address && (
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Property
              </div>
              <div className="text-sm text-slate-900">
                {loan.property_address}
              </div>
              {loan.property_type && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {loan.property_type.replace(/_/g, " ").toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Terms */}
          {(loan.interest_rate || loan.loan_term_months) && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Terms</div>
              <div className="text-sm text-slate-900">
                {loan.interest_rate && `${loan.interest_rate}% rate`}
                {loan.interest_rate && loan.loan_term_months && " / "}
                {loan.loan_term_months && `${loan.loan_term_months} months`}
              </div>
            </div>
          )}

          {/* Borrower */}
          {loan.borrower_name && (
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" /> Borrower
              </div>
              <div className="text-sm text-slate-900">{loan.borrower_name}</div>
            </div>
          )}

          {/* Key dates */}
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Key Dates
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <div>
                Created:{" "}
                {new Date(loan.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              {loan.stage_updated_at && (
                <div>
                  Stage updated:{" "}
                  {new Date(loan.stage_updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick link to loan */}
          <Link
            href={`/admin/loans/${loan.id}`}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View full loan details
          </Link>
        </div>
      ) : (
        <div className="p-4 text-sm text-slate-400 text-center">
          Loan not found
        </div>
      )}
    </div>
  );
}
