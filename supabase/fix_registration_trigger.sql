-- Fix Supabase Auth error: "Database error saving new user".
-- Run this migration in the Supabase SQL editor.

create or replace function public.handle_new_auth_user_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.players (id, username)
  values (new.id, new.email);

  insert into public.player_resources (player_id, crystals, gold)
  values (new.id, 0, 1235000);

  insert into public.gacha_progress (
    player_id,
    current_pity,
    guaranteed_featured,
    total_wishes
  )
  values (new.id, 63, false, 0);

  insert into public.player_achievement_multipliers (
    player_id,
    achievement_id,
    multiplier
  )
  values (new.id, 'new_50_cards', 1);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_player on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_combined on auth.users;

create trigger on_auth_user_created_combined
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_creation();
