import Link from "next/link";
import {
  Plus,
  Users,
  FileText,
  PiggyBank,
  DollarSign,
  Building2,
  Briefcase,
} from "lucide-react";
import { DashCard } from "./dash-card";
import { SectionTitle } from "./section-title";

const actions = [
  { icon: Plus, label: "Create Loan", href: "/admin/originations", primary: true },
  { icon: Users, label: "Add Investor", href: "/admin/investors/new", primary: true },
  { icon: Users, label: "Add Borrower", href: "/admin/borrowers/new", primary: false },
  { icon: FileText, label: "Upload Doc", href: "/admin/documents", primary: false },
  { icon: PiggyBank, label: "Contribution", href: "/admin/capital-calls", primary: false },
  { icon: DollarSign, label: "Distribution", href: "/admin/distributions", primary: false },
  { icon: Building2, label: "Add Property", href: "/admin/funds", primary: false },
  { icon: Briefcase, label: "Acquisition", href: "/admin/funds", primary: false },
];

export function QuickActions() {
  return (
    <div className="dash-fade-up dash-delay-7">
      <DashCard className="!p-[13px_18px]">
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="flex gap-1.5 flex-wrap">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[5px] font-body text-[11.5px] font-semibold transition-all duration-150 no-underline ${
                a.primary
                  ? "bg-gradient-to-br from-gold to-gold-light text-navy shadow-[0_2px_8px_rgba(197,151,91,0.25)] hover:shadow-[0_4px_16px_rgba(197,151,91,0.35)] border-none"
                  : "bg-transparent text-dash-text-sec border border-navy/[0.13] hover:border-navy/[0.20] hover:text-navy"
              }`}
            >
              <a.icon size={12} strokeWidth={1.5} />
              {a.label}
            </Link>
          ))}
        </div>
      </DashCard>
    </div>
  );
}
