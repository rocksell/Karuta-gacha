import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const allAchievements = [
  { id: 'training_together', text: 'Training together' },
  { id: 'full_karuta_game', text: 'Full karuta game' },
  { id: 'short_karuta_game', text: 'Short karuta game' },
  { id: 'new_10_cards', text: 'New 10 cards' },
  { id: 'repeated_cards', text: 'Repeated cards' },
  { id: 'new_100_cards', text: 'New 100 cards' },
  { id: 'new_1000_cards', text: 'New 1000 cards' },
  { id: 'new_characters', text: 'New characters' },
  { id: 'first_10_cards', text: 'First 10 cards' },
];

const ManageRewards = ({ user, onClose }) => {
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMultipliers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('player_achievement_multipliers')
        .select('*')
        .eq('player_id', user.id);
      if (error) {
        console.error('Error fetching multipliers:', error);
      } else {
        setMultipliers(data);
      }
      setLoading(false);
    };

    fetchMultipliers();
  }, [user]);

  const handleMultiplierChange = (achievementId, value) => {
    const newMultipliers = [...multipliers];
    const existingMultiplier = newMultipliers.find(m => m.achievement_id === achievementId);
    if (existingMultiplier) {
      existingMultiplier.multiplier = value;
    } else {
      newMultipliers.push({ player_id: user.id, achievement_id: achievementId, multiplier: value });
    }
    setMultipliers(newMultipliers);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('player_achievement_multipliers')
      .upsert(multipliers, { onConflict: ['player_id', 'achievement_id'] });
    if (error) {
      console.error('Error saving multipliers:', error);
    } else {
      onClose();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', border: '1px solid black', padding: '1rem' }}>
      <h3>Manage Rewards for {user.username}</h3>
      {allAchievements.map(ach => {
        const multiplier = multipliers.find(m => m.achievement_id === ach.id)?.multiplier || 1;
        return (
          <div key={ach.id}>
            <label>{ach.text}</label>
            <input
              type="number"
              value={multiplier}
              onChange={(e) => handleMultiplierChange(ach.id, parseInt(e.target.value, 10))}
            />
          </div>
        );
      })}
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default ManageRewards;
