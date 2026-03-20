import {
  Banknote,
  Users,
  TrendingUp,
  Building2,
  FileText,
  FolderKanban,
  CheckSquare,
  Contact,
  Landmark,
  File,
  type LucideIcon,
} from "lucide-react";

export type SearchEntityType =
  | "loan"
  | "borrower"
  | "borrower_entity"
  | "investor"
  | "investing_entity"
  | "fund"
  | "crm_contact"
  | "document"
  | "loan_document"
  | "project"
  | "task";

interface EntityConfig {
  icon: LucideIcon;
  label: string;
  pluralLabel: string;
  color: string;
  bgColor: string;
}

export const ENTITY_CONFIG: Record<SearchEntityType, EntityConfig> = {
  loan: {
    icon: Banknote,
    label: "Loan",
    pluralLabel: "Loans",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  borrower: {
    icon: Users,
    label: "Borrower",
    pluralLabel: "Borrowers",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  borrower_entity: {
    icon: Building2,
    label: "Borrower Entity",
    pluralLabel: "Borrower Entities",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  investor: {
    icon: TrendingUp,
    label: "Investor",
    pluralLabel: "Investors",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
  },
  investing_entity: {
    icon: Landmark,
    label: "Investing Entity",
    pluralLabel: "Investing Entities",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
  },
  fund: {
    icon: Building2,
    label: "Fund",
    pluralLabel: "Funds",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  crm_contact: {
    icon: Contact,
    label: "Contact",
    pluralLabel: "Contacts",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
  },
  document: {
    icon: FileText,
    label: "Document",
    pluralLabel: "Documents",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
  },
  loan_document: {
    icon: File,
    label: "Loan Document",
    pluralLabel: "Loan Documents",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
  },
  project: {
    icon: FolderKanban,
    label: "Project",
    pluralLabel: "Projects",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  task: {
    icon: CheckSquare,
    label: "Task",
    pluralLabel: "Tasks",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
  },
};

// Category chips that appear in the filter bar
export interface CategoryChip {
  key: string | null; // null = "All"
  label: string;
  entityTypes: SearchEntityType[];
}

export const ALL_CATEGORIES: CategoryChip[] = [
  { key: null, label: "All", entityTypes: [] },
  { key: "loan", label: "Loans", entityTypes: ["loan"] },
  { key: "borrower", label: "Borrowers", entityTypes: ["borrower", "borrower_entity"] },
  { key: "investor", label: "Investors", entityTypes: ["investor", "investing_entity"] },
  { key: "fund", label: "Funds", entityTypes: ["fund"] },
  { key: "crm_contact", label: "Contacts", entityTypes: ["crm_contact"] },
  { key: "document", label: "Documents", entityTypes: ["document", "loan_document"] },
  { key: "project", label: "Projects", entityTypes: ["project"] },
  { key: "task", label: "Tasks", entityTypes: ["task"] },
];

// Role-based category visibility
const ROLE_VISIBLE_CATEGORIES: Record<string, string[]> = {
  super_admin: ["loan", "borrower", "investor", "fund", "crm_contact", "document", "project", "task"],
  admin: ["loan", "borrower", "investor", "fund", "crm_contact", "document", "project", "task"],
  borrower: ["loan", "document"],
  investor: ["fund", "document"],
};

export function getCategoriesForRole(role: string): CategoryChip[] {
  const visibleKeys = ROLE_VISIBLE_CATEGORIES[role] || [];
  return ALL_CATEGORIES.filter(
    (cat) => cat.key === null || visibleKeys.includes(cat.key)
  );
}

// Build navigation URL for a search result
export function getEntityUrl(
  entityType: SearchEntityType,
  id: string,
  metadata: Record<string, unknown>,
  role: string
): string {
  switch (entityType) {
    case "loan":
      return role === "borrower"
        ? `/b/loans/${id}`
        : `/pipeline/${(metadata.loan_number as string) || (metadata.deal_number as string) || id}`;
    case "borrower":
      return `/borrowers/${id}`;
    case "borrower_entity":
      return `/borrowers/${metadata.borrower_id}`;
    case "investor":
      return `/investors/${id}`;
    case "investing_entity":
      return `/investors/${metadata.investor_id}`;
    case "fund":
      return role === "investor"
        ? `/i/funds/${id}`
        : `/funds/${id}`;
    case "crm_contact":
      return `/crm/${id}`;
    case "document":
      if (metadata.loan_id) return `/pipeline/${(metadata.loan_number as string) || metadata.loan_id}`;
      if (metadata.fund_id) return `/funds/${metadata.fund_id}`;
      return "#";
    case "loan_document":
      return metadata.loan_id
        ? `/pipeline/${(metadata.loan_number as string) || metadata.loan_id}`
        : "#";
    case "project":
      return `/tasks`;
    case "task":
      return `/tasks`;
    default:
      return "#";
  }
}

// Get primary display text for a result
export function getPrimaryText(
  entityType: SearchEntityType,
  metadata: Record<string, unknown>
): string {
  switch (entityType) {
    case "loan":
      return (metadata.loan_number as string) || "Untitled Loan";
    case "borrower":
    case "investor":
    case "crm_contact":
      return (metadata.name as string) || "Unknown";
    case "borrower_entity":
    case "investing_entity":
      return (metadata.entity_name as string) || "Unknown Entity";
    case "fund":
      return (metadata.name as string) || "Untitled Fund";
    case "document":
      return (metadata.file_name as string) || "Untitled Document";
    case "loan_document":
      return (metadata.document_name as string) || "Untitled Document";
    case "project":
      return (metadata.project_name as string) || "Untitled Project";
    case "task":
      return (metadata.title as string) || "Untitled Task";
    default:
      return "Unknown";
  }
}

// Get secondary display text for a result
export function getSecondaryText(
  entityType: SearchEntityType,
  metadata: Record<string, unknown>
): string {
  switch (entityType) {
    case "loan": {
      const parts: string[] = [];
      if (metadata.property_address) parts.push(metadata.property_address as string);
      if (metadata.borrower_name) parts.push(metadata.borrower_name as string);
      return parts.join(" · ") || "";
    }
    case "borrower": {
      const parts: string[] = [];
      if (metadata.email) parts.push(metadata.email as string);
      if (metadata.city && metadata.state)
        parts.push(`${metadata.city}, ${metadata.state}`);
      return parts.join(" · ") || "";
    }
    case "borrower_entity":
      return (metadata.borrower_name as string) || "";
    case "investor": {
      const parts: string[] = [];
      if (metadata.email) parts.push(metadata.email as string);
      if (metadata.city && metadata.state)
        parts.push(`${metadata.city}, ${metadata.state}`);
      return parts.join(" · ") || "";
    }
    case "investing_entity":
      return (metadata.investor_name as string) || "";
    case "fund": {
      const parts: string[] = [];
      if (metadata.fund_type) parts.push(metadata.fund_type as string);
      if (metadata.vintage_year) parts.push(`Vintage ${metadata.vintage_year}`);
      return parts.join(" · ") || "";
    }
    case "crm_contact": {
      const parts: string[] = [];
      if (metadata.company_name) parts.push(metadata.company_name as string);
      if (metadata.email) parts.push(metadata.email as string);
      return parts.join(" · ") || "";
    }
    case "document":
      return (metadata.document_type as string) || "";
    case "loan_document":
      return metadata.loan_number ? `Loan ${metadata.loan_number}` : "";
    case "project": {
      const parts: string[] = [];
      if (metadata.category) parts.push(metadata.category as string);
      if (metadata.owner) parts.push(metadata.owner as string);
      return parts.join(" · ") || "";
    }
    case "task": {
      const parts: string[] = [];
      if (metadata.assigned_to_name) parts.push(metadata.assigned_to_name as string);
      if (metadata.category) parts.push(metadata.category as string);
      return parts.join(" · ") || "";
    }
    default:
      return "";
  }
}

// Get status badge info for a result
export function getStatusBadge(
  entityType: SearchEntityType,
  metadata: Record<string, unknown>
): { text: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" } | null {
  switch (entityType) {
    case "loan": {
      const stage = metadata.stage as string;
      if (!stage) return null;
      const variant = getLoanStageVariant(stage);
      return { text: formatStageLabel(stage), variant };
    }
    case "fund": {
      const status = metadata.status as string;
      if (!status) return null;
      const variant = status === "open" ? "success" : status === "fundraising" ? "info" : "secondary";
      return { text: formatStageLabel(status), variant };
    }
    case "crm_contact": {
      const status = metadata.status as string;
      if (!status) return null;
      const variant = status === "active" ? "success" : status === "converted" ? "info" : "secondary";
      return { text: formatStageLabel(status), variant };
    }
    case "investor": {
      const status = metadata.accreditation_status as string;
      if (!status) return null;
      const variant = status === "verified" ? "success" : status === "pending" ? "warning" : "secondary";
      return { text: formatStageLabel(status), variant };
    }
    case "project":
    case "task": {
      const status = metadata.status as string;
      if (!status) return null;
      const variant =
        status === "completed" || status === "done"
          ? "success"
          : status === "in_progress"
            ? "info"
            : "secondary";
      return { text: formatStageLabel(status), variant };
    }
    default:
      return null;
  }
}

function getLoanStageVariant(stage: string): "success" | "warning" | "destructive" | "secondary" | "info" {
  switch (stage) {
    case "funded":
    case "paid_off":
      return "success";
    case "processing":
    case "underwriting":
    case "approved":
    case "clear_to_close":
      return "warning";
    case "default":
    case "denied":
    case "withdrawn":
      return "destructive";
    case "lead":
    case "application":
      return "info";
    default:
      return "secondary";
  }
}

function formatStageLabel(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Quick navigation links for empty state
export interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getQuickLinks(role: string): QuickLink[] {
  if (role === "borrower") {
    return [
      { label: "My Loans", href: "/b/loans", icon: Banknote },
      { label: "My Documents", href: "/b/documents", icon: FileText },
    ];
  }
  if (role === "investor") {
    return [
      { label: "My Funds", href: "/i/funds", icon: Building2 },
      { label: "My Documents", href: "/i/documents", icon: FileText },
    ];
  }
  return [
    { label: "Pipeline", href: "/pipeline", icon: Banknote },
    { label: "Investors", href: "/contacts", icon: TrendingUp },
    { label: "Contacts", href: "/contacts", icon: Contact },
    { label: "Tasks", href: "/tasks", icon: FolderKanban },
  ];
}

// Recent searches helpers
const RECENT_SEARCHES_KEY = "requity_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s !== query.trim());
    filtered.unshift(query.trim());
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(filtered.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
