-- Secure upload links: token-based file upload for borrowers (no auth required)
CREATE TABLE secure_upload_links (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                  uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  deal_id                uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  created_by             uuid NOT NULL REFERENCES auth.users(id),
  mode                   text NOT NULL DEFAULT 'general' CHECK (mode IN ('general', 'checklist')),
  label                  text,
  instructions           text,
  expires_at             timestamptz NOT NULL,
  max_uploads            int,
  upload_count           int NOT NULL DEFAULT 0,
  status                 text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  include_general_upload boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  revoked_at             timestamptz
);

CREATE INDEX idx_secure_upload_links_token ON secure_upload_links(token);
CREATE INDEX idx_secure_upload_links_deal ON secure_upload_links(deal_id);

-- Junction table: which conditions are included in a checklist-mode link
CREATE TABLE secure_upload_link_conditions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_link_id  uuid NOT NULL REFERENCES secure_upload_links(id) ON DELETE CASCADE,
  condition_id    uuid NOT NULL REFERENCES unified_deal_conditions(id) ON DELETE CASCADE,
  sort_order      int NOT NULL DEFAULT 0,
  UNIQUE(upload_link_id, condition_id)
);

-- RLS
ALTER TABLE secure_upload_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_upload_link_conditions ENABLE ROW LEVEL SECURITY;

-- Admin/super_admin full access on secure_upload_links
CREATE POLICY "admin_select_secure_upload_links" ON secure_upload_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_insert_secure_upload_links" ON secure_upload_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_update_secure_upload_links" ON secure_upload_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin full access on secure_upload_link_conditions
CREATE POLICY "admin_select_secure_upload_link_conditions" ON secure_upload_link_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_insert_secure_upload_link_conditions" ON secure_upload_link_conditions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_delete_secure_upload_link_conditions" ON secure_upload_link_conditions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
