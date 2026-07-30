-- Give new users the default "Learn 50 cards" reward with multiplier x1.
-- Also backfill users who do not have this reward row yet.
-- Existing explicit values, including 0, are preserved.

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

insert into public.player_achievement_multipliers (
  player_id,
  achievement_id,
  multiplier
)
select
  players.id,
  'new_50_cards',
  1
from public.players
where not exists (
  select 1
  from public.player_achievement_multipliers multipliers
  where multipliers.player_id = players.id
    and multipliers.achievement_id = 'new_50_cards'
);
