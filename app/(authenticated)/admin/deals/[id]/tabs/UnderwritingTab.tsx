"use client";

import { BarChart3, Plus, ClipboardCheck } from "lucide-react";
import { SectionCard, Btn } from "../components";

export function UnderwritingTab() {
  return (
    <SectionCard title="Underwriting Worksheet" icon={ClipboardCheck}>
      <div className="rounded-lg bg-[#F7F7F8] px-5 py-10 text-center">
        <BarChart3 size={40} className="mx-auto text-[#8B8B8B]" />
        <div className="mt-3 mb-1.5 text-[15px] font-semibold text-[#1A1A1A] font-sans">
          Underwriting Module
        </div>
        <div className="text-[13px] text-[#6B6B6B] font-sans">
          UW worksheet versions will appear here.
        </div>
        <div className="mt-4">
          <Btn label="Create New Version" icon={Plus} primary />
        </div>
      </div>
    </SectionCard>
  );
}
