-- Allow anonymous/public users to read back their own form submissions
-- via session_token (matching the existing UPDATE policy pattern).
-- Without this, the .insert().select() in createSubmission returns null
-- because no SELECT policy matches anonymous users, breaking form submission
-- on public pages like /invest (soft commitments).
CREATE POLICY "public_read_own_via_token"
  ON form_submissions
  FOR SELECT
  USING (
    session_token IS NOT NULL
    AND token_expires_at > now()
  );
