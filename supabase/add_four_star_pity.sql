-- Persist the independent 4-star pity counter.
-- Run this migration in the Supabase SQL editor before deploying the frontend change.

alter table public.gacha_progress
  add column if not exists four_star_pity integer not null default 0;

alter table public.gacha_progress
  drop constraint if exists gacha_progress_four_star_pity_range;

alter table public.gacha_progress
  add constraint gacha_progress_four_star_pity_range
  check (four_star_pity between 0 and 10);
