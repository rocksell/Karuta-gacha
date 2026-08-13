import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PlayerDataContext = createContext();

export const usePlayerData = () => useContext(PlayerDataContext);

export const PlayerDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [resources, setResources] = useState(null);
  const [gachaProgress, setGachaProgress] = useState(null);
  const [collection, setCollection] = useState([]);
  const [achievementMultipliers, setAchievementMultipliers] = useState([]);
  const [claimedAchievementIds, setClaimedAchievementIds] = useState([]);
  const [rewardCompletions, setRewardCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const getPlayerData = async () => {
        setLoading(true);
        const [
          { data: playerData, error: playerError },
          { data: resourcesData, error: resourcesError },
          { data: gachaProgressData, error: gachaProgressError },
          { data: collectionData, error: collectionError },
          { data: multipliersData, error: multipliersError },
          { data: claimedAchievementsData, error: claimedAchievementsError },
          { data: rewardCompletionsData, error: rewardCompletionsError },
        ] = await Promise.all([
          supabase.from('players').select('*').eq('id', user.id).single(),
          supabase.from('player_resources').select('*').eq('player_id', user.id).single(),
          supabase.from('gacha_progress').select('*').eq('player_id', user.id).single(),
          supabase
            .from('collections')
            .select('*')
            .eq('player_id', user.id)
            .order('obtained_at', { ascending: true })
            .order('id', { ascending: true }),
          supabase.from('player_achievement_multipliers').select('*').eq('player_id', user.id),
          supabase.from('player_claimed_achievements').select('achievement_id').eq('player_id', user.id),
          supabase.from('player_reward_completions').select('*').eq('player_id', user.id),
        ]);

        if (playerError) console.error(playerError);
        if (resourcesError) console.error(resourcesError);
        if (gachaProgressError) console.error(gachaProgressError);
        if (collectionError) console.error(collectionError);
        if (multipliersError) console.error(multipliersError);
        if (claimedAchievementsError) console.error(claimedAchievementsError);
        if (rewardCompletionsError) console.error(rewardCompletionsError);

        setPlayer(playerData);
        setResources(resourcesData);
        setGachaProgress(gachaProgressData);
        setCollection(collectionData || []);
        setAchievementMultipliers(multipliersData || []);
        setClaimedAchievementIds((claimedAchievementsData || []).map(item => item.achievement_id));
        setRewardCompletions(rewardCompletionsData || []);
        setLoading(false);
      };

      getPlayerData();
    }
  }, [user]);

  const updateResources = async (newResources) => {
    const previousResources = resources;
    setResources(newResources);
    const { data, error } = await supabase
      .from('player_resources')
      .update(newResources)
      .eq('player_id', user.id);
    if (error) {
      console.error(error);
      // Rollback on error
      setResources(previousResources);
    }
    return data;
  };

  const updateGachaProgress = async (newProgress) => {
    const previousGachaProgress = gachaProgress;
    setGachaProgress(newProgress);
    const { data, error } = await supabase
      .from('gacha_progress')
      .update(newProgress)
      .eq('player_id', user.id);
    if (error) {
      console.error(error);
      // Rollback on error
      setGachaProgress(previousGachaProgress);
    }
    return data;
  };

  const addCardToCollection = async (cards) => {
    const cardsWithPlayerId = cards.map(c => ({ ...c, player_id: user.id }));
    const { data, error } = await supabase.from('collections').insert(cardsWithPlayerId).select();
    if (error) {
      console.error(error);
    } else if (data) {
      setCollection(prev => [...prev, ...data]);
    }
    return data;
  };

  const completeAchievement = async (achievementId) => {
    const { data, error } = await supabase
      .rpc('claim_achievement', { p_achievement_id: achievementId })
      .single();

    if (error) {
      console.error(error);
      return { data: null, error };
    }

    if (data) {
      setResources(prev => prev ? { ...prev, crystals: data.crystals } : prev);
      setAchievementMultipliers(prev => prev.map(item =>
        item.achievement_id === achievementId
          ? { ...item, multiplier: 0 }
          : item
      ));
      if (data.claim_count > 0) {
        setClaimedAchievementIds(previous => previous.includes(achievementId)
          ? previous
          : [...previous, achievementId]);
      }
    }

    return { data, error: null };
  };

  const updatePlayer = async (changes) => {
    const previousPlayer = player;
    const nextPlayer = { ...player, ...changes };
    setPlayer(nextPlayer);
    const { data, error } = await supabase
      .from('players')
      .update(changes)
      .eq('id', user.id)
      .select()
      .single();
    if (error) {
      console.error(error);
      setPlayer(previousPlayer);
      return { data: null, error };
    }
    setPlayer(data);
    return { data, error: null };
  };

  const updateAchievementMultipliers = async (newMultipliers) => {
    const previousMultipliers = achievementMultipliers;
    setAchievementMultipliers(newMultipliers);
    const { data, error } = await supabase
      .from('player_achievement_multipliers')
      .upsert(newMultipliers, { onConflict: ['player_id', 'achievement_id'] });
    if (error) {
      console.error(error);
      setAchievementMultipliers(previousMultipliers);
    }
    return data;
  };

  const value = {
    player,
    resources,
    gachaProgress,
    collection,
    achievementMultipliers,
    claimedAchievementIds,
    rewardCompletions,
    loading,
    updateResources,
    updatePlayer,
    updateGachaProgress,
    addCardToCollection,
    completeAchievement,
    updateAchievementMultipliers,
  };

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
};
