"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/format";
import { Plus, Loader2 } from "lucide-react";

interface ContributionFormProps {
  funds: Array<{ id: string; name: string }>;
}

interface InvestorCommitment {
  id: string;
  investor_id: string;
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  profiles: { full_name: string | null; email: string } | null;
}

export function ContributionForm({ funds }: ContributionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fundId, setFundId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [investors, setInvestors] = useState<InvestorCommitment[]>([]);
  const [contributionAmounts, setContributionAmounts] = useState<Record<string, string>>({});
  const [proRataTotal, setProRataTotal] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!fundId) {
      setInvestors([]);
      setContributionAmounts({});
      return;
    }

    async function loadInvestors() {
      const supabase = createClient();
      const { data } = await supabase
        .from("investor_commitments")
        .select("*, profiles(full_name, email)")
        .eq("fund_id", fundId)
        .neq("status", "redeemed");

      if (data) {
        setInvestors(data as unknown as InvestorCommitment[]);
        const amounts: Record<string, string> = {};
        data.forEach((c: any) => {
          amounts[c.id] = "";
        });
        setContributionAmounts(amounts);
      }
    }
    loadInvestors();
  }, [fundId]);

  function applyProRata() {
    const totalCall = parseFloat(proRataTotal);
    if (isNaN(totalCall) || totalCall <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid pro-rata total.",
        variant: "destructive",
      });
      return;
    }

    const totalUnfunded = investors.reduce(
      (sum, i) => sum + (i.unfunded_amount || 0),
      0
    );
    if (totalUnfunded <= 0) {
      toast({
        title: "No unfunded commitments",
        description: "All investors are fully funded.",
        variant: "destructive",
      });
      return;
    }

    const newAmounts: Record<string, string> = {};
    investors.forEach((inv) => {
      const ratio = (inv.unfunded_amount || 0) / totalUnfunded;
      newAmounts[inv.id] = (Math.round(totalCall * ratio * 100) / 100).toString();
    });
    setContributionAmounts(newAmounts);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fundId || !dueDate) {
      toast({
        title: "Missing fields",
        description: "Select an investment and due date.",
        variant: "destructive",
      });
      return;
    }

    const supabase = createClient();

    const filteredInvestors = investors.filter(
      (inv) =>
        contributionAmounts[inv.id] && parseFloat(contributionAmounts[inv.id]) > 0
    );
    const totalAmount = filteredInvestors.reduce(
      (sum, inv) => sum + parseFloat(contributionAmounts[inv.id]),
      0
    );
    const calls = filteredInvestors.map((inv, idx) => ({
      fund_id: fundId,
      investor_id: inv.investor_id,
      commitment_id: inv.id,
      call_amount: parseFloat(contributionAmounts[inv.id]),
      total_amount: totalAmount,
      call_number: idx + 1,
      due_date: dueDate,
      status: "pending" as const,
    }));

    if (calls.length === 0) {
      toast({
        title: "No amounts entered",
        description: "Enter at least one contribution amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("capital_calls").insert(calls);

    if (error) {
      toast({
        title: "Error creating contributions",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Created ${calls.length} contribution(s)`,
      });
      setOpen(false);
      setFundId("");
      setDueDate("");
      setProRataTotal("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Contribution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Contribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Investment *</Label>
              <Select value={fundId} onValueChange={setFundId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investment" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {investors.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label>Pro-Rata Total ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={proRataTotal}
                    onChange={(e) => setProRataTotal(e.target.value)}
                    placeholder="Enter total to distribute pro-rata"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={applyProRata}
                >
                  Apply Pro-Rata
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Contribution Amounts per Investor</Label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {investors.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-4 p-3 border rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.profiles?.full_name ||
                            inv.profiles?.email ||
                            "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Committed: {formatCurrency(inv.commitment_amount)} |
                          Unfunded: {formatCurrency(inv.unfunded_amount)}
                        </p>
                      </div>
                      <div className="w-36">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={contributionAmounts[inv.id] || ""}
                          onChange={(e) =>
                            setContributionAmounts({
                              ...contributionAmounts,
                              [inv.id]: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {fundId && investors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active commitments found for this investment.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Creating..." : "Create Contributions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
