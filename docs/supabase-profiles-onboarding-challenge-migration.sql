-- Optional: add onboarding_challenge to store user's biggest challenge from onboarding.
-- Run after docs/supabase-profiles-schema.sql.
alter table public.profiles add column if not exists onboarding_challenge text;
