import { usePlayerData } from '../context/PlayerDataContext';

const Achievements = ({ setPage }) => {
  const {
    completedAchievements,
    achievementMultipliers,
    completeAchievement,
    resources,
    updateResources,
  } = usePlayerData();

  const allAchievements = [
    { id: 'training_together', text: 'Training together', reward: 800 },
    { id: 'full_karuta_game', text: 'Full karuta game', reward: 1600 },
    { id: 'short_karuta_game', text: 'Short karuta game', reward: 160 },
    { id: 'new_10_cards', text: 'New 10 cards', reward: 1600 },
    { id: 'repeated_cards', text: 'Repeated cards', reward: 80 },
    { id: 'new_100_cards', text: 'New 100 cards', reward: 8000 },
    { id: 'new_1000_cards', text: 'New 1000 cards', reward: 160000 },
    { id: 'new_characters', text: 'New characters', reward: 8000 },
    { id: 'first_10_cards', text: 'First 10 cards', reward: 800 },
  ];

  const getCompletionCount = (achievementId) => {
    return completedAchievements.filter(a => a.achievement_id === achievementId).length;
  };

  const getMultiplier = (achievementId) => {
    const multiplier = achievementMultipliers.find(m => m.achievement_id === achievementId);
    return multiplier ? multiplier.multiplier : 1;
  };

  const handleClaimClick = async (achievement) => {
    const completionCount = getCompletionCount(achievement.id);
    const multiplier = getMultiplier(achievement.id);

    if (completionCount < multiplier) {
      await completeAchievement(achievement.id);
      await updateResources({
        ...resources,
        crystals: resources.crystals + achievement.reward,
      });
    }
  };

  return (
    <div>
      <h2>Achievements</h2>
      <button onClick={() => setPage('gacha')}>Back to the gacha</button>
      <button onClick={() => updateResources({ ...resources, crystals: resources.crystals + 1000 })}>Add 1000 crystals (admin)</button>
      <ul>
        {allAchievements.map((ach) => {
          const completionCount = getCompletionCount(ach.id);
          const multiplier = getMultiplier(ach.id);
          const canClaim = completionCount < multiplier;

          return (
            <li key={ach.id}>
              <span>
                {ach.text} {multiplier > 1 && `x ${multiplier}`} - {ach.reward} crystals
              </span>
              <button
                onClick={() => handleClaimClick(ach)}
                disabled={!canClaim}
              >
                {canClaim ? `Claim x ${multiplier - completionCount}` : 'Claimed'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Achievements;
