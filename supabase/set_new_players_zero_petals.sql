-- New players start with zero petals.
-- Existing player balances are intentionally left unchanged.

alter table public.player_resources
  alter column crystals set default 0;

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
