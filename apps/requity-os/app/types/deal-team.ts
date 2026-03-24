export interface DealTeamContact {
  id: string;
  deal_id: string;
  contact_id: string | null;
  manual_name: string;
  manual_company: string;
  manual_phone: string;
  manual_email: string;
  role: string;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
}

export type DealTeamRole =
  | "Broker"
  | "Title Company"
  | "Insurance Agent"
  | "Appraiser"
  | "Attorney"
  | "CPA/Accountant"
  | "Property Manager"
  | "Contractor"
  | "Other";

export const DEAL_TEAM_ROLES: DealTeamRole[] = [
  "Broker",
  "Title Company",
  "Insurance Agent",
  "Appraiser",
  "Attorney",
  "CPA/Accountant",
  "Property Manager",
  "Contractor",
  "Other",
];

export function getDealTeamContactDisplay(dtc: DealTeamContact) {
  if (dtc.contact) {
    const name = [dtc.contact.first_name, dtc.contact.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return {
      name: name || "Unknown",
      company: dtc.contact.company_name ?? "",
      phone: dtc.contact.phone ?? "",
      email: dtc.contact.email ?? "",
    };
  }
  return {
    name: dtc.manual_name,
    company: dtc.manual_company,
    phone: dtc.manual_phone,
    email: dtc.manual_email,
  };
}
