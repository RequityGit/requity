-- Migration 001: Create all CRM enum types
-- Creates enum types needed for the CRM architecture refactor.
-- Uses DO blocks with IF NOT EXISTS pattern for idempotency.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_stage_enum') THEN
    CREATE TYPE lifecycle_stage_enum AS ENUM ('lead', 'prospect', 'active', 'past');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type_enum') THEN
    CREATE TYPE company_type_enum AS ENUM ('brokerage', 'lender', 'title_company', 'law_firm', 'insurance', 'appraisal', 'other');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_type_enum') THEN
    CREATE TYPE relationship_type_enum AS ENUM ('borrower', 'investor', 'broker', 'lender', 'vendor', 'referral_partner');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lender_direction_enum') THEN
    CREATE TYPE lender_direction_enum AS ENUM ('broker_to', 'note_buyer', 'capital_partner', 'co_lender', 'referral_from');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_type_enum') THEN
    CREATE TYPE vendor_type_enum AS ENUM ('title_company', 'law_firm', 'insurance', 'appraisal', 'engineer', 'inspector', 'other');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_direction_enum') THEN
    CREATE TYPE activity_direction_enum AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'linked_entity_type_enum') THEN
    CREATE TYPE linked_entity_type_enum AS ENUM ('loan', 'borrower', 'investor', 'fund');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type_enum') THEN
    CREATE TYPE campaign_type_enum AS ENUM ('investor_update', 'lead_nurture', 'borrower_reengagement', 'broker_reengagement');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
    CREATE TYPE campaign_status_enum AS ENUM ('draft', 'active', 'paused', 'completed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'send_status_enum') THEN
    CREATE TYPE send_status_enum AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_direction_enum') THEN
    CREATE TYPE call_direction_enum AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status_enum') THEN
    CREATE TYPE call_status_enum AS ENUM ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'voicemail');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum') THEN
    CREATE TYPE audit_action_enum AS ENUM ('insert', 'update', 'delete');
  END IF;
END $$;
