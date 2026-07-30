-- Admin values are reward multipliers. Claim history is not stored or used.
-- Run this migration in the Supabase SQL editor.

create or replace function public.claim_achievement(p_achievement_id text)
returns table (claim_count integer, crystals integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid := auth.uid();
  v_reward integer;
  v_multiplier integer;
  v_crystals integer;
begin
  if v_player_id is null then
    raise exception 'Authentication required';
  end if;

  v_reward := case p_achievement_id
    when 'training_together' then 320
    when 'full_karuta_game' then 1600
    when 'short_karuta_game' then 800
    when 'new_10_cards' then 800
    when 'new_50_cards' then 1600
    when 'repeated_cards' then 160
    when 'new_100_cards' then 3200
    else null
  end;

  if v_reward is null then
    raise exception 'Unknown achievement';
  end if;

  select multiplier
  into v_multiplier
  from public.player_achievement_multipliers
  where player_id = v_player_id
    and achievement_id = p_achievement_id
  for update;

  if coalesce(v_multiplier, 0) <= 0 then
    raise exception 'Achievement reward is not available';
  end if;

  update public.player_achievement_multipliers
  set multiplier = 0
  where player_id = v_player_id
    and achievement_id = p_achievement_id;

  v_reward := v_reward * v_multiplier;

  update public.player_resources
  set crystals = coalesce(public.player_resources.crystals, 0) + v_reward
  where player_id = v_player_id
  returning public.player_resources.crystals
    into v_crystals;

  if v_crystals is null then
    raise exception 'Player resources not found';
  end if;

  return query select 0, v_crystals;
end;
$$;

revoke all on function public.claim_achievement(text) from public;
grant execute on function public.claim_achievement(text) to authenticated;
