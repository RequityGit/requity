-- ============================================================
-- Migration: per_line_item_draw_approval_functions
-- Replaces submit_draw_request and approve_draw_request with
-- per-line-item approval logic. Adds link_change_order_to_draw_line_item.
-- ============================================================

-- 1. Drop old submit_draw_request (return type changes from uuid → jsonb)
DROP FUNCTION IF EXISTS submit_draw_request(uuid, jsonb, text, uuid);

-- 2. New submit_draw_request
CREATE FUNCTION submit_draw_request(
  p_loan_id uuid,
  p_line_item_draws jsonb,
  p_borrower_notes text,
  p_requested_by uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_budget_id uuid;
  v_budget_remaining numeric(15,2);
  v_total_requested numeric(15,2) := 0;
  v_draw_number int;
  v_loan_number text;
  v_draw_id uuid;
  v_item jsonb;
  v_line_remaining numeric(15,2);
  v_line_revised numeric(15,2);
  v_line_item_amount numeric(15,2);
  v_borrower_id uuid;
  v_budget_line_item_id uuid;
  v_category text;
  v_requires_co boolean;
  v_line_approval_status draw_line_item_approval_status;
  v_change_orders_required jsonb := '[]'::jsonb;
BEGIN
  -- 1. Validate loan is active and has a construction budget
  SELECT cb.id, cb.total_remaining, l.loan_number, l.borrower_id
  INTO v_budget_id, v_budget_remaining, v_loan_number, v_borrower_id
  FROM loans l
  JOIN construction_budgets cb ON cb.loan_id = l.id
  WHERE l.id = p_loan_id
    AND l.deleted_at IS NULL
    AND cb.status = 'active'::budget_status;

  IF v_budget_id IS NULL THEN
    RAISE EXCEPTION 'No active construction budget found for loan %', p_loan_id;
  END IF;

  -- 2. First pass: validate each line item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_item_draws)
  LOOP
    v_budget_line_item_id := (v_item->>'budget_line_item_id')::uuid;
    v_line_item_amount := (v_item->>'requested_amount')::numeric;
    v_total_requested := v_total_requested + v_line_item_amount;

    SELECT revised_amount, remaining_amount, category
    INTO v_line_revised, v_line_remaining, v_category
    FROM budget_line_items
    WHERE id = v_budget_line_item_id
      AND construction_budget_id = v_budget_id
      AND is_active = true;

    IF v_line_revised IS NULL THEN
      RAISE EXCEPTION 'Budget line item % not found or inactive', v_budget_line_item_id;
    END IF;

    -- Priority 1: requested > revised_amount → change order required (allowed to submit)
    IF v_line_item_amount > v_line_revised THEN
      v_change_orders_required := v_change_orders_required || jsonb_build_object(
        'budget_line_item_id', v_budget_line_item_id,
        'category', v_category,
        'requested_amount', v_line_item_amount,
        'revised_amount', v_line_revised,
        'overage', v_line_item_amount - v_line_revised
      );
    -- Priority 2: requested > remaining_amount (but <= revised) → reject entire submission
    ELSIF v_line_item_amount > v_line_remaining THEN
      RAISE EXCEPTION 'Requested amount ($%) exceeds remaining ($%) for line item % (%). Cannot draw more than what remains.',
        v_line_item_amount, v_line_remaining, v_budget_line_item_id, v_category;
    END IF;
  END LOOP;

  -- 3. Get next draw number
  SELECT COALESCE(MAX(draw_number), 0) + 1 INTO v_draw_number
  FROM draw_requests WHERE loan_id = p_loan_id;

  -- 4. Insert draw_requests row
  INSERT INTO draw_requests (
    loan_id, construction_budget_id, draw_number, request_number,
    amount_requested, status, request_date, requested_by,
    borrower_id, borrower_notes, submitted_at
  ) VALUES (
    p_loan_id, v_budget_id, v_draw_number,
    'DRW-' || COALESCE(v_loan_number, p_loan_id::text) || '-' || v_draw_number,
    v_total_requested, 'submitted'::draw_request_status,
    CURRENT_DATE, p_requested_by,
    v_borrower_id, p_borrower_notes, now()
  )
  RETURNING id INTO v_draw_id;

  -- 5. Insert draw_request_line_items with budget snapshots
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_item_draws)
  LOOP
    v_budget_line_item_id := (v_item->>'budget_line_item_id')::uuid;
    v_line_item_amount := (v_item->>'requested_amount')::numeric;

    SELECT revised_amount, remaining_amount
    INTO v_line_revised, v_line_remaining
    FROM budget_line_items
    WHERE id = v_budget_line_item_id;

    -- Determine per-line-item approval status
    IF v_line_item_amount > v_line_revised THEN
      v_requires_co := true;
      v_line_approval_status := 'blocked_change_order_required';
    ELSE
      v_requires_co := false;
      v_line_approval_status := 'pending';
    END IF;

    INSERT INTO draw_request_line_items (
      draw_request_id, budget_line_item_id, requested_amount, notes,
      line_item_revised_amount, line_item_remaining_amount,
      requires_change_order, approval_status
    ) VALUES (
      v_draw_id,
      v_budget_line_item_id,
      v_line_item_amount,
      v_item->>'notes',
      v_line_revised,
      v_line_remaining,
      v_requires_co,
      v_line_approval_status
    );
  END LOOP;

  -- 6. Return result
  RETURN jsonb_build_object(
    'draw_request_id', v_draw_id,
    'draw_number', v_draw_number,
    'total_requested', v_total_requested,
    'change_orders_required', v_change_orders_required
  );
