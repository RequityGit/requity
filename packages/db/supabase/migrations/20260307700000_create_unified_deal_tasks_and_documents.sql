-- Create unified_deal_tasks table
CREATE TABLE IF NOT EXISTS unified_deal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create unified_deal_documents table
CREATE TABLE IF NOT EXISTS unified_deal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  category text DEFAULT 'general',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_unified_deal_tasks_deal_id ON unified_deal_tasks(deal_id);
CREATE INDEX idx_unified_deal_tasks_status ON unified_deal_tasks(status);
CREATE INDEX idx_unified_deal_documents_deal_id ON unified_deal_documents(deal_id);

-- RLS
ALTER TABLE unified_deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_deal_documents ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "team_select_unified_deal_tasks" ON unified_deal_tasks
  FOR SELECT USING (is_admin() OR is_super_admin());
CREATE POLICY "team_insert_unified_deal_tasks" ON unified_deal_tasks
  FOR INSERT WITH CHECK (is_admin() OR is_super_admin());
CREATE POLICY "team_update_unified_deal_tasks" ON unified_deal_tasks
  FOR UPDATE USING (is_admin() OR is_super_admin());
CREATE POLICY "team_delete_unified_deal_tasks" ON unified_deal_tasks
  FOR DELETE USING (is_admin() OR is_super_admin());

-- Documents RLS policies
CREATE POLICY "team_select_unified_deal_documents" ON unified_deal_documents
  FOR SELECT USING (is_admin() OR is_super_admin());
CREATE POLICY "team_insert_unified_deal_documents" ON unified_deal_documents
  FOR INSERT WITH CHECK (is_admin() OR is_super_admin());
CREATE POLICY "team_update_unified_deal_documents" ON unified_deal_documents
  FOR UPDATE USING (is_admin() OR is_super_admin());
CREATE POLICY "team_delete_unified_deal_documents" ON unified_deal_documents
  FOR DELETE USING (is_admin() OR is_super_admin());

-- Updated_at trigger for tasks
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON unified_deal_tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
