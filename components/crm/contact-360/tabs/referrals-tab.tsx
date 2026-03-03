"use client";

import { Users } from "lucide-react";
import { EmptyState } from "../shared";

export function ReferralsTab() {
  return (
    <EmptyState
      title="No referrals tracked"
      description="Referral pipeline and conversion metrics will appear here once referrals are logged."
      icon={Users}
    />
  );
}
