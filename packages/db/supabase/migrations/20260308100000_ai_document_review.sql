-- AI Document Review: tables, RLS, RPC, realtime
-- Adds AI-powered document classification and data extraction with human-in-the-loop approval

-- ─── 1. Add columns to unified_deal_documents ───

ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT NULL
    CHECK (review_status IS NULL OR review_status IN ('pending','processing','ready','applied','partially_applied','rejected','error')),
  ADD COLUMN IF NOT EXISTS storage_path text;

-- ─── 2. Create document_reviews table ───

CREATE TABLE IF NOT EXISTS document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES unified_deal_documents(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'appraisal', 'bank_statement', 'pnl_tax_return', 'rent_roll',
      'title_report', 'insurance_policy', 'entity_document', 'other'
    )),
  document_type_confidence numeric(4,2) DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'applied', 'partially_applied', 'rejected', 'error')),
  raw_extraction jsonb DEFAULT '{}',
  summary text,
  notes_draft text,
  flags text[] DEFAULT '{}',
  model_used text,
  tokens_used integer,
  processing_time_ms integer,
  error_message text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_reviews_deal_id ON document_reviews(deal_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_status ON document_reviews(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_reviews_document_unique ON document_reviews(document_id);

CREATE TRIGGER set_document_reviews_updated_at
  BEFORE UPDATE ON document_reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── 3. Create document_review_items table ───

CREATE TABLE IF NOT EXISTS document_review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES document_reviews(id) ON DELETE CASCADE,
  field_label text NOT NULL,
  target_table text NOT NULL,
  target_column text NOT NULL,
  target_json_path text,
  target_record_id uuid,
  current_value text,
  proposed_value text NOT NULL,
  confidence numeric(4,2) NOT NULL DEFAULT 0.00,
  extraction_source text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_items_review_id ON document_review_items(review_id);
CREATE INDEX IF NOT EXISTS idx_review_items_status ON document_review_items(status);

-- ─── 4. RLS Policies ───

ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review_items ENABLE ROW LEVEL SECURITY;

-- document_reviews policies
CREATE POLICY "team_select_document_reviews" ON document_reviews
  FOR SELECT USING (is_admin() OR is_super_admin());
CREATE POLICY "team_insert_document_reviews" ON document_reviews
  FOR INSERT WITH CHECK (is_admin() OR is_super_admin());
CREATE POLICY "team_update_document_reviews" ON document_reviews
  FOR UPDATE USING (is_admin() OR is_super_admin());
CREATE POLICY "team_delete_document_reviews" ON document_reviews
  FOR DELETE USING (is_super_admin());

-- document_review_items policies
CREATE POLICY "team_select_document_review_items" ON document_review_items
  FOR SELECT USING (is_admin() OR is_super_admin());
CREATE POLICY "team_insert_document_review_items" ON document_review_items
  FOR INSERT WITH CHECK (is_admin() OR is_super_admin());
CREATE POLICY "team_update_document_review_items" ON document_review_items
  FOR UPDATE USING (is_admin() OR is_super_admin());
CREATE POLICY "team_delete_document_review_items" ON document_review_items
  FOR DELETE USING (is_super_admin());

-- ─── 5. RPC: apply_document_review ───

CREATE OR REPLACE FUNCTION apply_document_review(
  p_review_id uuid,
  p_approved_items uuid[] DEFAULT '{}',
  p_rejected_items uuid[] DEFAULT '{}',
  p_note_text text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_item record;
  v_review record;
  v_applied_count int := 0;
  v_rejected_count int := 0;
  v_deal_id uuid;
  v_document_id uuid;
  v_all_items_count int;
  v_resolved_count int;
  v_final_status text;
  v_current_data jsonb;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can apply document reviews';
  END IF;

  -- Get review and validate
  SELECT * INTO v_review FROM document_reviews WHERE id = p_review_id;
  IF v_review IS NULL THEN
    RAISE EXCEPTION 'Review not found: %', p_review_id;
  END IF;
  IF v_review.status NOT IN ('ready', 'partially_applied') THEN
    RAISE EXCEPTION 'Review is not in a reviewable state. Current status: %', v_review.status;
  END IF;

  v_deal_id := v_review.deal_id;
  v_document_id := v_review.document_id;

  -- Process approved items: update unified_deals jsonb columns
  FOR v_item IN
    SELECT * FROM document_review_items
    WHERE review_id = p_review_id AND id = ANY(p_approved_items) AND status = 'pending'
  LOOP
    -- Only allow updates to unified_deals via jsonb_set
    IF v_item.target_table = 'unified_deals' AND v_item.target_json_path IS NOT NULL THEN
      -- Read current jsonb value
      EXECUTE format('SELECT %I FROM unified_deals WHERE id = $1', v_item.target_column)
        INTO v_current_data USING v_deal_id;

      v_current_data := COALESCE(v_current_data, '{}'::jsonb);

      -- Set the value at the json path
      v_current_data := jsonb_set(
        v_current_data,
        ARRAY[v_item.target_json_path],
        to_jsonb(v_item.proposed_value)
      );

      -- Write back
      EXECUTE format('UPDATE unified_deals SET %I = $1 WHERE id = $2', v_item.target_column)
        USING v_current_data, v_deal_id;
    END IF;

    -- Mark item as approved
    UPDATE document_review_items
    SET status = 'approved',
        approved_by = (SELECT auth.uid()),
        approved_at = now()
    WHERE id = v_item.id;

    v_applied_count := v_applied_count + 1;
  END LOOP;

  -- Process rejected items
  UPDATE document_review_items
  SET status = 'rejected',
      approved_by = (SELECT auth.uid()),
      approved_at = now()
  WHERE review_id = p_review_id AND id = ANY(p_rejected_items) AND status = 'pending';

  GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

  -- Determine final review status
  SELECT count(*) INTO v_all_items_count FROM document_review_items WHERE review_id = p_review_id;
  SELECT count(*) INTO v_resolved_count FROM document_review_items
    WHERE review_id = p_review_id AND status IN ('approved', 'rejected', 'skipped');

  IF v_resolved_count >= v_all_items_count THEN
    IF v_applied_count > 0 AND v_rejected_count > 0 THEN
      v_final_status := 'partially_applied';
    ELSIF v_applied_count > 0 THEN
      v_final_status := 'applied';
    ELSE
      v_final_status := 'rejected';
    END IF;
  ELSE
    v_final_status := 'partially_applied';
  END IF;

  -- Update review record
  UPDATE document_reviews
  SET status = v_final_status,
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = now()
  WHERE id = p_review_id;

  -- Update document review_status
  UPDATE unified_deal_documents
  SET review_status = v_final_status
  WHERE id = v_document_id;

  -- Create deal activity if note text provided
  IF p_note_text IS NOT NULL AND p_note_text != '' THEN
    INSERT INTO unified_deal_activity (deal_id, activity_type, title, description, created_by)
    VALUES (v_deal_id, 'ai_review', 'AI Document Review', p_note_text, (SELECT auth.uid()));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'applied_count', v_applied_count,
    'rejected_count', v_rejected_count,
    'final_status', v_final_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. Enable Realtime ───

ALTER PUBLICATION supabase_realtime ADD TABLE document_reviews;
