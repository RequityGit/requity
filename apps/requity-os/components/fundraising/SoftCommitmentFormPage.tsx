"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { SUPABASE_URL } from "@/lib/supabase/constants";

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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isAccredited, setIsAccredited] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [questions, setQuestions] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    setSubmitting(true);
    setError(null);

    const commitmentAmount =
      selectedAmount === "other"
        ? parseFloat(customAmount) || 0
        : parseFloat(selectedAmount) || 0;

    if (commitmentAmount <= 0) {
      setError("Please select or enter an investment amount.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/submit-soft-commitment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deal_slug: slug,
            name,
            email,
            phone: phone || undefined,
            is_accredited: isAccredited === "yes",
            commitment_amount: commitmentAmount,
            custom_amount:
              selectedAmount === "other" ? commitmentAmount : undefined,
            questions: questions || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900 mt-6">
            Opportunity Not Found
          </h1>
          <p className="text-gray-500 mt-2">
            This investment opportunity is not currently available.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <Logo />
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mt-8" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Thank You for Your Interest
          </h1>
          <p className="text-gray-500 mt-2">
            We have received your commitment for{" "}
            <span className="font-semibold text-gray-900">{deal.name}</span>.
            Our team will be in touch shortly to discuss next steps.
          </p>
        </div>
      </div>
    );
  }

  const amountOptions = deal.fundraise_amount_options ?? [25000, 50000, 100000, 250000];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900 mt-6">
            {deal.name}
          </h1>
          {deal.fundraise_description && (
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              {deal.fundraise_description}
            </p>
          )}
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Accredited */}
              <div className="space-y-2">
                <Label>Are you an accredited investor?</Label>
                <p className="text-xs text-gray-500">Both accredited and non-accredited investors are welcome.</p>
                <RadioGroup value={isAccredited} onValueChange={setIsAccredited}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="accredited-yes" />
                    <Label htmlFor="accredited-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="accredited-no" />
                    <Label htmlFor="accredited-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Investment Amount */}
              <div className="space-y-2">
                <Label>Investment Amount *</Label>
                <RadioGroup value={selectedAmount} onValueChange={setSelectedAmount}>
                  <div className="grid grid-cols-2 gap-2">
                    {amountOptions.map((amount) => (
                      <label
                        key={amount}
                        className={`flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${
                          selectedAmount === String(amount)
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value={String(amount)} className="sr-only" />
                        {formatCurrency(amount)}
                      </label>
                    ))}
                    <label
                      className={`flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer transition-colors col-span-2 ${
                        selectedAmount === "other"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <RadioGroupItem value="other" className="sr-only" />
                      Other Amount
                    </label>
                  </div>
                </RadioGroup>
                {selectedAmount === "other" && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-1.5">
                <Label htmlFor="questions">Questions or Comments</Label>
                <Textarea
                  id="questions"
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Any questions for our team?"
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Interest"
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                This is a non-binding expression of interest. Submitting this form does not obligate
                you to invest or create any binding agreement.
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400 text-center mt-6">
          &copy; {new Date().getFullYear()} Requity Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          R
        </text>
      </svg>
      <span className="text-xl font-bold text-gray-900">Requity Group</span>
    </div>
  );
}
