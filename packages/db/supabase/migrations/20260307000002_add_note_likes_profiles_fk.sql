-- Add direct FK from note_likes.user_id to profiles.id
-- so PostgREST can resolve the profiles embed in the select query
ALTER TABLE note_likes
  ADD CONSTRAINT note_likes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
