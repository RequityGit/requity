-- Performance indexes for common CRM, pipeline, and field-manager queries

CREATE INDEX IF NOT EXISTS idx_unified_deals_status_created
ON unified_deals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_created
ON crm_activities(contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_activities_company_created
ON crm_activities(company_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_field_configs_module
ON field_configurations(module);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_search
ON crm_contacts(first_name, last_name, email) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deal_docs_deal_created
ON unified_deal_documents(deal_id, created_at DESC);