END;
$$;

-- 3. Drop old approve_draw_request (signature changes)
DROP FUNCTION IF EXISTS approve_draw_request(uuid, numeric, jsonb, uuid, text);

-- 4. New approve_draw_request with per-line-item approval
CREATE FUNCTION approve_draw_request(
  p_draw_request_id uuid,
  p_line_item_approvals jsonb,
  p_reviewer_id uuid,
  p_review_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_draw record;
  v_item jsonb;
  v_li_id uuid;
  v_new_approved numeric(15,2);
  v_li record;
  v_co record;
  v_approved_items jsonb := '[]'::jsonb;
  v_blocked_items jsonb := '[]'::jsonb;
  v_new_status draw_request_status;
  v_total_approved numeric(15,2) := 0;
  v_all_count int;
  v_approved_count int;
  v_rejected_count int;
  v_blocked_count int;
BEGIN
  -- 1. Validate draw request exists and is in an approvable status
  SELECT dr.id, dr.status, dr.amount_requested, dr.loan_id, dr.construction_budget_id
  INTO v_draw
  FROM draw_requests dr
  WHERE dr.id = p_draw_request_id;

  IF v_draw IS NULL THEN
    RAISE EXCEPTION 'Draw request % not found', p_draw_request_id;
  END IF;

  IF v_draw.status NOT IN (
    'submitted'::draw_request_status,
    'under_review'::draw_request_status,
    'partially_approved'::draw_request_status
  ) THEN
    RAISE EXCEPTION 'Draw request status must be submitted, under_review, or partially_approved; got %', v_draw.status;
  END IF;

  -- 2. Process each line item approval
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_item_approvals)
  LOOP
    v_li_id := (v_item->>'draw_request_line_item_id')::uuid;
    v_new_approved := (v_item->>'approved_amount')::numeric;

    -- Fetch line item with current budget data
    SELECT
      dli.id,
      dli.draw_request_id,
      dli.budget_line_item_id,
      dli.requested_amount,
      dli.approved_amount,
      dli.approval_status,
      dli.requires_change_order,
      dli.change_order_id,
      bli.category,
      bli.revised_amount AS current_revised_amount,
      bli.remaining_amount AS current_remaining_amount
    INTO v_li
    FROM draw_request_line_items dli
    JOIN budget_line_items bli ON bli.id = dli.budget_line_item_id
    WHERE dli.id = v_li_id
      AND dli.draw_request_id = p_draw_request_id;

    IF v_li IS NULL THEN
      RAISE EXCEPTION 'Draw request line item % not found in draw request %', v_li_id, p_draw_request_id;
    END IF;

    -- Skip already-approved or already-rejected line items
    IF v_li.approval_status = 'approved'::draw_line_item_approval_status
       OR v_li.approval_status = 'rejected'::draw_line_item_approval_status THEN
      CONTINUE;
    END IF;

    -- Handle blocked line items (requires change order)
    IF v_li.approval_status = 'blocked_change_order_required'::draw_line_item_approval_status THEN

      -- Check if change order is linked
      IF v_li.change_order_id IS NULL THEN
        v_blocked_items := v_blocked_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'requested_amount', v_li.requested_amount,
          'revised_amount', v_li.current_revised_amount,
          'reason', format('Requested amount ($%s) exceeds line item budget ($%s) by $%s. No change order linked.',
            v_li.requested_amount, v_li.current_revised_amount,
            v_li.requested_amount - v_li.current_revised_amount),
          'action_required', format('Submit a budget change request reallocating $%s to %s',
            v_li.requested_amount - v_li.current_revised_amount, v_li.category)
        );
        CONTINUE;
      END IF;

      -- Check change order is approved
      SELECT * INTO v_co FROM budget_change_requests WHERE id = v_li.change_order_id;

      IF v_co IS NULL OR v_co.status != 'approved'::budget_change_request_status THEN
        v_blocked_items := v_blocked_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'requested_amount', v_li.requested_amount,
          'revised_amount', v_li.current_revised_amount,
          'reason', 'Linked change order is not yet approved',
          'action_required', 'Approve the linked budget change request first'
        );
        CONTINUE;
      END IF;

      -- Change order approved — re-check requested vs current revised_amount
      IF v_li.requested_amount > v_li.current_revised_amount THEN
        v_blocked_items := v_blocked_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'requested_amount', v_li.requested_amount,
          'revised_amount', v_li.current_revised_amount,
          'reason', format('Even after change order, requested amount ($%s) still exceeds revised budget ($%s)',
            v_li.requested_amount, v_li.current_revised_amount),
          'action_required', 'Submit an additional budget change request'
        );
        CONTINUE;
      END IF;

      -- Change order cleared — validate approved_amount
      IF v_new_approved > v_li.requested_amount THEN
        RAISE EXCEPTION 'Approved amount ($%) cannot exceed requested amount ($%) for line item %',
          v_new_approved, v_li.requested_amount, v_li.id;
      END IF;

      -- Approve or reject based on amount
      UPDATE draw_request_line_items
      SET approved_amount = v_new_approved,
          approval_status = CASE
            WHEN v_new_approved = 0 THEN 'rejected'::draw_line_item_approval_status
            ELSE 'approved'::draw_line_item_approval_status
          END
      WHERE id = v_li.id;

      IF v_new_approved > 0 THEN
        v_approved_items := v_approved_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'approved_amount', v_new_approved
        );
      END IF;

    -- Handle pending line items
    ELSIF v_li.approval_status = 'pending'::draw_line_item_approval_status THEN

      -- Never approve more than requested
      IF v_new_approved > v_li.requested_amount THEN
        RAISE EXCEPTION 'Approved amount ($%) cannot exceed requested amount ($%) for line item %',
          v_new_approved, v_li.requested_amount, v_li.id;
      END IF;

      -- Check against current revised_amount — if exceeded, block
      IF v_new_approved > v_li.current_revised_amount THEN
        UPDATE draw_request_line_items
        SET requires_change_order = true,
            approval_status = 'blocked_change_order_required'::draw_line_item_approval_status
        WHERE id = v_li.id;

        v_blocked_items := v_blocked_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'requested_amount', v_li.requested_amount,
          'revised_amount', v_li.current_revised_amount,
          'reason', format('Requested amount ($%s) exceeds line item budget ($%s) by $%s',
            v_li.requested_amount, v_li.current_revised_amount,
            v_li.requested_amount - v_li.current_revised_amount),
          'action_required', format('Submit a budget change request reallocating $%s to %s',
            v_li.requested_amount - v_li.current_revised_amount, v_li.category)
        );
        CONTINUE;
      END IF;

      -- Approve or reject based on amount
      UPDATE draw_request_line_items
      SET approved_amount = v_new_approved,
          approval_status = CASE
            WHEN v_new_approved = 0 THEN 'rejected'::draw_line_item_approval_status
            ELSE 'approved'::draw_line_item_approval_status
          END
      WHERE id = v_li.id;

      IF v_new_approved > 0 THEN
        v_approved_items := v_approved_items || jsonb_build_object(
          'draw_request_line_item_id', v_li.id,
          'category', v_li.category,
          'approved_amount', v_new_approved
        );
      END IF;

    END IF;
  END LOOP;

  -- 3. Compute totals across ALL line items for this draw request
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE approval_status = 'approved'::draw_line_item_approval_status),
    COUNT(*) FILTER (WHERE approval_status = 'rejected'::draw_line_item_approval_status),
    COUNT(*) FILTER (WHERE approval_status = 'blocked_change_order_required'::draw_line_item_approval_status),
    COALESCE(SUM(approved_amount) FILTER (WHERE approval_status = 'approved'::draw_line_item_approval_status), 0)
  INTO v_all_count, v_approved_count, v_rejected_count, v_blocked_count, v_total_approved
  FROM draw_request_line_items
  WHERE draw_request_id = p_draw_request_id;

  -- 4. Determine overall draw request status
  IF v_approved_count = v_all_count THEN
    v_new_status := 'approved'::draw_request_status;
  ELSIF v_rejected_count = v_all_count THEN
    v_new_status := 'rejected'::draw_request_status;
  ELSIF v_approved_count > 0 THEN
    v_new_status := 'partially_approved'::draw_request_status;
  ELSE
    v_new_status := v_draw.status;  -- No approved items yet — keep current status
  END IF;

  -- 5. Update draw_requests header
  UPDATE draw_requests
  SET status = v_new_status,
      amount_approved = v_total_approved,
      reviewer_id = p_reviewer_id,
      reviewed_at = now(),
      reviewer_notes = p_review_notes
  WHERE id = p_draw_request_id;

  -- 6. Return detailed result
  RETURN jsonb_build_object(
    'draw_request_id', p_draw_request_id,
    'status', v_new_status::text,
    'approved_amount', v_total_approved,
    'approved_line_items', v_approved_items,
    'blocked_line_items', v_blocked_items
  );
