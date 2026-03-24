"use client";

import { useState, useEffect } from "react";
import { FormEngine } from "@/components/forms/FormEngine";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface DealInfo {
  id: string;
  name: string;
  fundraise_slug: string;
  fundraise_description: string | null;
  fundraise_target: number | null;
  fundraise_amount_options: number[] | null;
}

export function SoftCommitmentFormPage({ slug }: { slug: string }) {
  const [deal, setDeal] = useState<DealInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/fundraise/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setDeal(data.deal))
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

  // Pass deal-specific data to the form engine via prefillData.
  // The _deal_amount_options key is read by the InvestmentAmountSelector custom component.
  const prefillData: Record<string, unknown> = {
    _deal_amount_options: deal.fundraise_amount_options,
    _deal_name: deal.name,
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        {/* Branded header */}
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground mt-6">
            {deal.name}
          </h1>
          {deal.fundraise_description && (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {deal.fundraise_description}
            </p>
          )}
        </div>

        {/* Form engine renders the soft-commitment form definition */}
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

        <p className="text-xs text-muted-foreground/60 text-center mt-6">
          &copy; {new Date().getFullYear()} Requity Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center py-2">
      <Image
        src="/requity-logo-color.svg"
        alt="Requity Group"
        width={200}
        height={39}
        priority
      />
    </div>
  );
}
