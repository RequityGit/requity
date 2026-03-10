-- ============================================================================
-- Loan Chatter System: Tables, Indexes, Triggers, and RLS
-- ============================================================================

-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Create loan_comments table (loan-level chatter)
CREATE TABLE public.loan_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  comment text NOT NULL,
  mentions uuid[] DEFAULT '{}',
  is_internal boolean NOT NULL DEFAULT true,
  is_edited boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  parent_comment_id uuid REFERENCES public.loan_comments(id) ON DELETE SET NULL
);

CREATE INDEX idx_loan_comments_loan_id ON public.loan_comments(loan_id, created_at DESC);
CREATE INDEX idx_loan_comments_author_id ON public.loan_comments(author_id);
CREATE INDEX idx_loan_comments_parent ON public.loan_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE TRIGGER set_loan_comments_updated_at
  BEFORE UPDATE ON public.loan_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Alter loan_condition_comments: add mentions, editing, and threading
ALTER TABLE public.loan_condition_comments
  ADD COLUMN IF NOT EXISTS mentions uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.loan_condition_comments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_condition_comments_parent
  ON public.loan_condition_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- 3. Create comment_mentions junction table
CREATE TABLE public.comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  comment_type text NOT NULL CHECK (comment_type IN ('loan', 'condition')),
  comment_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  condition_id uuid REFERENCES public.loan_conditions(id) ON DELETE SET NULL,
  notification_sent boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_comment_mentions_user ON public.comment_mentions(mentioned_user_id, created_at DESC);
CREATE INDEX idx_comment_mentions_comment ON public.comment_mentions(comment_type, comment_id);
CREATE INDEX idx_comment_mentions_loan ON public.comment_mentions(loan_id);

-- 4. Add notification types for mentions
INSERT INTO public.notification_types (
  id, slug, display_name, description, category,
  default_email_enabled, default_in_app_enabled,
  applicable_roles, default_priority,
  email_subject_template, email_body_template,
  is_active, sort_order
) VALUES (
  gen_random_uuid(),
  'loan_comment_mention',
  'Mentioned in Loan Comment',
  'You were @mentioned in a comment on a loan',
  'lending',
  true, true,
  ARRAY['admin', 'super_admin', 'borrower'],
  'normal',
  '{{author_name}} mentioned you in a comment on {{loan_number}}',
  'You were mentioned in a comment on loan {{loan_number}}: "{{comment_preview}}"',
  true, 20
), (
  gen_random_uuid(),
  'condition_comment_mention',
  'Mentioned in Condition Comment',
  'You were @mentioned in a comment on a loan condition',
  'lending',
  true, true,
  ARRAY['admin', 'super_admin', 'borrower'],
  'normal',
  '{{author_name}} mentioned you in a condition comment on {{loan_number}}',
  'You were mentioned in a comment on condition "{{condition_name}}" for loan {{loan_number}}: "{{comment_preview}}"',
  true, 21
);

-- 5. RLS Policies for loan_comments
ALTER TABLE public.loan_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage loan comments"
  ON public.loan_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

CREATE POLICY "Borrowers can read external loan comments"
  ON public.loan_comments
  FOR SELECT
  TO authenticated
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.borrowers b ON b.id = l.borrower_id
      WHERE l.id = loan_comments.loan_id
      AND b.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Borrowers can post external loan comments"
  ON public.loan_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_internal = false
    AND author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.borrowers b ON b.id = l.borrower_id
      WHERE l.id = loan_comments.loan_id
      AND b.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can edit own loan comments"
  ON public.loan_comments
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

-- 6. RLS Policies for comment_mentions
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mentions"
  ON public.comment_mentions
  FOR SELECT
  TO authenticated
  USING (mentioned_user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage mentions"
  ON public.comment_mentions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can create mentions"
  ON public.comment_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. DB Trigger: auto-create notifications + comment_mentions on comment insert
CREATE OR REPLACE FUNCTION public.handle_comment_mention_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_uid uuid;
  v_loan_number text;
  v_condition_name text;
  v_comment_type text;
  v_notification_slug text;
  v_title text;
  v_body text;
  v_action_url text;
  v_entity_type text;
  v_entity_id uuid;
  v_entity_label text;
  v_notification_type_id uuid;
BEGIN
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'loan_comments' THEN
    v_comment_type := 'loan';
    v_notification_slug := 'loan_comment_mention';
    v_entity_type := 'loan';
    v_entity_id := NEW.loan_id;
    SELECT loan_number INTO v_loan_number FROM public.loans WHERE id = NEW.loan_id;
    v_entity_label := COALESCE(v_loan_number, 'Loan');
    v_title := COALESCE(NEW.author_name, 'Someone') || ' mentioned you in a comment on ' || COALESCE(v_loan_number, 'a loan');
    v_body := left(NEW.comment, 200);
    v_action_url := '/admin/loans/' || NEW.loan_id::text;
  ELSIF TG_TABLE_NAME = 'loan_condition_comments' THEN
    v_comment_type := 'condition';
    v_notification_slug := 'condition_comment_mention';
    v_entity_type := 'condition';
    v_entity_id := NEW.condition_id;
    SELECT loan_number INTO v_loan_number FROM public.loans WHERE id = NEW.loan_id;
    SELECT condition_name INTO v_condition_name FROM public.loan_conditions WHERE id = NEW.condition_id;
    v_entity_label := COALESCE(v_condition_name, 'Condition');
    v_title := COALESCE(NEW.author_name, 'Someone') || ' mentioned you in a condition comment on ' || COALESCE(v_loan_number, 'a loan');
    v_body := left(NEW.comment, 200);
    v_action_url := '/admin/loans/' || NEW.loan_id::text || '?condition=' || NEW.condition_id::text;
  ELSE
    RETURN NEW;
  END IF;

  SELECT id INTO v_notification_type_id FROM public.notification_types WHERE slug = v_notification_slug LIMIT 1;

  FOREACH mentioned_uid IN ARRAY NEW.mentions
  LOOP
    IF mentioned_uid = NEW.author_id THEN
      CONTINUE;
    END IF;

    INSERT INTO public.notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, is_read, is_archived, email_sent
    ) VALUES (
      gen_random_uuid(), mentioned_uid, v_notification_type_id, v_notification_slug,
      v_title, v_body, 'normal', v_entity_type, v_entity_id, v_entity_label,
      v_action_url, false, false, false
    );

    INSERT INTO public.comment_mentions (
      comment_type, comment_id, mentioned_user_id, loan_id,
      condition_id, notification_sent
    ) VALUES (
      v_comment_type, NEW.id, mentioned_uid, NEW.loan_id,
      CASE WHEN v_comment_type = 'condition' THEN NEW.condition_id ELSE NULL END,
      true
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_loan_comment_mention_notification
  AFTER INSERT ON public.loan_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_mention_notification();

CREATE TRIGGER trg_condition_comment_mention_notification
  AFTER INSERT ON public.loan_condition_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_mention_notification();

-- 8. Enable realtime for comment tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_condition_comments;
