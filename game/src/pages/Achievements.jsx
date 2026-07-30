import { useEffect, useRef, useState } from 'react';
import { usePlayerData } from '../context/PlayerDataContext';

const Achievements = ({ setPage }) => {
  const {
    achievementMultipliers,
    completeAchievement,
    resources,
  } = usePlayerData();
  const [claimingId, setClaimingId] = useState(null);
  const [claimError, setClaimError] = useState('');
  const [justClaimedIds, setJustClaimedIds] = useState(() => new Set());
  const [flyingPetals, setFlyingPetals] = useState([]);
  const [animatedBalance, setAnimatedBalance] = useState(resources?.crystals ?? 0);
  const [balancePulse, setBalancePulse] = useState(false);
  const balanceRef = useRef(null);
  const animatedBalanceRef = useRef(resources?.crystals ?? 0);

  useEffect(() => {
    const target = resources?.crystals ?? 0;
    const start = animatedBalanceRef.current;
    if (start === target) return undefined;

    const startedAt = performance.now();
    const duration = 700;
    let frameId;

    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(start + (target - start) * eased);
      animatedBalanceRef.current = nextValue;
      setAnimatedBalance(nextValue);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [resources?.crystals]);

  const allAchievements = [
    { id: 'full_karuta_game', text: 'Сыграть полную игру на 25 карт', description: 'Завершите турнирную партию из двадцати пяти карт', reward: 1600, icon: '競', group: 'Матч' },
    { id: 'short_karuta_game', text: 'Сыграть короткую игру', description: 'Проведите быструю тренировочную встречу', reward: 800, icon: '読', group: 'Матч' },
    { id: 'new_10_cards', text: 'Выучить 10 карт', description: 'Запомните первые десять карт из ста стихотворений', reward: 800, icon: '十', group: 'Обучение' },
    { id: 'new_50_cards', text: 'Выучить 50 карт', description: 'Освойте половину колоды хякунин иссю', reward: 1600, icon: '五', group: 'Обучение' },
    { id: 'repeated_cards', text: 'Повторить все выученные карты', description: 'Закрепите чтение каждой уже знакомой карты', reward: 160, icon: '重', group: 'Обучение' },
    { id: 'new_100_cards', text: 'Выучить все 100 карт', description: 'Завершите изучение полной колоды хякунин иссю', reward: 3200, icon: '百', group: 'Мастерство' },
    { id: 'training_together', text: 'Совместная тренировка', description: 'Проведите тренировку с товарищем по клубу', reward: 320, icon: '結', group: 'Команда' },
  ];

  const getMultiplier = (achievementId) => {
    const multiplier = achievementMultipliers.find(m => m.achievement_id === achievementId);
    return multiplier ? multiplier.multiplier : 0;
  };

  const launchPetals = (sourceElement) => {
    const source = sourceElement.getBoundingClientRect();
    const target = balanceRef.current?.getBoundingClientRect();
    if (!target) return;

    const petals = Array.from({ length: 11 }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      x: source.left + source.width / 2,
      y: source.top + source.height / 2,
      dx: target.left + target.width / 2 - source.left - source.width / 2,
      dy: target.top + target.height / 2 - source.top - source.height / 2,
      drift: (Math.random() - 0.5) * 120,
      delay: index * 45,
      rotation: 140 + Math.random() * 260,
    }));

    setFlyingPetals(petals);
    setBalancePulse(true);
    window.setTimeout(() => setFlyingPetals([]), 1400);
    window.setTimeout(() => setBalancePulse(false), 1100);
  };

  const handleClaimClick = async (achievement, sourceElement) => {
    const multiplier = getMultiplier(achievement.id);

    if (multiplier > 0) {
      setClaimingId(achievement.id);
      setClaimError('');
      const { error } = await completeAchievement(achievement.id);
      if (error) {
        setClaimError('Не удалось начислить лепестки. Проверьте, что функция наград в Supabase обновлена.');
      } else {
        setJustClaimedIds(previous => new Set(previous).add(achievement.id));
        launchPetals(sourceElement);
      }
      setClaimingId(null);
    }
  };

  const availableAchievementCount = allAchievements.filter(
    achievement => getMultiplier(achievement.id) > 0
  ).length;
  const sortedAchievements = [...allAchievements].sort((left, right) => {
    const leftAvailable = getMultiplier(left.id) > 0;
    const rightAvailable = getMultiplier(right.id) > 0;
    return Number(rightAvailable) - Number(leftAvailable);
  });

  return (
    <main className="achievements-page">
      <section className="achievements-hero">
        <div>
          <span className="eyebrow">花の褒美 · Награды сезона</span>
          <h1>Сад лепестков</h1>
          <p>Выполняйте задания на татами и собирайте лепестки сакуры для новых чтений.</p>
        </div>
        <div ref={balanceRef} className={`petal-balance-card ${balancePulse ? 'is-receiving' : ''}`}>
          <span>🌸</span>
          <div><small>Ваш баланс</small><strong>{animatedBalance.toLocaleString('ru-RU')}</strong></div>
        </div>
      </section>

      <div className="flying-petals" aria-hidden="true">
        {flyingPetals.map(petal => (
          <span
            key={petal.id}
            style={{
              '--petal-x': `${petal.x}px`,
              '--petal-y': `${petal.y}px`,
              '--petal-dx': `${petal.dx}px`,
              '--petal-dy': `${petal.dy}px`,
              '--petal-drift': `${petal.drift}px`,
              '--petal-delay': `${petal.delay}ms`,
              '--petal-rotation': `${petal.rotation}deg`,
            }}
          >🌸</span>
        ))}
      </div>

      <section className="achievement-toolbar">
        <button className="ghost-button" onClick={() => setPage('gacha')}>← Вернуться к чтению</button>
        <div className="achievement-progress">
          <div>
            <span>Доступно наград</span>
            <strong>{availableAchievementCount}</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(availableAchievementCount / allAchievements.length) * 100}%` }} />
          </div>
          <small>из {allAchievements.length}</small>
        </div>
      </section>

      {claimError && <p className="achievement-error" role="alert">{claimError}</p>}

      <section className="achievement-grid">
        {sortedAchievements.map((ach) => {
          const multiplier = getMultiplier(ach.id);
          const canClaim = multiplier > 0;
          const remaining = multiplier;
          const justClaimed = justClaimedIds.has(ach.id);

          return (
            <article className={`achievement-card ${canClaim ? 'is-ready' : ''} ${justClaimed ? 'is-just-claimed' : ''}`} key={ach.id}>
              <div className="achievement-card-top">
                <span className="achievement-icon">{ach.icon}</span>
                <span className="achievement-group">{ach.group}</span>
                {justClaimed && <span className="complete-mark">✓</span>}
              </div>
              <h2>{ach.text}</h2>
              <p>{ach.description}</p>
              <div className="achievement-card-bottom">
                <div className="achievement-reward">
                  <span>🌸</span>
                  <div><small>Награда</small><strong>{ach.reward.toLocaleString('ru-RU')}</strong></div>
                </div>
                {multiplier > 1 && <span className="repeat-badge">×{multiplier}</span>}
              </div>
              <button
                className={canClaim ? 'primary-button claim-button' : 'claimed-button'}
                onClick={(event) => handleClaimClick(ach, event.currentTarget)}
                disabled={!canClaim || justClaimed || claimingId === ach.id}
              >
                {claimingId === ach.id
                  ? 'Начисляем…'
                  : justClaimed
                    ? 'Получено'
                    : canClaim
                    ? `Получить${remaining > 1 ? ` · ×${remaining}` : ''}`
                    : 'Ещё не собрано'}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default Achievements;
