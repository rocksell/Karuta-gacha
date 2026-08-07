-- Полностью сбрасывает данные гачи у всех игроков:
--   * удаляет все полученные карточки и арты;
--   * обнуляет лепестки (crystals) и золото;
--   * обнуляет 5-звёздочный и 4-звёздочный pity;
--   * обнуляет общее число круток;
--   * снимает гарантию featured-награды.
-- Профили и достижения не удаляются.
-- Запускайте через Supabase SQL Editor с правами владельца проекта.

begin;

delete from public.collections;

update public.player_resources
set
  crystals = 0,
  gold = 0;

update public.gacha_progress
set
  current_pity = 0,
  four_star_pity = 0,
  total_wishes = 0,
  guaranteed_featured = false;

commit;

-- Контрольный результат после сброса.
select
  (select count(*) from public.collections) as remaining_cards,
  (select count(*) from public.player_resources where crystals <> 0 or gold <> 0) as players_with_currency,
  (
    select count(*)
    from public.gacha_progress
    where current_pity <> 0
       or four_star_pity <> 0
       or total_wishes <> 0
       or guaranteed_featured is true
  ) as players_with_gacha_progress;
