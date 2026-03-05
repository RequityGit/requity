"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveWireInstructions,
  updatePayoffFeeDefaults,
} from "@/app/(authenticated)/control-center/payoff-settings/actions";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WireInstructions {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  wire_type: string;
}

interface FeeDefault {
  id: string;
  fee_name: string;
  fee_label: string;
  default_amount: number;
  is_active: boolean;
  sort_order: number;
}

interface PayoffSettingsClientProps {
  initialWireInstructions: WireInstructions | null;
  initialFeeDefaults: FeeDefault[];
}

export function PayoffSettingsClient({
  initialWireInstructions,
  initialFeeDefaults,
}: PayoffSettingsClientProps) {
  // ── Wire Instructions State ────────────────────────────────────
  const [wireForm, setWireForm] = useState({
    bank_name: initialWireInstructions?.bank_name ?? "",
    account_name: initialWireInstructions?.account_name ?? "Requity LLC",
    account_number: initialWireInstructions?.account_number ?? "",
    routing_number: initialWireInstructions?.routing_number ?? "",
    wire_type: initialWireInstructions?.wire_type ?? "ABA (Domestic)",
  });
  const [wireSaving, setWireSaving] = useState(false);
  const [wireMessage, setWireMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Fee Defaults State ─────────────────────────────────────────
  const [fees, setFees] = useState<FeeDefault[]>(initialFeeDefaults);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeMessage, setFeeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Wire Instructions Handlers ─────────────────────────────────

  const handleWireSave = async () => {
    setWireSaving(true);
    setWireMessage(null);

    const result = await saveWireInstructions(wireForm);

    if (result.error) {
      setWireMessage({ type: "error", text: result.error });
    } else {
      setWireMessage({ type: "success", text: "Wire instructions saved successfully." });
    }
    setWireSaving(false);
  };

  // ── Fee Defaults Handlers ──────────────────────────────────────

  const updateFee = (id: string, field: "default_amount" | "is_active", value: any) => {
    setFees((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleFeeSave = async () => {
    setFeeSaving(true);
    setFeeMessage(null);

    const updates = fees.map((f) => ({
      id: f.id,
      default_amount: f.default_amount,
      is_active: f.is_active,
    }));

    const result = await updatePayoffFeeDefaults(updates);

    if (result.error) {
      setFeeMessage({ type: "error", text: result.error });
    } else {
      setFeeMessage({ type: "success", text: "Fee defaults saved successfully." });
    }
    setFeeSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Wire Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Wire Instructions</CardTitle>
              <CardDescription>
                Configure the wire transfer details that appear on payoff statements.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={wireForm.bank_name}
                onChange={(e) => setWireForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                placeholder="e.g., JP Morgan Chase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={wireForm.account_name}
                onChange={(e) => setWireForm((prev) => ({ ...prev, account_name: e.target.value }))}
                placeholder="e.g., Requity LLC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={wireForm.account_number}
                onChange={(e) => setWireForm((prev) => ({ ...prev, account_number: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing_number">Routing Number</Label>
              <Input
                id="routing_number"
                value={wireForm.routing_number}
                onChange={(e) => setWireForm((prev) => ({ ...prev, routing_number: e.target.value }))}
                placeholder="Enter routing number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wire_type">Wire Type</Label>
              <Input
                id="wire_type"
                value={wireForm.wire_type}
                onChange={(e) => setWireForm((prev) => ({ ...prev, wire_type: e.target.value }))}
                placeholder="e.g., ABA (Domestic)"
              />
            </div>
          </div>

          {wireMessage && (
            <MessageBanner type={wireMessage.type} text={wireMessage.text} onDismiss={() => setWireMessage(null)} />
          )}

          <Button onClick={handleWireSave} disabled={wireSaving}>
            {wireSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Wire Instructions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Payoff Fee Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Payoff Fee Defaults</CardTitle>
              <CardDescription>
                Configure the default fee amounts applied to payoff statements. Users can override these per-statement.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border">
            <div className="grid grid-cols-[1fr_140px_80px] gap-4 px-4 py-2 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
              <span>Fee</span>
              <span>Default Amount</span>
              <span>Active</span>
            </div>
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="grid grid-cols-[1fr_140px_80px] gap-4 px-4 py-3 border-b last:border-b-0 items-center"
              >
                <span className="text-sm font-medium">{fee.fee_label}</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={fee.default_amount}
                    onChange={(e) =>
                      updateFee(fee.id, "default_amount", parseFloat(e.target.value) || 0)
                    }
                    className="pl-7 num text-sm"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fee.is_active}
                    onClick={() => updateFee(fee.id, "is_active", !fee.is_active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      fee.is_active ? "bg-[#1A1A1A]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fee.is_active ? "translate-x-[18px]" : "translate-x-[2px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {feeMessage && (
            <MessageBanner type={feeMessage.type} text={feeMessage.text} onDismiss={() => setFeeMessage(null)} />
          )}

          <Button onClick={handleFeeSave} disabled={feeSaving}>
            {feeSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Fee Defaults
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────

function MessageBanner({
  type,
  text,
  onDismiss,
}: {
  type: "success" | "error";
  text: string;
  onDismiss: () => void;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      {text}
      <button
        onClick={onDismiss}
        className={`ml-auto ${isSuccess ? "text-emerald-600 hover:text-emerald-800" : "text-red-600 hover:text-red-800"}`}
      >
        &times;
      </button>
    </div>
  );
}
