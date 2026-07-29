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
  const [completedAchievements, setCompletedAchievements] = useState([]);
  const [achievementMultipliers, setAchievementMultipliers] = useState([]);
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
          { data: achievementsData, error: achievementsError },
          { data: multipliersData, error: multipliersError },
        ] = await Promise.all([
          supabase.from('players').select('*').eq('id', user.id).single(),
          supabase.from('player_resources').select('*').eq('player_id', user.id).single(),
          supabase.from('gacha_progress').select('*').eq('player_id', user.id).single(),
          supabase.from('collections').select('*').eq('player_id', user.id),
          supabase.from('player_achievements').select('*').eq('player_id', user.id),
          supabase.from('player_achievement_multipliers').select('*').eq('player_id', user.id),
        ]);

        if (playerError) console.error(playerError);
        if (resourcesError) console.error(resourcesError);
        if (gachaProgressError) console.error(gachaProgressError);
        if (collectionError) console.error(collectionError);
        if (achievementsError) console.error(achievementsError);
        if (multipliersError) console.error(multipliersError);

        setPlayer(playerData);
        setResources(resourcesData);
        setGachaProgress(gachaProgressData);
        setCollection(collectionData || []);
        setCompletedAchievements(achievementsData || []);
        setAchievementMultipliers(multipliersData || []);
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
      setCompletedAchievements(prev => {
        const existing = prev.find(item => item.achievement_id === achievementId);
        if (existing) {
          return prev.map(item =>
            item.achievement_id === achievementId
              ? { ...item, claim_count: data.claim_count }
              : item
          );
        }

        return [...prev, {
          player_id: user.id,
          achievement_id: achievementId,
          claim_count: data.claim_count,
        }];
      });
      setResources(prev => prev ? { ...prev, crystals: data.crystals } : prev);
    }

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
    completedAchievements,
    achievementMultipliers,
    loading,
    updateResources,
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
