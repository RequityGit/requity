-- Remove the comment_type column from ops_task_comments, ops_project_comments, and approval_comments.
-- The comment_type UI feature (Update/Blocker/Question/Decision/Handoff) is being removed.
-- NOTE: comment_mentions.comment_type is a different thing (polymorphic discriminator) and is NOT touched.

ALTER TABLE public.ops_task_comments DROP COLUMN IF EXISTS comment_type;
ALTER TABLE public.ops_project_comments DROP COLUMN IF EXISTS comment_type;
ALTER TABLE public.approval_comments DROP COLUMN IF EXISTS comment_type;
