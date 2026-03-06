"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Landmark, Receipt } from "lucide-react";
import { DotPill, SectionCard } from "@/components/crm/contact-360/contact-detail-shared";
import { formatCurrency, formatPercent } from "@/lib/format";
import { relTime } from "@/components/crm/contact-360/contact-detail-shared";
import { STATUS_CONFIG } from "@/components/crm/contact-360/types";
import type { CompanyDetailData } from "../types";
import { QUOTE_STATUS_CONFIG } from "../types";

interface DealsTabProps {
  company: CompanyDetailData;
}

interface DealRow {
  id: string;
  name: string;
  stage: string | null;
  amount: number | null;
  rate: number | null;
  ltv: number | null;
  type: string | null;
  borrower_name: string | null;
}

interface QuoteRow {
  id: string;
  deal: string | null;
  product: string | null;
  amount: number | null;
  rate: number | null;
  origination: number | null;
  ltv: number | null;
  term: string | null;
  status: string | null;
  submitted_at: string | null;
  responded_at: string | null;
}

export function CompanyDealsTab({ company }: DealsTabProps) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [quoteFilter, setQuoteFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const isLender = company.company_type === "lender";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Fetch deals — for now placeholder since loans don't have direct company_id
      // In a real implementation, deals would be linked through a junction table
      // For now, show empty state
      setDeals([]);

      // Fetch quotes for lender companies
      if (isLender) {
        // Try to match via dscr_lenders name
        const { data: lenderMatch } = await supabase
          .from("dscr_lenders")
          .select("id")
          .or(`name.ilike.%${company.name}%,short_name.ilike.%${company.name}%`)
          .limit(5);

        if (lenderMatch && lenderMatch.length > 0) {
          const lenderIds = lenderMatch.map(
            (l: { id: string }) => l.id
          );

          // Get products for these lenders
          const { data: products } = await supabase
            .from("dscr_lender_products")
            .select("id, product_name, lender_id")
            .in("lender_id", lenderIds);

          if (products && products.length > 0) {
            const productIds = products.map(
              (p: { id: string }) => p.id
            );

            // Get quotes for these products
            const { data: quoteData } = await supabase
              .from("dscr_quotes")
              .select(
                "id, borrower_name, selected_rate, selected_price, status, created_at, selected_lender_product_id"
              )
              .in("selected_lender_product_id", productIds)
              .order("created_at", { ascending: false })
              .limit(50);

            if (quoteData) {
              const productLookup: Record<
                string,
                { product_name: string }
              > = {};
              products.forEach(
                (p: {
                  id: string;
                  product_name: string;
                }) => {
                  productLookup[p.id] = {
                    product_name: p.product_name,
                  };
                }
              );

              setQuotes(
                quoteData.map(
                  (q: Record<string, unknown>) => ({
                    id: q.id as string,
                    deal: (q.borrower_name as string) || "—",
                    product:
                      productLookup[
                        q.selected_lender_product_id as string
                      ]?.product_name || "—",
                    amount: null,
                    rate: q.selected_rate as number | null,
                    origination: q.selected_price as number | null,
                    ltv: null,
                    term: null,
                    status: q.status as string | null,
                    submitted_at: q.created_at as string | null,
                    responded_at: null,
                  })
                )
              );
            }
          }
        }
      }

      setLoaded(true);
    };

    load();
  }, [company.id, company.name, isLender]);

  const filteredQuotes =
    quoteFilter === "all"
      ? quotes
      : quotes.filter((q) => q.status === quoteFilter);

  const pipelineTotal = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Deals Table */}
      <SectionCard title="Deals" icon={Landmark} noPad>
        {!loaded ? (
          <div className="p-5">
            <div className="h-20 rounded-lg bg-muted animate-pulse" />
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
              <Landmark
                className="h-6 w-6 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No deals linked
            </h3>
            <p className="text-sm text-muted-foreground">
              Deals will appear here when linked to this company.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Deal",
                    "Stage",
                    "Amount",
                    "Rate",
                    "LTV",
                    "Type",
                    isLender ? "Borrower" : "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                      style={{
                        textAlign: ["Amount", "Rate", "LTV"].includes(h)
                          ? "right"
                          : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => {
                  const stageCfg =
                    STATUS_CONFIG[d.stage || ""] || STATUS_CONFIG.lead;
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-border/40 cursor-pointer hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-[13px] font-medium">
                        {d.name}
                      </td>
                      <td className="px-4 py-3">
                        <DotPill
                          color={stageCfg.dot}
                          label={
                            d.stage
                              ?.replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase()) || "—"
                          }
                          small
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-medium font-mono num"
                      >
                        {formatCurrency(d.amount)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-mono num"
                      >
                        {formatPercent(d.rate)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-mono num"
                      >
                        {d.ltv ? `${d.ltv}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {d.type || "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {isLender ? d.borrower_name || "—" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>{deals.length} deals</span>
              <span
                className="font-medium font-mono num"
              >
                Pipeline: {formatCurrency(pipelineTotal)}
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Quotes — Lender only */}
      {isLender && (
        <SectionCard title="Quote History" icon={Receipt} noPad>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex gap-1.5">
              {["all", "accepted", "declined", "countered", "pending"].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setQuoteFilter(s)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-all duration-150 ${
                      quoteFilter === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredQuotes.length} quotes
            </span>
          </div>

          {!loaded ? (
            <div className="p-5">
              <div className="h-20 rounded-lg bg-muted animate-pulse" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
                <Receipt
                  className="h-6 w-6 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No quotes
              </h3>
              <p className="text-sm text-muted-foreground">
                {quoteFilter !== "all"
                  ? `No ${quoteFilter} quotes. Try changing the filter.`
                  : "Quote history will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Deal",
                      "Product",
                      "Rate",
                      "Points",
                      "Status",
                      "Submitted",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                        style={{
                          textAlign: ["Rate", "Points"].includes(h)
                            ? "right"
                            : "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((q) => {
                    const qsCfg =
                      QUOTE_STATUS_CONFIG[q.status || ""] ||
                      QUOTE_STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={q.id}
                        className="border-b border-border/40 cursor-pointer hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-[13px] font-medium">
                          {q.deal}
                        </td>
                        <td className="px-4 py-3 text-xs">{q.product}</td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-mono num"
                        >
                          {formatPercent(q.rate)}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-mono num"
                        >
                          {q.origination != null ? `${q.origination}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <DotPill
                            color={qsCfg.color}
                            label={qsCfg.label}
                            small
                          />
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">
                          {relTime(q.submitted_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Quote summary footer */}
              <div className="px-4 py-3 border-t border-border flex gap-6 text-xs text-muted-foreground">
                <span>
                  Accepted:{" "}
                  <strong className="text-[#22A861]">
                    {quotes.filter((q) => q.status === "accepted").length}
                  </strong>
                </span>
                <span>
                  Declined:{" "}
                  <strong className="text-[#E5453D]">
                    {quotes.filter((q) => q.status === "declined").length}
                  </strong>
                </span>
                <span>
                  Countered:{" "}
                  <strong className="text-[#E5930E]">
                    {quotes.filter((q) => q.status === "countered").length}
                  </strong>
                </span>
                {quotes.length > 0 && (
                  <span
                    className="ml-auto font-medium text-foreground font-mono num"
                  >
                    Avg Rate:{" "}
                    {formatPercent(
                      quotes.reduce((a, q) => a + (q.rate || 0), 0) /
                        quotes.filter((q) => q.rate != null).length || 0
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
