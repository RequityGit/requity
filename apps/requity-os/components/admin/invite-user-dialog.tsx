"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  inviteUserAction,
  fetchInvestorsAction,
  fetchBorrowersAction,
} from "@/app/(authenticated)/(admin)/users/actions";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin" | "investor" | "borrower">(
    "investor"
  );
  const [investorId, setInvestorId] = useState<string>("");
  const [borrowerId, setBorrowerId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Data for linking
  const [investors, setInvestors] = useState<
    { id: string; first_name: string; last_name: string; email: string | null }[]
  >([]);
  const [borrowers, setBorrowers] = useState<
    { id: string; first_name: string; last_name: string; email: string | null }[]
  >([]);
  const [linkDataLoading, setLinkDataLoading] = useState(false);

  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail("");
      setFullName("");
      setRole("investor");
      setInvestorId("");
      setBorrowerId("");
    }
  }, [open]);

  // Fetch link data when going to step 2
  useEffect(() => {
    if (step === 2 && (role === "investor" || role === "borrower")) {
      setLinkDataLoading(true);
      if (role === "investor") {
        fetchInvestorsAction().then((result) => {
          if ("success" in result) setInvestors(result.investors);
          setLinkDataLoading(false);
        }).catch((err) => {
          console.error("invite-user: failed to fetch investors", err);
          setLinkDataLoading(false);
        });
      } else {
        fetchBorrowersAction().then((result) => {
          if ("success" in result) setBorrowers(result.borrowers);
          setLinkDataLoading(false);
        }).catch((err) => {
          console.error("invite-user: failed to fetch borrowers", err);
          setLinkDataLoading(false);
        });
      }
    }
  }, [step, role]);

  const canProceedStep1 = email.trim() !== "" && fullName.trim() !== "";

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      // If admin or super_admin role, skip step 2 (no linking needed)
      if (role === "admin" || role === "super_admin") {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      if (role === "admin" || role === "super_admin") {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const result = await inviteUserAction({
      email: email.trim(),
      full_name: fullName.trim(),
      role: role as "super_admin" | "admin" | "investor" | "borrower",
      investor_id: role === "investor" && investorId ? investorId : undefined,
      borrower_id: role === "borrower" && borrowerId ? borrowerId : undefined,
    });

    if ("error" in result) {
      toast({
        title: "Failed to invite user",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: `Invitation sent to ${email}` });
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter the user's basic information."}
            {step === 2 && "Link to an existing record (optional)."}
            {step === 3 && "Review and send the invitation."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name *</Label>
              <Input
                id="invite-name"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Initial Role *</Label>
              <Select
                value={role}
                onValueChange={(v) =>
                  setRole(v as "super_admin" | "admin" | "investor" | "borrower")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="borrower">Borrower</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Role-Specific Linking */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            {role === "investor" && (
              <div className="space-y-2">
                <Label>Link to Investor Record (optional)</Label>
                {linkDataLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading investors...
                  </div>
                ) : (
                  <Select value={investorId} onValueChange={setInvestorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an investor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linking</SelectItem>
                      {investors.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.first_name} {inv.last_name}
                          {inv.email ? ` (${inv.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Optionally link this user to an existing investor profile.
                </p>
              </div>
            )}

            {role === "borrower" && (
              <div className="space-y-2">
                <Label>Link to Borrower Record (optional)</Label>
                {linkDataLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading borrowers...
                  </div>
                ) : (
                  <Select value={borrowerId} onValueChange={setBorrowerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a borrower..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linking</SelectItem>
                      {borrowers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.first_name} {b.last_name}
                          {b.email ? ` (${b.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Optionally link this user to an existing borrower record.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review & Send */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{role.replace(/_/g, " ")}</span>
              </div>
              {role === "investor" && investorId && investorId !== "none" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Linked Investor
                  </span>
                  <span className="font-medium">
                    {(() => {
                      const inv = investors.find((i) => i.id === investorId);
                      return inv ? `${inv.first_name} ${inv.last_name}` : "Selected";
                    })()}
                  </span>
                </div>
              )}
              {role === "borrower" && borrowerId && borrowerId !== "none" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Linked Borrower
                  </span>
                  <span className="font-medium">
                    {(() => {
                      const b = borrowers.find((b) => b.id === borrowerId);
                      return b
                        ? `${b.first_name} ${b.last_name}`
                        : "Selected";
                    })()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent to {email}. The user will need to
              click the link to activate their account.
            </p>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceedStep1}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Invite
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
