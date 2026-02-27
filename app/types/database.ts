// ============================================================================
// Requity Group Investor Portal Types
// ============================================================================

export type UserRole = 'investor' | 'admin';

export type InvestorStatus = 'active' | 'inactive' | 'pending';

export type EntityType =
  | 'individual'
  | 'llc'
  | 'trust'
  | 'ira'
  | 'corporation'
  | 'partnership';

export type InvestmentType = 'fund' | 'loan' | 'property';

export type BusinessLine = 'lending' | 'homes';

export type InvestmentStatus = 'active' | 'closed' | 'pending';

export type DocumentType =
  | 'k1'
  | 'capital_statement'
  | 'distribution_notice'
  | 'subscription_agreement'
  | 'quarterly_report'
  | 'annual_report'
  | 'tax_document'
  | 'correspondence'
  | 'other';

export type AdminRole = 'super_admin' | 'admin' | 'viewer';

export type EntityRole = 'owner' | 'authorized_signer' | 'viewer';

export type EntityInvestmentStatus = 'active' | 'redeemed' | 'pending';

// ============================================================================
// Interfaces
// ============================================================================

export interface Investor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  status: InvestorStatus;
  created_at: string;
  updated_at: string;
}

export interface Entity {
  id: string;
  name: string;
  entity_type: EntityType;
  tax_id_last_four: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestorEntity {
  id: string;
  investor_id: string;
  entity_id: string;
  role: EntityRole;
  // Joined fields
  entity?: Entity;
  investor?: Investor;
}

export interface Investment {
  id: string;
  name: string;
  investment_type: InvestmentType;
  business_line: BusinessLine;
  status: InvestmentStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityInvestment {
  id: string;
  entity_id: string;
  investment_id: string;
  committed_capital: number | null;
  funded_capital: number | null;
  ownership_percentage: number | null;
  investment_date: string | null;
  status: EntityInvestmentStatus;
  // Joined fields
  entity?: Entity;
  investment?: Investment;
}

export interface Document {
  id: string;
  name: string;
  document_type: DocumentType;
  storage_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  entity_id: string | null;
  investment_id: string | null;
  period_start: string | null;
  period_end: string | null;
  year: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  entity?: Entity;
  investment?: Investment;
}

export interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

// ============================================================================
// Display helpers
// ============================================================================

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  individual: 'Individual',
  llc: 'LLC',
  trust: 'Trust',
  ira: 'IRA',
  corporation: 'Corporation',
  partnership: 'Partnership',
};

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  fund: 'Fund',
  loan: 'Loan',
  property: 'Property',
};

export const BUSINESS_LINE_LABELS: Record<BusinessLine, string> = {
  lending: 'Requity Lending',
  homes: 'Requity Investments',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  k1: 'K-1',
  capital_statement: 'Capital Statement',
  distribution_notice: 'Distribution Notice',
  subscription_agreement: 'Subscription Agreement',
  quarterly_report: 'Quarterly Report',
  annual_report: 'Annual Report',
  tax_document: 'Tax Document',
  correspondence: 'Correspondence',
  other: 'Other',
};
