export type ContactSource = "borrower" | "broker" | "deal_team" | "internal_team";
export type ContactCategory = "external" | "internal";

export interface SelectableContact {
  /** Unique identifier (crm_contacts.id, deal_team_contacts.id, or profile_id) */
  id: string;
  /** Display name */
  name: string;
  /** 2-char initials */
  initials: string;
  /** Email (may be null for some external team contacts) */
  email: string | null;
  /** Phone (may be null) */
  phone: string | null;
  /** Role label: "Borrower", "Broker", "Title Company", "Originator", etc. */
  role: string;
  /** Whether this is an external contact or internal team member */
  category: ContactCategory;
  /** Where this contact came from */
  source: ContactSource;
  /** CRM contact ID if linked (for external contacts with crm_contacts link) */
  crmContactId?: string;
  /** For avatar color generation */
  colorSeed: string;
}
