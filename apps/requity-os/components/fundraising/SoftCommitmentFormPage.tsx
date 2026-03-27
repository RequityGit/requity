"use client";

import { useState, useEffect } from "react";
import { FormEngine } from "@/components/forms/FormEngine";
import { Loader2, MapPin, Building2, FileDown, CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { getAssetClassLabel } from "@/lib/constants/asset-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUPABASE_STORAGE_URL } from "@/lib/supabase/constants";

interface PropertyData {
  property_type?: string;
  property_city?: string;
  property_state?: string;
  number_of_units?: string | number;
  unit_breakdown?: string;
  acreage?: string | number;
  amenities?: string;
  property_name?: string;
}

interface DealInfo {
  id: string;
  name: string;
  amount: number | null;
  property_data: PropertyData | null;
  fundraise_slug: string;
  fundraise_description: string | null;
  fundraise_target: number | null;
  fundraise_amount_options: number[] | null;
  fundraise_hero_image_url: string | null;
  fundraise_deck_url: string | null;
  fundraise_hard_cap: number | null;
}

export function SoftCommitmentFormPage({ slug }: { slug: string }) {
  const [deal, setDeal] = useState<DealInfo | null>(null);
  const [totalCommitted, setTotalCommitted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/fundraise/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setDeal(data.deal);
        setTotalCommitted(data.fundraise_committed ?? 0);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen overflow-y-auto flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !deal) {
    return (
      <div className="h-screen overflow-y-auto flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground mt-6">
            Opportunity Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            This investment opportunity is not currently available.
          </p>
        </div>
      </div>
    );
  }

  const isFullyCommitted =
    deal.fundraise_hard_cap != null &&
    deal.fundraise_hard_cap > 0 &&
    totalCommitted >= deal.fundraise_hard_cap;

  const property = deal.property_data;
  const location =
    property?.property_city && property?.property_state
      ? `${property.property_city}, ${property.property_state}`
      : property?.property_state ?? null;

  const propertyType = property?.property_type
    ? getAssetClassLabel(property.property_type)
    : null;

  const metrics: { label: string; value: string }[] = [];
  if (deal.amount) metrics.push({ label: "Loan Amount", value: formatCurrency(deal.amount) });
  if (propertyType) metrics.push({ label: "Property Type", value: propertyType });
  if (property?.number_of_units) {
    const units = String(property.number_of_units);
    const breakdown = property.unit_breakdown ? ` (${property.unit_breakdown})` : "";
    metrics.push({ label: "Units", value: `${units}${breakdown}` });
  }
  if (location) metrics.push({ label: "Location", value: location });
  if (property?.acreage) metrics.push({ label: "Acreage", value: `${property.acreage} ac` });

  const prefillData: Record<string, unknown> = {
    _deal_amount_options: deal.fundraise_amount_options,
    _deal_name: deal.name,
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      {/* Header */}
      <header className="bg-[#0f1729] py-4 px-6">
        <div className="mx-auto max-w-4xl">
          <img
            src={`${SUPABASE_STORAGE_URL}/brand-assets/Requity%20Logo%20White.svg`}
            alt="Requity Group"
            style={{ height: 36, width: "auto" }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-24">
        {/* Fully Committed Banner */}
        {isFullyCommitted && (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  This opportunity has been fully committed
                </h2>
                <p className="mt-1.5 text-sm text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  We have reached our commitment goal of {formatCurrency(deal.fundraise_hard_cap!)}.
                  We still encourage you to review the details below and submit a commitment,
                  which will be added to our waitlist. It&apos;s not uncommon for soft commitments
                  to withdraw before funding.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Waitlist open
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Image */}
        {deal.fundraise_hero_image_url && (
          <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-8">
            <Image
              src={deal.fundraise_hero_image_url}
              alt={deal.name}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Deal Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {deal.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {propertyType && (
              <Badge variant="secondary" className="text-xs font-medium">
                <Building2 className="h-3 w-3 mr-1" />
                {propertyType}
              </Badge>
            )}
            {location && (
              <Badge variant="outline" className="text-xs font-medium">
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </Badge>
            )}
            {property?.number_of_units && (
              <Badge variant="outline" className="text-xs font-medium">
                {property.number_of_units} Units
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {deal.fundraise_description && (
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            {deal.fundraise_description}
          </p>
        )}

        {/* Key Metrics */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {m.label}
                  </p>
                  <p className="text-lg font-semibold text-foreground mt-1 num">
                    {m.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Deck Download */}
        {deal.fundraise_deck_url && (
          <div className="mb-10">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a
                href={deal.fundraise_deck_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileDown className="h-4 w-4" />
                Download Investment Overview
              </a>
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="rq-divider mb-10" />

        {/* Form Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground text-center mb-2">
            {isFullyCommitted ? "Join the Waitlist" : "Express Your Interest"}
          </h2>
          {isFullyCommitted && (
            <p className="text-sm text-muted-foreground text-center mb-6">
              This deal is fully committed. Submit your information below to be added to the waitlist
              in case additional capacity becomes available.
            </p>
          )}
          {!isFullyCommitted && <div className="mb-6" />}

          <FormEngine
            formSlug="soft-commitment"
            context="page"
            dealId={deal.id}
            prefillData={prefillData}
          />

          <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
            This is a non-binding expression of interest. Submitting this form does not obligate
            you to invest or create any binding agreement.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <a
            href="https://requitygroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground rq-transition"
          >
            requitygroup.com
          </a>
          <span className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Requity Group
          </span>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center py-2">
      <img
        src={`${SUPABASE_STORAGE_URL}/brand-assets/Requity%20Logo%20Color.svg`}
        alt="Requity Group"
        style={{ height: 40, width: "auto" }}
      />
    </div>
  );
}
