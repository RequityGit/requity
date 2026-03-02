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
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[5px] text-[11.5px] font-semibold transition-all duration-150 no-underline ${
                a.primary
                  ? "bg-gold text-white border-none hover:bg-gold-light"
                  : "bg-transparent text-dash-text-sec border border-border hover:border-foreground/20 hover:text-foreground"
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
