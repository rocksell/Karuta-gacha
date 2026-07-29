import { useState } from 'react'
import { usePlayerData } from '../context/PlayerDataContext'
import heroImage from '../assets/karuta-sakura-hero.png'

const GachaPage = () => {
  const [revealedCards, setRevealedCards] = useState([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const {
    resources,
    gachaProgress,
    collection,
    updateResources,
    updateGachaProgress,
    addCardToCollection,
  } = usePlayerData()

  const generateReward = (pity) => {
    const getRate = (pity) => {
      if (pity >= 90) return { '5': 1, '4': 0, '3': 0 }
      if (pity >= 74) {
        const fiveStarRate = 0.01 + (pity - 73) * 0.06
        return {
          '5': fiveStarRate,
          '4': (1 - fiveStarRate) * 0.08,
          '3': (1 - fiveStarRate) * 0.91,
        }
      }
      return { '5': 0.01, '4': 0.08, '3': 0.91 }
    }

    const rates = getRate(pity)
    const rand = Math.random()
    let cumulative = 0

    for (const rarity in rates) {
      cumulative += rates[rarity]
      if (rand < cumulative) {
        const cardNumber = Math.floor(Math.random() * 100) + 1
        return {
          card_id: `poem-${cardNumber.toString().padStart(3, '0')}`,
          rarity: parseInt(rarity),
        }
      }
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

    let currentPity = gachaProgress.current_pity
    let newTotalWishes = gachaProgress.total_wishes
    const rewards = []
    for (let i = 0; i < amount; i++) {
      currentPity++
      newTotalWishes++
      const reward = generateReward(currentPity)

      if (reward.rarity === 5) {
        currentPity = 0
        // featured character logic to be added here
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
      total_wishes: newTotalWishes,
    })

    setRevealedCards(rewards)
    setActiveCardIndex(0)
  }

  const closeCardReveal = () => {
    setRevealedCards([])
    setActiveCardIndex(0)
  }

  const activeCard = revealedCards[activeCardIndex]
  const activeCardNumber = activeCard?.card_number
    ?? Number(activeCard?.card_id?.replace('poem-', ''))
  const readingHistory = [...(collection || [])]
    .filter(card => card.card_id?.startsWith('poem-'))
    .sort((left, right) => new Date(right.obtained_at) - new Date(left.obtained_at))

  return (
    <main className="karuta-stage" style={{ '--hero-image': `url(${heroImage})` }}>
      <div className="sakura sakura-one">✿</div>
      <div className="sakura sakura-two">✿</div>
      <section className="reading-card">
        <span className="eyebrow">春の大会 · Весенний турнир</span>
        <p className="japanese-title">ちはやぶる</p>
        <h1>Слушай. Чувствуй.<br /><em>Бери карту.</em></h1>
        <p className="reading-copy">
          Чтец произнесёт первые строки вака. Услышь решающий слог
          и собери свою колоду ста поэтов.
        </p>

        <div className="stats-row">
          <div className="stat">
            <span>Лепестки</span>
            <strong>🌸 {resources?.crystals?.toLocaleString('ru-RU') ?? 0}</strong>
          </div>
          <div className="stat">
            <span>До редкой карты</span>
            <strong>{Math.max(0, 90 - (gachaProgress?.current_pity ?? 0))}</strong>
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
      <div className="season-badge">
        <span>今</span>
        <div><small>Сезон</small><strong>Цветение сакуры</strong></div>
      </div>

      {activeCard && (
        <div className="card-reveal-backdrop" onClick={closeCardReveal}>
          <section className={`card-reveal-modal rarity-${activeCard.rarity}`} role="dialog" aria-modal="true" aria-labelledby="card-reveal-title">
            <div className="card-reveal-petals" aria-hidden="true">
              <span>✿</span><span>✿</span><span>✿</span><span>✿</span><span>✿</span>
            </div>
            <div className="revealed-card-frame">
              <div className="revealed-card-glow" />
              <div className="card-burn-line" aria-hidden="true" />
              <div className="card-burn-sparks" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => (
                  <i key={index} style={{ '--spark-index': index }} />
                ))}
              </div>
              <img
                src={`/cards/${String(activeCardNumber).padStart(3, '0')}.png`}
                alt={`Карта Огура Хякунин Иссю № ${activeCardNumber}`}
              />
            </div>
            <div className="card-reveal-copy">
              <span className="eyebrow">百人一首 · Карта прочитана</span>
              <h2 id="card-reveal-title">Поэма № {String(activeCardNumber).padStart(3, '0')}</h2>
              <div className="rarity-stars" aria-label={`Редкость: ${activeCard.rarity} звезды`}>
                {Array.from({ length: activeCard.rarity }, (_, index) => (
                  <span key={index} style={{ '--star-index': index }}>★</span>
                ))}
              </div>
              <p>
                Новая строка из антологии ста поэтов появилась в вашей коллекции.
              </p>
              {revealedCards.length > 1 && (
                <div className="reveal-pagination" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="ghost-button"
                    disabled={activeCardIndex === 0}
                    onClick={() => setActiveCardIndex(index => index - 1)}
                  >←</button>
                  <strong>{activeCardIndex + 1} / {revealedCards.length}</strong>
                  <button
                    className="ghost-button"
                    disabled={activeCardIndex === revealedCards.length - 1}
                    onClick={() => setActiveCardIndex(index => index + 1)}
                  >→</button>
                </div>
              )}
              <span className="reveal-close-hint">Нажмите в любом месте, чтобы продолжить</span>
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
              <div className="history-grid">
                {readingHistory.map((card, index) => {
                  const number = Number(card.card_id.replace('poem-', ''))
                  return (
                    <article className={`history-card history-rarity-${card.rarity}`} key={`${card.id ?? card.card_id}-${index}`}>
                      <img src={`/cards/${String(number).padStart(3, '0')}.png`} alt={`Поэма № ${number}`} />
                      <div>
                        <strong>№ {String(number).padStart(3, '0')}</strong>
                        <span>{'★'.repeat(card.rarity)}</span>
                      </div>
                    </article>
                  )
                })}
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
    </main>
  )
}

export default GachaPage
