export type UserRole = 'borrower' | 'admin';

export type LoanType =
  | 'CRE Bridge'
  | 'Fix & Flip'
  | 'DSCR'
  | 'New Construction'
  | 'MHC'
  | 'Multifamily'
  | 'RV Park';

export type LoanStatus =
  | 'Application Received'
  | 'Processing'
  | 'Underwriting'
  | 'Approved'
  | 'Closing'
  | 'Funded';

export type DocRequirementStatus =
  | 'Pending Upload'
  | 'Uploaded'
  | 'Under Review'
  | 'Approved'
  | 'Needs Revision';

export const LOAN_STATUSES: LoanStatus[] = [
  'Application Received',
  'Processing',
  'Underwriting',
  'Approved',
  'Closing',
  'Funded',
];

export const LOAN_TYPES: LoanType[] = [
  'CRE Bridge',
  'Fix & Flip',
  'DSCR',
  'New Construction',
  'MHC',
  'Multifamily',
  'RV Park',
];

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  company_name: string;
  role: UserRole;
  created_at: string;
}

export interface Loan {
  id: string;
  borrower_id: string;
  loan_name: string;
  property_address: string;
  loan_amount: number;
  loan_type: LoanType;
  status: LoanStatus;
  status_updated_at: string;
  processor_name: string;
  processor_email: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  borrower?: Profile;
}

export interface DocumentRequirement {
  id: string;
  loan_id: string;
  document_name: string;
  description: string;
  status: DocRequirementStatus;
  revision_note: string | null;
  required: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  documents?: Document[];
}

export interface Document {
  id: string;
  requirement_id: string;
  loan_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  loan_id: string;
  actor_id: string;
  action: string;
  details: string;
  created_at: string;
  // Joined fields
  actor?: Profile;
}
