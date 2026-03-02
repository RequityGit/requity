-- ============================================================
-- Migration: per_line_item_draw_approval_schema
-- Adds per-line-item approval columns to draw_request_line_items,
-- creates draw_line_item_approval_status enum, and adds
-- 'partially_approved' to draw_request_status enum.
-- ============================================================

-- 1. Create draw_line_item_approval_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draw_line_item_approval_status') THEN
    CREATE TYPE draw_line_item_approval_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'blocked_change_order_required'
    );
  END IF;
END $$;

-- 2. Add 'partially_approved' to draw_request_status enum
ALTER TYPE draw_request_status ADD VALUE IF NOT EXISTS 'partially_approved';

-- 3. Alter draw_request_line_items - add snapshot and approval columns
ALTER TABLE draw_request_line_items
  ADD COLUMN IF NOT EXISTS line_item_revised_amount numeric(15,2),
  ADD COLUMN IF NOT EXISTS line_item_remaining_amount numeric(15,2),
  ADD COLUMN IF NOT EXISTS requires_change_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS change_order_id uuid;

-- Add approval_status separately (uses custom type, needs idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'draw_request_line_items'
      AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE draw_request_line_items
      ADD COLUMN approval_status draw_line_item_approval_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- 4. Add FK constraint for change_order_id → budget_change_requests (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_draw_line_item_change_order'
      AND table_name = 'draw_request_line_items'
  ) THEN
    ALTER TABLE draw_request_line_items
      ADD CONSTRAINT fk_draw_line_item_change_order
      FOREIGN KEY (change_order_id) REFERENCES budget_change_requests(id);
  END IF;
END $$;