END;
$$;

-- 5. Create link_change_order_to_draw_line_item function
CREATE OR REPLACE FUNCTION link_change_order_to_draw_line_item(
  p_draw_request_line_item_id uuid,
  p_change_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_li record;
  v_co record;
  v_new_status draw_line_item_approval_status;
BEGIN
  -- 1. Validate line item exists and requires a change order
  SELECT dli.id, dli.requires_change_order, dli.approval_status,
         dr.loan_id, dr.construction_budget_id
  INTO v_li
  FROM draw_request_line_items dli
  JOIN draw_requests dr ON dr.id = dli.draw_request_id
  WHERE dli.id = p_draw_request_line_item_id;

  IF v_li IS NULL THEN
    RAISE EXCEPTION 'Draw request line item % not found', p_draw_request_line_item_id;
  END IF;

  IF v_li.requires_change_order IS NOT TRUE THEN
    RAISE EXCEPTION 'Line item % does not require a change order', p_draw_request_line_item_id;
  END IF;

  -- 2. Validate change order exists and belongs to the same construction budget
  SELECT * INTO v_co FROM budget_change_requests WHERE id = p_change_order_id;

  IF v_co IS NULL THEN
    RAISE EXCEPTION 'Budget change request % not found', p_change_order_id;
  END IF;

  IF v_co.construction_budget_id != v_li.construction_budget_id THEN
    RAISE EXCEPTION 'Change order budget (%) does not match draw request budget (%)',
      v_co.construction_budget_id, v_li.construction_budget_id;
  END IF;

  -- 3. Determine new approval_status
  IF v_co.status = 'approved'::budget_change_request_status THEN
    v_new_status := 'pending'::draw_line_item_approval_status;
  ELSE
    v_new_status := 'blocked_change_order_required'::draw_line_item_approval_status;
  END IF;

  -- 4. Update line item
  UPDATE draw_request_line_items
  SET change_order_id = p_change_order_id,
      approval_status = v_new_status
  WHERE id = p_draw_request_line_item_id;

  -- 5. Return result
  RETURN jsonb_build_object(
    'draw_request_line_item_id', p_draw_request_line_item_id,
    'change_order_id', p_change_order_id,
    'change_order_status', v_co.status::text,
    'approval_status', v_new_status::text,
    'message', CASE
      WHEN v_new_status = 'pending'::draw_line_item_approval_status
        THEN 'Change order approved and linked. Line item is now ready for approval.'
      ELSE 'Change order linked but not yet approved. Line item remains blocked.'
    END
  );
END;
$$;
