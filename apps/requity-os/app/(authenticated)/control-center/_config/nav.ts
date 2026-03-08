import {
  Users,
  FileCheck,
  FileText,
  Calculator,
  Banknote,
  GitBranch,
  TrendingUp,
  Mail,
  MailPlus,
  Settings2,
  Wrench,
  ScrollText,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type NavBadge = { text: string; type: "warn" | "soon" | "info" };

export type NavItem = {
  id: string;
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadge;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "people",
    label: "People & Access",
    items: [
      {
        id: "users",
        label: "Users & Roles",
        desc: "View all portal users, grant or revoke roles, and manage activation status.",
        href: "/control-center/users",
        icon: Users,
      },
    ],
  },
  {
    id: "lending",
    label: "Lending",
    items: [
      {
        id: "conditions",
        label: "Loan Condition Templates",
        desc: "Configure the master checklist of loan conditions that auto-populate for new loans.",
        href: "/control-center/conditions",
        icon: FileCheck,
      },
      {
        id: "term-sheets",
        label: "Term Sheet Templates",
        desc: "Configure how term sheets look for each loan type.",
        href: "/control-center/term-sheets",
        icon: FileText,
      },
      {
        id: "underwriting",
        label: "Underwriting Assumptions",
        desc: "Manage default underwriting assumptions and parameters.",
        href: "/control-center/underwriting",
        icon: Calculator,
      },
      {
        id: "payoff-settings",
        label: "Payoff Settings",
        desc: "Configure wire instructions and default fees for payoff statements.",
        href: "/control-center/payoff-settings",
        icon: Banknote,
      },
      {
        id: "pipeline-stages",
        label: "Pipeline Stages",
        desc: "Advancement rules and warn/alert thresholds per pipeline stage.",
        href: "/control-center/pipeline-stage-config",
        icon: GitBranch,
      },
      {
        id: "card-types",
        label: "Card Types",
        desc: "Configure pipeline card types, metrics, and underwriting fields.",
        href: "/control-center/card-types",
        icon: Layers,
      },
      {
        id: "pricing-engine",
        label: "Pricing Engine",
        desc: "Automated pricing rules and rate calculations.",
        href: "/control-center/pricing",
        icon: TrendingUp,
        badge: { text: "Soon", type: "soon" },
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      {
        id: "email-templates",
        label: "Email Templates",
        desc: "Manage email templates used across the platform.",
        href: "/control-center/email-templates",
        icon: Mail,
      },
      {
        id: "user-email-templates",
        label: "User Email Templates",
        desc: "Manage reusable templates for team-composed emails with merge fields.",
        href: "/control-center/user-email-templates",
        icon: MailPlus,
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        id: "workflow-builder",
        label: "Workflow Builder",
        desc: "Design and manage workflow automations and approval rules.",
        href: "/control-center/workflow-builder",
        icon: GitBranch,
      },
      {
        id: "field-manager",
        label: "Field Manager",
        desc: "Configure field visibility and ordering across deal detail modules.",
        href: "/control-center/field-manager",
        icon: Settings2,
      },
      {
        id: "system-settings",
        label: "System Settings",
        desc: "Global platform configuration and preferences.",
        href: "/control-center/settings",
        icon: Wrench,
        badge: { text: "Soon", type: "soon" },
      },
      {
        id: "audit-log",
        label: "Audit Log",
        desc: "Track all administrative actions and changes.",
        href: "/control-center/audit",
        icon: ScrollText,
        badge: { text: "Soon", type: "soon" },
      },
    ],
  },
];
