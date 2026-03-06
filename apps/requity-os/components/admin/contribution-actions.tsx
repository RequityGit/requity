"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

interface ContributionActionsProps {
  contributionId: string;
  status: string;
}

export function ContributionActions({ contributionId, status }: ContributionActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  async function markAsPaid() {
    const { error } = await supabase
      .from("capital_calls")
      .update({
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", contributionId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Contribution marked as paid." });
      router.refresh();
    }
  }

  if (status === "paid") return null;

  return (
    <Button variant="ghost" size="sm" onClick={markAsPaid} title="Mark as paid">
      <Check className="h-4 w-4" />
    </Button>
  );
}
