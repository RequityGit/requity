-- ============================================================
-- DEAL EMAIL SYSTEM
-- Tables: deal_emails, contact_email_links
-- ============================================================

-- Core email records with tri-record pattern (deal/contact/company)
CREATE TABLE IF NOT EXISTS deal_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships (the tri-record pattern)
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

    -- Sender
    sent_by UUID NOT NULL REFERENCES auth.users(id),
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,

    -- Recipients (JSONB arrays of {email, name, contact_id?})
    to_emails JSONB NOT NULL DEFAULT '[]',
    cc_emails JSONB DEFAULT '[]',
    bcc_emails JSONB DEFAULT '[]',

    -- Content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Threading
    thread_id UUID DEFAULT gen_random_uuid(),
    in_reply_to UUID REFERENCES deal_emails(id) ON DELETE SET NULL,

    -- Delivery (Postmark / Gmail integration)
    postmark_message_id TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (delivery_status IN ('draft', 'queued', 'sent', 'delivered', 'bounced', 'failed')),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    open_count INT DEFAULT 0,

    -- Attachments (stored in Supabase Storage)
    attachments JSONB DEFAULT '[]',

    -- Direction
    direction TEXT NOT NULL DEFAULT 'outbound'
        CHECK (direction IN ('outbound', 'inbound')),

    -- Template
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table: links emails to ALL relevant contacts (to, cc, bcc)
CREATE TABLE IF NOT EXISTS contact_email_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES deal_emails(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'to' CHECK (role IN ('to', 'cc', 'bcc', 'from')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(email_id, contact_id, role)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_emails_loan ON deal_emails(loan_id);
CREATE INDEX IF NOT EXISTS idx_deal_emails_contact ON deal_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_emails_company ON deal_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_emails_thread ON deal_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_deal_emails_sent_by ON deal_emails(sent_by);
CREATE INDEX IF NOT EXISTS idx_deal_emails_status ON deal_emails(delivery_status);
CREATE INDEX IF NOT EXISTS idx_deal_emails_created ON deal_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_email_links_contact ON contact_email_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_email_links_email ON contact_email_links(email_id);

-- RLS Policies
ALTER TABLE deal_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_email_links ENABLE ROW LEVEL SECURITY;

-- Admins can view all deal emails
CREATE POLICY "Admins can view deal emails"
    ON deal_emails FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can insert deal emails
CREATE POLICY "Admins can insert deal emails"
    ON deal_emails FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Admins can update deal emails (for delivery status updates)
CREATE POLICY "Admins can update deal emails"
    ON deal_emails FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admins can view contact email links
CREATE POLICY "Admins can view contact email links"
    ON contact_email_links FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can insert contact email links
CREATE POLICY "Admins can insert contact email links"
    ON contact_email_links FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Borrowers can view emails on their own loans
CREATE POLICY "Borrowers can view own deal emails"
    ON deal_emails FOR SELECT
    TO authenticated
    USING (
        loan_id IN (
            SELECT l.id FROM loans l
            WHERE l.borrower_id IN (SELECT my_borrower_ids())
        )
        AND direction = 'outbound'
        AND delivery_status != 'draft'
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_deal_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_emails_updated_at
    BEFORE UPDATE ON deal_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_emails_updated_at();
