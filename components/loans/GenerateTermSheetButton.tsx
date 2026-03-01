"use client";

import { useState, useCallback } from "react";
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type ButtonStatus = "idle" | "loading" | "success" | "error";

interface GenerateTermSheetButtonProps {
  loanId: string;
  loanNumber?: string;
  borrowerLastName?: string;
  templateId?: string;
  variant?: "primary" | "secondary" | "compact";
}

export default function GenerateTermSheetButton({
  loanId,
  loanNumber,
  borrowerLastName,
  templateId,
  variant = "primary",
}: GenerateTermSheetButtonProps) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = useCallback(async () => {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-term-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey || "",
        },
        body: JSON.stringify({
          loan_id: loanId,
          ...(templateId && { template_id: templateId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const nameParts = ["Term_Sheet"];
      if (borrowerLastName) nameParts.push(borrowerLastName);
      if (loanNumber) nameParts.push(loanNumber);
      const fileName = `${nameParts.join("_")}.pdf`;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Term sheet generation failed:", err);
      setErrorMsg(err.message || "Failed to generate term sheet");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }, [loanId, templateId, borrowerLastName, loanNumber, status]);

  const tokens = {
    navyDeep: "#0A1628", gold: "#C5975B", goldLight: "#D4AD72",
    white: "#FAFAF8", grayLight: "#C4C0B8", grayMid: "#8A8680",
    success: "#2D8A56", danger: "#C0392B", navyLight: "#243D66",
  };

  const iconSize = variant === "compact" ? 14 : 16;
  const icon = status === "loading"
    ? <Loader2 size={iconSize} className="animate-spin" />
    : status === "success" ? <CheckCircle2 size={iconSize} />
    : status === "error" ? <AlertCircle size={iconSize} />
    : <FileText size={iconSize} />;

  const label = status === "loading" ? "Generating..."
    : status === "success" ? "Downloaded"
    : status === "error" ? "Failed"
    : variant === "compact" ? "Term Sheet" : "Generate Term Sheet";

  const baseClasses = "inline-flex items-center gap-2 font-semibold transition-all duration-300 cursor-pointer disabled:cursor-wait";

  const variantClasses = {
    primary: `${baseClasses} px-6 py-3 rounded-lg text-sm ${
      status === "success" ? "bg-green-700 text-white"
      : status === "error" ? "bg-red-700 text-white"
      : "text-[#0A1628]"
    }`,
    secondary: `${baseClasses} px-6 py-3 rounded-lg text-sm border ${
      status === "success" ? "border-green-600 text-green-500"
      : status === "error" ? "border-red-600 text-red-500"
      : "border-[#C5975B] text-[#C5975B]"
    }`,
    compact: `${baseClasses} px-4 py-2 rounded-md text-xs ${
      status === "success" ? "text-green-500"
      : status === "error" ? "text-red-500"
      : "text-[#D4AD72]"
    }`,
  };

  const primaryGradient = status === "idle" || status === "loading"
    ? { background: `linear-gradient(135deg, ${tokens.gold}, ${tokens.goldLight})` }
    : {};

  return (
    <div className="relative inline-block">
      <button
        className={variantClasses[variant]}
        style={variant === "primary" ? primaryGradient : {}}
        onClick={handleGenerate}
        disabled={status === "loading"}
        title={status === "error" ? errorMsg : "Generate a PDF term sheet for this loan"}
      >
        {icon}
        {label}
        {status === "idle" && variant === "primary" && <Download size={14} className="opacity-60 ml-0.5" />}
      </button>
      {status === "error" && errorMsg && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#0F2140] border border-red-800/30 rounded-md px-3 py-2 text-xs text-red-400 whitespace-nowrap z-50 shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
