// Production Supabase public credentials (project: edhlkknvlczhbowasjna)
// These are PUBLIC values — the anon key is designed for browser use.
// Security is enforced by Row Level Security (RLS) on the database.
// Hardcoded as fallbacks so the app works even if env vars are missing from
// the Netlify build (NEXT_PUBLIC_* vars are inlined at build time).

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://edhlkknvlczhbowasjna.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaGxra252bGN6aGJvd2Fzam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjY5NTYsImV4cCI6MjA4NzgwMjk1Nn0.Ob8m3pUUhgQpWvqmz5lTiQziD4IRRU_GxXrZi67B7x8";
