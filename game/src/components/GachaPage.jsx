import { useEffect, useState } from 'react'
import { usePlayerData } from '../context/PlayerDataContext'
import heroImage from '../assets/japanese-room-with-tatami-floor.jpg'
import RewardArtwork from './RewardArtwork'
import RewardLightbox from './RewardLightbox'
import { getRandomReward, getRewardDetails, isGachaCard } from '../lib/gachaRewards'

const EVENT_END = new Date('2026-09-22T00:00:00+02:00')

const getEventTimeLeft = () => {
  const millisecondsLeft = Math.max(0, EVENT_END.getTime() - Date.now())
  const totalHours = Math.floor(millisecondsLeft / (1000 * 60 * 60))

  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  }
}

const GachaPage = () => {
  const [revealedCards, setRevealedCards] = useState([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isRevealPending, setIsRevealPending] = useState(false)
  const [displayedFiveStarPity, setDisplayedFiveStarPity] = useState(0)
  const [lightboxCard, setLightboxCard] = useState(null)
  const [eventTimeLeft] = useState(getEventTimeLeft)
  const {
    resources,
    gachaProgress,
    collection,
    updateResources,
    updateGachaProgress,
    addCardToCollection,
  } = usePlayerData()

  useEffect(() => {
    if (!isRevealPending && revealedCards.length === 0) {
      setDisplayedFiveStarPity(gachaProgress?.current_pity ?? 0)
    }
  }, [gachaProgress?.current_pity, isRevealPending, revealedCards.length])

  const generateReward = (fiveStarPity, fourStarPity, excludedFourStarTypes = []) => {
    const getFiveStarRate = () => {
      if (fiveStarPity >= 90) return 1
      if (fiveStarPity >= 83) return 0.5

      const softPityRates = {
        75: 0.2,
        76: 0.21,
        77: 0.22,
        78: 0.23,
        79: 0.24,
        80: 0.3,
        81: 0.31,
        82: 0.32,
      }

      return softPityRates[fiveStarPity] ?? 0.006
    }

    let rarity
    if (fiveStarPity >= 90) {
      rarity = 5
    } else if (fourStarPity >= 10) {
      rarity = 4
    } else {
      const fiveStarRate = getFiveStarRate()
      const fourStarRate = fourStarPity === 9 ? 0.5 : 0.055
      const roll = Math.random()

      if (roll < fiveStarRate) rarity = 5
      else if (roll < fiveStarRate + fourStarRate) rarity = 4
      else rarity = 3
    }

    const reward = getRandomReward(rarity, {
      excludedTypes: rarity === 4 ? excludedFourStarTypes : [],
    })
    return {
      card_id: reward.cardId,
      rarity,
    }
  }

  const handleReading = async (amount) => {
    if (!resources || !gachaProgress) {
      alert('Данные игрока ещё загружаются')
      return
    }

    const cost = amount * 160
    if (resources.crystals < cost) {
      alert('Недостаточно лепестков для чтения')
      return
    }

    setIsRevealPending(true)

    let currentPity = gachaProgress.current_pity
    let fourStarPity = gachaProgress.four_star_pity ?? 0
    let newTotalWishes = gachaProgress.total_wishes
    let hasCandyInFirstTen = (collection || []).some(card =>
      card.card_id === 'reward-4-candy-candy'
    )
    const rewards = []
    for (let i = 0; i < amount; i++) {
      currentPity++
      fourStarPity = Math.min(10, fourStarPity + 1)
      newTotalWishes++
      const isInFirstTen = newTotalWishes <= 10
      const reward = generateReward(
        currentPity,
        fourStarPity,
        isInFirstTen && hasCandyInFirstTen ? ['candy'] : [],
      )

      if (isInFirstTen && reward.card_id === 'reward-4-candy-candy') {
        hasCandyInFirstTen = true
      }

      if (reward.rarity === 5) {
        currentPity = 0
      }
      if (reward.rarity === 4) {
        fourStarPity = 0
      }
      rewards.push({
        ...reward,
        obtained_at: new Date()
      })
    }

    // Update player resources
    await updateResources({ crystals: resources.crystals - cost })

    // Add cards to collection
    await addCardToCollection(rewards)

    // Update pity
    await updateGachaProgress({
      current_pity: currentPity,
      four_star_pity: fourStarPity,
      total_wishes: newTotalWishes,
    })

    setRevealedCards(rewards)
    setActiveCardIndex(0)
    setIsSummaryOpen(false)
    setLightboxCard(null)
  }

  const closeCardReveal = () => {
    setDisplayedFiveStarPity(gachaProgress?.current_pity ?? 0)
    setIsRevealPending(false)
    setRevealedCards([])
    setActiveCardIndex(0)
    setIsSummaryOpen(false)
    setLightboxCard(null)
  }

  const handleRevealClick = () => {
    if (revealedCards.length === 1) {
      closeCardReveal()
    } else if (activeCardIndex < revealedCards.length - 1) {
      setActiveCardIndex(index => index + 1)
    } else {
      setIsSummaryOpen(true)
    }
  }

  const activeCard = revealedCards[activeCardIndex]
  const activeReward = getRewardDetails(activeCard)
  const readingHistory = [...(collection || [])]
    .filter(isGachaCard)
    .sort((left, right) => new Date(right.obtained_at) - new Date(left.obtained_at))

  return (
    <main
      className={`karuta-stage${activeCard ? ' has-card-reveal' : ''}`}
      style={{ '--hero-image': `url(${heroImage})` }}
    >
      <div className="sakura sakura-one">✿</div>
      <div className="sakura sakura-two">✿</div>
      <section className="reading-card">
        <span className="eyebrow">夏の大会 · Летний турнир</span>
        <p className="japanese-title">ちはやぶる</p>
        <h1>Играй в каруту<br /><em>Получай призы</em></h1>
        <p className="reading-copy">
          За каждые 10 карт получи гарантировано 4* предмет,<br />
          а за каждые 90 — 5*!
        </p>

        <div className="stats-row">
          <div className="stat">
            <span>Лепестки</span>
            <strong>🌸 {resources?.crystals?.toLocaleString('ru-RU') ?? 0}</strong>
          </div>
          <div className="stat">
            <span>До редкой карты</span>
            <strong>{Math.max(0, 90 - displayedFiveStarPity)}</strong>
          </div>
          <div className="stat">
            <span>Прочитано</span>
            <strong>{gachaProgress?.total_wishes ?? 0}</strong>
          </div>
        </div>

        <div className="reading-actions">
          <button className="primary-button reading-button" onClick={() => handleReading(1)}>
            <span>Прочитать карту</span>
            <small>160 лепестков</small>
          </button>
          <button className="secondary-button reading-button" onClick={() => handleReading(10)}>
            <span>Чтение десяти</span>
            <small>1 600 лепестков</small>
          </button>
        </div>

        <button className="reading-history-link" onClick={() => setIsHistoryOpen(true)}>
          <span>▦</span> Посмотреть зачитанные карты
        </button>
      </section>
      <div className="event-promo">
        <div className="event-banner">
          <div className="event-banner-sparkles" aria-hidden="true"><i /><i /><i /></div>
          <img className="event-character event-character-left" src="/banner.png" alt="" aria-hidden="true" />
          <img className="event-character event-character-right" src="/banner.png" alt="" aria-hidden="true" />
          <div className="event-banner-copy">
            <strong>Летний ивент 5 ✿</strong>
            <span className="event-banner-prize">Получи портрет персонажа из любой JRPG!</span>
            <span className="event-banner-divider">или</span>
            <span className="event-banner-prize">Получи акварельный пейзаж на выбор.</span>
          </div>
        </div>
        <div className="event-countdown">
          <span aria-hidden="true">◷</span>
          <strong>Осталось {eventTimeLeft.days} дней {eventTimeLeft.hours} часов</strong>
        </div>
      </div>

      {activeCard && !isSummaryOpen && (
        <div className="card-reveal-backdrop" onClick={handleRevealClick}>
          <section
            className={`card-reveal-modal rarity-${activeCard.rarity}`}
            key={activeCardIndex}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-reveal-title"
          >
            {revealedCards.length > 1 && (
              <button
                className="reveal-skip"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsSummaryOpen(true)
                }}
              >
                Пропустить →
              </button>
            )}
            <div className="card-reveal-petals" aria-hidden="true">
              <span>✿</span><span>✿</span><span>✿</span><span>✿</span><span>✿</span>
            </div>
            <div className="revealed-card-frame">
              <div className="revealed-card-glow" />
              <div className="reward-card-flipper">
                <div className="reward-card-face reward-card-back">
                  <img src={activeReward?.backPath} alt="Рубашка карты каруты" />
                </div>
                <div className="reward-card-face reward-card-front">
                  <button
                    className="reward-art-open"
                    aria-label="Открыть арт на весь экран"
                    onClick={event => {
                      event.stopPropagation()
                      setLightboxCard(activeCard)
                    }}
                  >
                    <RewardArtwork card={activeCard} />
                  </button>
                  <div className="reward-card-caption">
                    <small>{activeReward?.typeLabel}</small>
                    <strong>{activeReward?.name}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-reveal-copy">
              <span className="eyebrow">新しい報酬 · Новая награда</span>
              <h2 id="card-reveal-title">{activeReward?.name}</h2>
              <div className="rarity-stars" aria-label={`Редкость: ${activeCard.rarity}`}>
                {Array.from({ length: activeCard.rarity }, (_, index) => (
                  <span key={index} style={{ '--star-index': index }}>✿</span>
                ))}
              </div>
              <p>
                {activeReward?.description
                  ?? `Тип: ${activeReward?.typeLabel}. Карта добавлена в вашу коллекцию.`}
              </p>
              {revealedCards.length > 1 && (
                <div className="reveal-pagination">
                  <strong>{activeCardIndex + 1} / {revealedCards.length}</strong>
                </div>
              )}
              <span className="reveal-close-hint">
                {revealedCards.length === 1
                  ? 'Нажмите в любом месте, чтобы закрыть'
                  : activeCardIndex === revealedCards.length - 1
                    ? 'Нажмите, чтобы увидеть все карты'
                    : 'Нажмите, чтобы открыть следующую карту'}
              </span>
            </div>
          </section>
        </div>
      )}

      {isSummaryOpen && revealedCards.length > 1 && (
        <div className="reading-summary-backdrop" onClick={closeCardReveal}>
          <section className="reading-summary" role="dialog" aria-modal="true" aria-labelledby="reading-summary-title">
            <div className="card-reveal-petals" aria-hidden="true">
              <span>✿</span><span>✿</span><span>✿</span><span>✿</span><span>✿</span>
            </div>
            <header className="reading-summary-head">
              <span className="eyebrow">十枚読み · Итоги чтения</span>
              <h2 id="reading-summary-title">Полученные карты</h2>
              <p>Вся десятка раскрыта — нажмите в любом месте, чтобы продолжить</p>
            </header>
            <div className="reading-summary-grid">
              {revealedCards.map((card, index) => {
                const reward = getRewardDetails(card)
                return (
                  <article
                    className={`summary-card summary-rarity-${card.rarity}`}
                    key={`${card.card_id}-${index}`}
                    style={{ '--summary-index': index }}
                  >
                    <RewardArtwork card={card} />
                    <div>
                      <strong>{reward?.name}</strong>
                      <span>{'✿'.repeat(card.rarity)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {isHistoryOpen && (
        <div className="history-backdrop" onClick={() => setIsHistoryOpen(false)}>
          <section className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title" onClick={(event) => event.stopPropagation()}>
            <header className="history-head">
              <div>
                <span className="eyebrow">読んだ札 · Архив чтений</span>
                <h2 id="history-title">Зачитанные карты</h2>
                <p>{readingHistory.length} карт в истории</p>
              </div>
              <button className="modal-close" aria-label="Закрыть" onClick={() => setIsHistoryOpen(false)}>×</button>
            </header>
            {readingHistory.length > 0 ? (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Лепестки</th>
                      <th>Карта</th>
                      <th>Редкость</th>
                      <th>Прочитана</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingHistory.map((card, index) => {
                      const reward = getRewardDetails(card)
                      const obtainedDate = card.obtained_at
                        ? new Date(card.obtained_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                        : '—'
                      return (
                        <tr className={`history-rarity-${card.rarity}`} key={`${card.id ?? card.card_id}-${index}`}>
                          <td>
                            <span className="history-petals" aria-label={`Редкость: ${card.rarity}`}>
                              {Array.from({ length: card.rarity }, (_, petalIndex) => (
                                <i key={petalIndex}>✿</i>
                              ))}
                            </span>
                          </td>
                          <td>
                            <div className="history-card-name">
                              <RewardArtwork card={card} />
                              <strong>{reward?.name}</strong>
                            </div>
                          </td>
                          <td><span className="history-rarity-label">{card.rarity} редкость</span></td>
                          <td><time>{obtainedDate}</time></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="history-empty">
                <span>🌸</span>
                <h3>История пока пуста</h3>
                <p>Прочитайте первую карту — она появится здесь.</p>
              </div>
            )}
          </section>
        </div>
      )}
      <RewardLightbox card={lightboxCard} theme="light" onClose={() => setLightboxCard(null)} />
    </main>
  )
}

export default GachaPage
