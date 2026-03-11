-- Train deal doc prompts: add loan_document type, update RPC for direct column support, auto deal note

-- ─── 1. Update document_type check constraint to include loan_document ───

ALTER TABLE document_reviews
  DROP CONSTRAINT IF EXISTS document_reviews_document_type_check;

ALTER TABLE document_reviews
  ADD CONSTRAINT document_reviews_document_type_check
  CHECK (document_type IN (
    'appraisal', 'bank_statement', 'pnl_tax_return', 'rent_roll',
    'title_report', 'insurance_policy', 'entity_document', 'loan_document', 'other'
  ));

-- ─── 2. Update apply_document_review RPC to handle direct column updates ───

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

  -- Process approved items: update unified_deals
  FOR v_item IN
    SELECT * FROM document_review_items
    WHERE review_id = p_review_id AND id = ANY(p_approved_items) AND status = 'pending'
  LOOP
    IF v_item.target_table = 'unified_deals' THEN
      IF v_item.target_json_path IS NOT NULL AND v_item.target_json_path != '' THEN
        -- jsonb column update via jsonb_set
        EXECUTE format('SELECT %I FROM unified_deals WHERE id = $1', v_item.target_column)
          INTO v_current_data USING v_deal_id;

        v_current_data := COALESCE(v_current_data, '{}'::jsonb);

        v_current_data := jsonb_set(
          v_current_data,
          ARRAY[v_item.target_json_path],
          to_jsonb(v_item.proposed_value)
        );

        EXECUTE format('UPDATE unified_deals SET %I = $1 WHERE id = $2', v_item.target_column)
          USING v_current_data, v_deal_id;
      ELSE
        -- Direct column update (e.g., amount, name)
        EXECUTE format('UPDATE unified_deals SET %I = $1 WHERE id = $2', v_item.target_column)
          USING v_item.proposed_value, v_deal_id;
      END IF;
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
