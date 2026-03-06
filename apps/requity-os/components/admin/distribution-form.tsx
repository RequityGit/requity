"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { DISTRIBUTION_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { Plus, Loader2 } from "lucide-react";

interface DistributionFormProps {
  funds: Array<{ id: string; name: string }>;
}

interface InvestorCommitment {
  id: string;
  investor_id: string;
  commitment_amount: number;
  funded_amount: number;
  profiles: { full_name: string | null; email: string } | null;
}

export function DistributionForm({ funds }: DistributionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fundId, setFundId] = useState("");
  const [distributionType, setDistributionType] = useState("");
  const [distributionDate, setDistributionDate] = useState("");
  const [description, setDescription] = useState("");
  const [investors, setInvestors] = useState<InvestorCommitment[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [proRataTotal, setProRataTotal] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!fundId) {
      setInvestors([]);
      setAmounts({});
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
        const amts: Record<string, string> = {};
        data.forEach((c: any) => {
          amts[c.id] = "";
        });
        setAmounts(amts);
      }
    }
    loadInvestors();
  }, [fundId]);

  function applyProRata() {
    const total = parseFloat(proRataTotal);
    if (isNaN(total) || total <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid pro-rata total.",
        variant: "destructive",
      });
      return;
    }

    const totalFunded = investors.reduce(
      (sum, i) => sum + (i.funded_amount || 0),
      0
    );
    if (totalFunded <= 0) {
      toast({
        title: "No funded amounts",
        description: "No investors have funded amounts to distribute.",
        variant: "destructive",
      });
      return;
    }

    const newAmounts: Record<string, string> = {};
    investors.forEach((inv) => {
      const ratio = (inv.funded_amount || 0) / totalFunded;
      newAmounts[inv.id] = (Math.round(total * ratio * 100) / 100).toString();
    });
    setAmounts(newAmounts);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fundId || !distributionType || !distributionDate) {
      toast({
        title: "Missing fields",
        description: "Fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    const filteredInvestors = investors.filter(
      (inv) => amounts[inv.id] && parseFloat(amounts[inv.id]) > 0
    );
    const totalAmount = filteredInvestors.reduce(
      (sum, inv) => sum + parseFloat(amounts[inv.id]),
      0
    );
    const dists = filteredInvestors.map((inv, idx) => ({
      fund_id: fundId,
      investor_id: inv.investor_id,
      commitment_id: inv.id,
      distribution_type: distributionType,
      amount: parseFloat(amounts[inv.id]),
      total_amount: totalAmount,
      distribution_number: idx + 1,
      distribution_date: distributionDate,
      description: description || null,
      status: "pending" as const,
    }));

    if (dists.length === 0) {
      toast({
        title: "No amounts entered",
        description: "Enter at least one distribution amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("distributions").insert(dists);

    if (error) {
      toast({
        title: "Error recording distributions",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Recorded ${dists.length} distribution(s)`,
      });
      setOpen(false);
      resetForm();
      router.refresh();
    }
    setLoading(false);
  }

  function resetForm() {
    setFundId("");
    setDistributionType("");
    setDistributionDate("");
    setDescription("");
    setProRataTotal("");
    setAmounts({});
    setInvestors([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Record Distribution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Distribution</DialogTitle>
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
              <Label>Type *</Label>
              <Select
                value={distributionType}
                onValueChange={setDistributionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTION_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distribution Date *</Label>
              <Input
                type="date"
                value={distributionDate}
                onChange={(e) => setDistributionDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q4 2025 interest distribution"
              rows={2}
            />
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
                <Label>Amounts per Investor</Label>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
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
                          Funded: {formatCurrency(inv.funded_amount)}
                        </p>
                      </div>
                      <div className="w-36">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={amounts[inv.id] || ""}
                          onChange={(e) =>
                            setAmounts({
                              ...amounts,
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
              {loading ? "Recording..." : "Record Distributions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
