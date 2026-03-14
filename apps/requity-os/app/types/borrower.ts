export interface DealBorrowingEntity {
  id: string;
  deal_id: string;
  entity_name: string;
  entity_type: string;
  ein: string;
  state_of_formation: string;
  date_of_formation: string | null;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DealBorrowerMember {
  id: string;
  borrowing_entity_id: string;
  deal_id: string;
  contact_id: string;
  ownership_pct: number;
  credit_score: number;
  liquidity: number;
  net_worth: number;
  experience: number;
  is_guarantor: boolean;
  role: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export interface BorrowerProfile {
  id: string;
  contact_id: string;
  default_credit_score: number;
  default_liquidity: number;
  default_net_worth: number;
  default_experience: number;
  bio: string;
  created_at: string;
  updated_at: string;
}

export type EntityType =
  | "LLC"
  | "Corporation"
  | "Limited Partnership"
  | "Trust"
  | "Individual"
  | "Joint Venture"
  | "S-Corp"
  | "Other";

export type BorrowerRole =
  | "Manager"
  | "Member"
  | "Managing Member"
  | "Principal"
  | "Trustee"
  | "General Partner"
  | "Limited Partner"
  | "Officer"
  | "Authorized Signer";

export interface BorrowerRollups {
  combined_liquidity: number;
  combined_net_worth: number;
  lowest_fico: number;
  total_ownership_pct: number;
}
