"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck } from "lucide-react";

interface PhoneVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  onVerified: () => void;
}

export function PhoneVerifyDialog({
  open,
  onOpenChange,
  phone,
  onVerified,
}: PhoneVerifyDialogProps) {
  const supabase = createClient();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedPhone = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;

  async function handleSendOtp() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep("verify");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length < 6) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onVerified();
    onOpenChange(false);
    // Reset state
    setStep("send");
    setOtp("");
  }

  function handleClose(open: boolean) {
    if (!open) {
      setStep("send");
      setOtp("");
      setError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-surface-white" />
            Verify Your Identity
          </DialogTitle>
          <DialogDescription>
            {step === "send"
              ? "For your security, we need to verify your identity via SMS before making sensitive changes."
              : `Enter the 6-digit code sent to ${formattedPhone}.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {step === "send" ? (
          <div className="space-y-4">
            <div className="rounded-md border p-4 bg-navy">
              <p className="text-sm text-surface-muted">
                A verification code will be sent to:
              </p>
              <p className="text-sm font-medium mt-1">{formattedPhone}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendOtp} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Code
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStep("send");
                  setOtp("");
                  setError(null);
                }}
                className="text-sm text-surface-muted hover:text-surface-white underline underline-offset-4 transition-colors"
              >
                Resend code
              </button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || otp.length < 6}>
                  {loading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Verify
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
