-- Add note_likes table for lightweight note acknowledgements
CREATE TABLE note_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, user_id)
);

ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read likes
CREATE POLICY "Team can view likes"
  ON note_likes FOR SELECT
  USING (true);

-- Users can only insert their own like
CREATE POLICY "Users insert own likes"
  ON note_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can only delete their own like
CREATE POLICY "Users delete own likes"
  ON note_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE INDEX idx_note_likes_note_id ON note_likes(note_id);
