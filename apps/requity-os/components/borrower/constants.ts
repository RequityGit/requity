import type { EntityType, BorrowerRole } from "@/app/types/borrower";

export const ENTITY_TYPES: EntityType[] = [
  "LLC",
  "Corporation",
  "Limited Partnership",
  "Trust",
  "Individual",
  "Joint Venture",
  "S-Corp",
  "Other",
];

export const BORROWER_ROLES: BorrowerRole[] = [
  "Manager",
  "Member",
  "Managing Member",
  "Principal",
  "Trustee",
  "General Partner",
  "Limited Partner",
  "Officer",
  "Authorized Signer",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];
