/**
 * Hand-curated TypeScript types for the Requity CRM layer.
 *
 * These types correspond to the schema created by the CRM migration series
 * (20260302000001 – 20260302000013). Import these in frontend code instead
 * of reaching into the raw Supabase `Database` type.
 */

// ---------------------------------------------------------------------------
// Enums (mapped from PostgreSQL enum types)
// ---------------------------------------------------------------------------

export type LifecycleStage = 'lead' | 'prospect' | 'active' | 'past';

export type CompanyType =
  | 'brokerage'
  | 'lender'
  | 'title_company'
  | 'law_firm'
  | 'insurance'
  | 'appraisal'
  | 'other';

export type RelationshipType =
  | 'borrower'
  | 'investor'
  | 'broker'
  | 'lender'
  | 'vendor'
  | 'referral_partner';

export type LenderDirection =
  | 'broker_to'
  | 'note_buyer'
  | 'capital_partner'
  | 'co_lender'
  | 'referral_from';

export type VendorType =
  | 'title_company'
  | 'law_firm'
  | 'insurance'
  | 'appraisal'
  | 'engineer'
  | 'inspector'
  | 'other';

export type ActivityDirection = 'inbound' | 'outbound';

export type LinkedEntityType = 'loan' | 'borrower' | 'investor' | 'fund';

export type CampaignType =
  | 'investor_update'
  | 'lead_nurture'
  | 'borrower_reengagement'
  | 'broker_reengagement';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export type SendStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';

export type CallDirection = 'inbound' | 'outbound';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy'
  | 'voicemail';

export type AuditAction = 'insert' | 'update' | 'delete';

// ---------------------------------------------------------------------------
// AudienceRules — JSONB shape for marketing_campaigns.audience_rules
// ---------------------------------------------------------------------------

export type FilterOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'gt' | 'lt';

export interface AudienceFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[];
}

export interface AudienceRules {
  filters: AudienceFilter[];
  logic: 'AND' | 'OR';
}

// ---------------------------------------------------------------------------
// Table Row types (full rows as returned by SELECT)
// ---------------------------------------------------------------------------

export interface Company {
  id: string;
  name: string;
  company_type: CompanyType;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  fee_agreement_on_file: boolean;
  is_active: boolean;
  primary_contact_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRelationshipType {
  id: string;
  contact_id: string;
  relationship_type: RelationshipType;
  lender_direction: LenderDirection | null;
  vendor_type: VendorType | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ContactTag {
  id: string;
  contact_id: string;
  tag: string;
  created_at: string;
  created_by: string | null;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  audience_rules: AudienceRules | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignSend {
  id: string;
  campaign_id: string;
  contact_id: string;
  sent_at: string | null;
  postmark_message_id: string | null;
  status: SendStatus;
  opened_at: string | null;
  clicked_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface DialerCall {
  id: string;
  contact_id: string;
  loan_id: string | null;
  twilio_call_sid: string | null;
  direction: CallDirection;
  status: CallStatus;
  duration_seconds: number | null;
  recording_url: string | null;
  notes: string | null;
  performed_by: string | null;
  called_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface ContactAuditLog {
  id: string;
  contact_id: string;
  action: AuditAction;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
  context: string | null;
}

// ---------------------------------------------------------------------------
// Extended field types for modified tables (NEW columns only)
// ---------------------------------------------------------------------------

/** New CRM columns added to the existing crm_contacts table. */
export interface CrmContactCrmFields {
  lifecycle_stage: LifecycleStage | null;
  lifecycle_updated_at: string | null;
  marketing_consent: boolean;
  consent_granted_at: string | null;
  dnc: boolean;
  dnc_reason: string | null;
  company_id: string | null;
  postmark_contact_id: string | null;
  twilio_contact_id: string | null;
}

/** New columns added to the existing crm_activities table. */
export interface CrmActivityExtendedFields {
  scheduled_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  direction: ActivityDirection | null;
  linked_entity_type: LinkedEntityType | null;
  linked_entity_id: string | null;
}

/** New broker-sourcing columns added to the loans table. */
export interface LoanBrokerFields {
  broker_sourced: boolean;
  broker_contact_id: string | null;
}

// ---------------------------------------------------------------------------
// Insert types (for create operations)
// Fields with DB defaults (id, created_at, updated_at, and other defaulted
// columns) are optional.
// ---------------------------------------------------------------------------

export interface CompanyInsert {
  id?: string;
  name: string;
  company_type: CompanyType;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  fee_agreement_on_file?: boolean;
  is_active?: boolean;
  primary_contact_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContactRelationshipTypeInsert {
  id?: string;
  contact_id: string;
  relationship_type: RelationshipType;
  lender_direction?: LenderDirection | null;
  vendor_type?: VendorType | null;
  is_active?: boolean;
  started_at?: string;
  ended_at?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface ContactTagInsert {
  id?: string;
  contact_id: string;
  tag: string;
  created_at?: string;
  created_by?: string | null;
}

export interface MarketingCampaignInsert {
  id?: string;
  name: string;
  campaign_type: CampaignType;
  status?: CampaignStatus;
  audience_rules?: AudienceRules | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignSendInsert {
  id?: string;
  campaign_id: string;
  contact_id: string;
  sent_at?: string | null;
  postmark_message_id?: string | null;
  status?: SendStatus;
  opened_at?: string | null;
  clicked_at?: string | null;
  unsubscribed_at?: string | null;
  created_at?: string;
}

export interface DialerCallInsert {
  id?: string;
  contact_id: string;
  loan_id?: string | null;
  twilio_call_sid?: string | null;
  direction: CallDirection;
  status?: CallStatus;
  duration_seconds?: number | null;
  recording_url?: string | null;
  notes?: string | null;
  performed_by?: string | null;
  called_at?: string;
  ended_at?: string | null;
  created_at?: string;
}

export interface ContactAuditLogInsert {
  id?: string;
  contact_id: string;
  action: AuditAction;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: string | null;
  changed_at?: string;
  context?: string | null;
}

// ---------------------------------------------------------------------------
// Update types (all fields optional for PATCH operations)
// ---------------------------------------------------------------------------

export type CompanyUpdate = Partial<CompanyInsert>;
export type ContactRelationshipTypeUpdate = Partial<ContactRelationshipTypeInsert>;
export type ContactTagUpdate = Partial<ContactTagInsert>;
export type MarketingCampaignUpdate = Partial<MarketingCampaignInsert>;
export type CampaignSendUpdate = Partial<CampaignSendInsert>;
export type DialerCallUpdate = Partial<DialerCallInsert>;
export type ContactAuditLogUpdate = Partial<ContactAuditLogInsert>;
