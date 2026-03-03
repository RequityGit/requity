export interface ConstructionBudget {
  id: string;
  loan_id: string;
  total_budget: number;
  total_drawn: number;
  total_remaining: number;
  budget_version: number;
  status: "draft" | "active" | "completed" | "closed";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineItem {
  id: string;
  construction_budget_id: string;
  loan_id: string;
  category: string;
  description: string | null;
  budgeted_amount: number;
  revised_amount: number;
  drawn_amount: number;
  remaining_amount: number;
  percent_complete: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DrawRequest {
  id: string;
  loan_id: string;
  construction_budget_id: string | null;
  draw_number: number;
  request_number: string | null;
  amount_requested: number;
  amount_approved: number | null;
  status: string;
  request_date: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  wire_date: string | null;
  wire_amount: number | null;
  wire_confirmation_number: string | null;
  wire_initiated_by: string | null;
  funded_at: string | null;
  inspection_date: string | null;
  inspection_type: string | null;
  inspection_ordered_date: string | null;
  inspection_completed_date: string | null;
  inspector_id: string | null;
  inspector_name: string | null;
  completion_pct: number | null;
  description: string | null;
  borrower_id: string | null;
  requested_by: string | null;
  borrower_notes: string | null;
  internal_notes: string | null;
  loan_event_id: string | null;
  document_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DrawRequestLineItem {
  id: string;
  draw_request_id: string;
  budget_line_item_id: string;
  requested_amount: number;
  approved_amount: number | null;
  inspector_approved_percent: number | null;
  notes: string | null;
  line_item_revised_amount: number | null;
  line_item_remaining_amount: number | null;
  requires_change_order: boolean;
  change_order_id: string | null;
  approval_status: string;
}

export interface DrawDocument {
  id: string;
  draw_request_id: string;
  loan_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  budget_line_item_id: string | null;
  is_geotagged: boolean;
  geolocation_lat: number | null;
  geolocation_lng: number | null;
  photo_taken_at: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}

export interface BudgetChangeRequest {
  id: string;
  construction_budget_id: string;
  loan_id: string;
  request_number: string | null;
  requested_by: string | null;
  request_date: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  reason: string | null;
  net_budget_change: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetChangeRequestLineItem {
  id: string;
  budget_change_request_id: string;
  budget_line_item_id: string | null;
  change_action: "add" | "increase" | "decrease" | "remove";
  current_amount: number;
  proposed_amount: number;
  delta_amount: number;
  category: string | null;
  description: string | null;
}

export interface BudgetLineItemHistory {
  id: string;
  budget_line_item_id: string;
  construction_budget_id: string;
  change_type: string;
  previous_amount: number | null;
  new_amount: number | null;
  change_reason: string | null;
  changed_by: string | null;
  changed_at: string;
  budget_change_request_id: string | null;
}

export const DEFAULT_BUDGET_CATEGORIES = [
  "Site Work / Grading",
  "Demolition",
  "Foundation / Structural",
  "Roofing",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Interior Finish",
  "Exterior / Siding",
  "Windows / Doors",
  "Flooring",
  "Cabinets / Counters",
  "Appliances",
  "Landscaping",
  "Parking / Paving",
  "Fencing",
  "Common Area / Amenity",
  "Unit Turns",
  "ADA / Code Compliance",
  "Environmental",
  "Permits & Fees",
  "Architecture / Engineering",
  "GC Overhead / Profit",
  "Contingency",
  "Other 1",
  "Other 2",
  "Other 3",
  "Other 4",
  "Other 5",
];
