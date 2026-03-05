import { KpiCard } from "@/components/shared/kpi-card";
import { Users, UserPlus, CalendarClock, TrendingUp } from "lucide-react";

interface CrmStatsProps {
  totalContacts: number;
  activeLeads: number;
  followUpsDue: number;
  convertedThisMonth: number;
}

export function CrmStats({
  totalContacts,
  activeLeads,
  followUpsDue,
  convertedThisMonth,
}: CrmStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <KpiCard
        title="Total Contacts"
        value={totalContacts.toString()}
        description="All CRM contacts"
        icon={<Users className="h-5 w-5" />}
      />
      <KpiCard
        title="Active Leads"
        value={activeLeads.toString()}
        description="Leads & prospects"
        icon={<UserPlus className="h-5 w-5" />}
      />
      <KpiCard
        title="Follow-Ups Due"
        value={followUpsDue.toString()}
        description="Due today or overdue"
        icon={<CalendarClock className="h-5 w-5" />}
      />
      <KpiCard
        title="Converted (MTD)"
        value={convertedThisMonth.toString()}
        description="Contacts converted"
        icon={<TrendingUp className="h-5 w-5" />}
      />
    </div>
  );
}
