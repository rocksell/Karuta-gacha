import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const allAchievements = [
  { id: 'full_karuta_game', text: 'Сыграть полную игру на 25 карт', icon: '競' },
  { id: 'short_karuta_game', text: 'Сыграть короткую игру', icon: '読' },
  { id: 'new_10_cards', text: 'Выучить 10 карт', icon: '十' },
  { id: 'new_50_cards', text: 'Выучить 50 карт', icon: '五' },
  { id: 'repeated_cards', text: 'Повторить все выученные карты', icon: '重' },
  { id: 'new_100_cards', text: 'Выучить все 100 карт', icon: '百' },
  { id: 'training_together', text: 'Совместная тренировка', icon: '結' },
];

const EyeIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.7" />
    {!open && <path d="M4 4 20 20" />}
  </svg>
);

const ManageRewards = ({ user, onClose }) => {
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    const existingMultiplier = multipliers.find(m => m.achievement_id === achievementId);
    if (existingMultiplier) {
      setMultipliers(current => current.map(item => item.achievement_id === achievementId
        ? { ...item, multiplier: value }
        : item));
      return;
    }
    setMultipliers(current => [...current, {
      player_id: user.id,
      achievement_id: achievementId,
      multiplier: value,
      is_visible: true,
    }]);
  };

  const toggleVisibility = (achievementId) => {
    const existingMultiplier = multipliers.find(item => item.achievement_id === achievementId);
    if (existingMultiplier) {
      setMultipliers(current => current.map(item => item.achievement_id === achievementId
        ? { ...item, is_visible: item.is_visible === false }
        : item));
      return;
    }
    setMultipliers(current => [...current, {
      player_id: user.id,
      achievement_id: achievementId,
      multiplier: 0,
      is_visible: false,
    }]);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    const { error } = await supabase
      .from('player_achievement_multipliers')
      .upsert(multipliers, { onConflict: ['player_id', 'achievement_id'] });
    if (error) {
      console.error('Error saving multipliers:', error);
      setErrorMessage('Не удалось сохранить награды. Попробуйте ещё раз.');
    } else {
      onClose();
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="reward-modal-backdrop"><div className="reward-modal reward-modal-loading">Загружаем свиток наград…</div></div>;
  }

  return (
    <div className="reward-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
        <header className="reward-modal-head">
          <div>
            <span className="eyebrow">Добавить лепестки</span>
            <h3 id="reward-title">Лепестки за достижения</h3>
            <p>{user.username || 'Игрок без имени'}</p>
          </div>
          <button className="modal-close" aria-label="Закрыть" onClick={onClose}>×</button>
        </header>
        <div className="reward-list">
          {allAchievements.map(ach => {
            const settings = multipliers.find(m => m.achievement_id === ach.id);
            const multiplier = settings?.multiplier ?? 0;
            const isVisible = settings?.is_visible !== false;
            return (
              <div className={`reward-row ${isVisible ? '' : 'is-hidden'}`} key={ach.id}>
                <span className="reward-icon">{ach.icon}</span>
                <span className="reward-name">{ach.text}<small>Количество наград в лепестках</small></span>
                <button
                  type="button"
                  className={`achievement-visibility-button ${isVisible ? 'is-visible' : ''}`}
                  onClick={() => toggleVisibility(ach.id)}
                  aria-label={`${isVisible ? 'Скрыть' : 'Показать'} достижение «${ach.text}»`}
                  title={isVisible ? 'Видно игроку' : 'Скрыто от игрока'}
                >
                  <EyeIcon open={isVisible} />
                </button>
                <span className="multiplier-control">
                  <button type="button" onClick={() => handleMultiplierChange(ach.id, Math.max(0, multiplier - 1))}>−</button>
                  <input
                    type="number"
                    min="0"
                    value={multiplier}
                    onChange={(e) => handleMultiplierChange(ach.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                    aria-label={`Множитель: ${ach.text}`}
                  />
                  <button type="button" onClick={() => handleMultiplierChange(ach.id, multiplier + 1)}>+</button>
                </span>
              </div>
            );
          })}
        </div>
        {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
        <footer className="reward-modal-actions">
          <button className="ghost-button" onClick={onClose}>Отмена</button>
          <button className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить лепестки'}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default ManageRewards;
