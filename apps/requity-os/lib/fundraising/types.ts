// Soft commitment types used across the fundraising feature

export type CommitmentStatus = "pending" | "confirmed" | "subscribed" | "withdrawn" | "waitlist";
export type CommitmentSource = "form" | "manual" | "imported";

export interface SoftCommitment {
  id: string;
  deal_id: string;
  contact_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  commitment_amount: number;
  custom_amount: number | null;
  is_accredited: boolean | null;
  questions: string | null;
  status: CommitmentStatus;
  source: CommitmentSource;
  submitted_at: string;
  confirmed_at: string | null;
  subscribed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  deal?: { id: string; name: string; fundraise_slug: string | null } | null;
  contact?: { contact_number: string } | null;
}

export const COMMITMENT_STATUS_OPTIONS: { value: CommitmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "subscribed", label: "Subscribed" },
  { value: "waitlist", label: "Waitlist" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const COMMITMENT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  subscribed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  waitlist: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};
