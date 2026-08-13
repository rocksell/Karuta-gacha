import { useMemo, useState } from 'react'
import { usePlayerData } from '../context/PlayerDataContext'
import RewardArtwork from '../components/RewardArtwork'
import RewardLightbox from '../components/RewardLightbox'
import { getRewardDetails, isArtReward } from '../lib/gachaRewards'

const getTimesWord = count => {
  const lastTwoDigits = count % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'раз'
  if (count % 10 === 1) return 'раз'
  if (count % 10 >= 2 && count % 10 <= 4) return 'раза'
  return 'раз'
}

const CollectionPage = ({ setPage }) => {
  const { collection, player, rewardCompletions, updatePlayer } = usePlayerData()
  const [selectedRarity, setSelectedRarity] = useState(null)
  const [lightboxCard, setLightboxCard] = useState(null)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const completionCounts = useMemo(() => Object.fromEntries(
    (rewardCompletions || []).map(item => [item.card_id, item.completed_count]),
  ), [rewardCompletions])

  const setAsAvatar = async () => {
    if (!lightboxCard || isSavingAvatar) return
    setIsSavingAvatar(true)
    const { error } = await updatePlayer({ avatar: lightboxCard.card_id })
    setIsSavingAvatar(false)
    if (!error) setLightboxCard(null)
  }

  const uniqueCards = useMemo(() => {
    const cardsById = new Map()

    for (const card of collection || []) {
      if (!isArtReward(card)) continue
      const current = cardsById.get(card.card_id)
      if (current) {
        cardsById.set(card.card_id, {
          ...(card.rarity > current.rarity ? card : current),
          obtainedCount: current.obtainedCount + 1,
        })
      } else {
        cardsById.set(card.card_id, { ...card, obtainedCount: 1 })
      }
    }

    return [...cardsById.values()].sort((left, right) => {
      const rarityDifference = right.rarity - left.rarity
      if (rarityDifference) return rarityDifference
      return left.card_id.localeCompare(right.card_id)
    })
  }, [collection])

  const rarityCounts = [5, 4, 3].map(rarity => ({
    rarity,
    count: uniqueCards.filter(card => card.rarity === rarity).length,
  }))
  const visibleCards = selectedRarity
    ? uniqueCards.filter(card => card.rarity === selectedRarity)
    : uniqueCards
  const collectionGroups = useMemo(() => {
    const groups = new Map()

    for (const card of visibleCards) {
      const reward = getRewardDetails(card)
      const label = reward?.collectionLabel ?? reward?.typeLabel ?? 'Другая коллекция'
      const key = `${card.rarity}-${label}`
      if (!groups.has(key)) groups.set(key, { rarity: card.rarity, label, cards: [] })
      groups.get(key).cards.push(card)
    }

    return [...groups.values()].sort((left, right) => {
      const rarityDifference = right.rarity - left.rarity
      return rarityDifference || left.label.localeCompare(right.label, 'ru')
    })
  }, [visibleCards])

  return (
    <main className="collection-page">
      <section className="collection-hero">
        <div>
          <span className="eyebrow">Награды</span>
          <h1>Моя коллекция</h1>
          <p>Здесь собраны ваши арты, распределённые по коллекциям.</p>
        </div>
        <div className="collection-total">
          <span>✿</span>
          <div><small>Собрано уникальных</small><strong>{uniqueCards.length}</strong></div>
        </div>
      </section>

      <section className="collection-toolbar">
        <button className="ghost-button" onClick={() => setPage('gacha')}>← Вернуться к чтению</button>
        <div className="collection-filter" aria-label="Фильтр коллекции по редкости">
          <span>Показывать только</span>
          <button className={selectedRarity === null ? 'is-active' : ''} onClick={() => setSelectedRarity(null)}>Все</button>
          {rarityCounts.map(({ rarity, count }) => (
            <button
              className={`rarity-filter-${rarity}${selectedRarity === rarity ? ' is-active' : ''}`}
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
            >
              {'★'.repeat(rarity)} <strong>{count}</strong>
            </button>
          ))}
        </div>
      </section>

      {collectionGroups.map(group => (
        <section className={`collection-group collection-group-${group.rarity}`} key={`${group.rarity}-${group.label}`}>
          <header className="collection-group-head">
            <div>
              <span>{'★'.repeat(group.rarity)}</span>
              <h2>{group.label}</h2>
            </div>
            <small>{group.cards.length} арт.</small>
          </header>
          <div className="collection-gallery">
            {group.cards.map(card => {
              const reward = getRewardDetails(card)
              return (
                <button
                  className={`collection-card collection-card-${card.rarity}`}
                  key={card.card_id}
                  onClick={() => setLightboxCard(card)}
                  aria-label={`Открыть арт «${reward?.name}» на весь экран`}
                >
                  <div className="collection-card-image">
                    <RewardArtwork card={card} />
                  </div>
                  <footer>
                    <div>
                      <small>{reward?.typeLabel}</small>
                      <strong>{reward?.name}</strong>
                      <small className="collection-obtained-count">
                        Получена {card.obtainedCount} {getTimesWord(card.obtainedCount)}
                      </small>
                      {card.rarity >= 4 && (
                        <small className="collection-completed-count">
                          Выполнено: {Math.min(completionCounts[card.card_id] ?? 0, card.obtainedCount)}
                        </small>
                      )}
                    </div>
                    <span aria-label={`Редкость: ${card.rarity}`}>{'✿'.repeat(card.rarity)}</span>
                  </footer>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {uniqueCards.length > 0 && visibleCards.length === 0 && (
        <section className="collection-empty collection-filter-empty">
          <span>✿</span>
          <h2>Карт этой редкости пока нет</h2>
          <button className="ghost-button" onClick={() => setSelectedRarity(null)}>Показать всю коллекцию</button>
        </section>
      )}

      {uniqueCards.length === 0 && (
        <section className="collection-empty">
          <span>🌸</span>
          <h2>Коллекция пока пуста</h2>
          <p>Прочитайте первую карту, и она появится здесь.</p>
          <button className="primary-button" onClick={() => setPage('gacha')}>Начать чтение</button>
        </section>
      )}
      <RewardLightbox
        card={lightboxCard}
        theme="light"
        onClose={() => setLightboxCard(null)}
        actionLabel={player?.avatar === lightboxCard?.card_id ? 'Уже стоит на аватаре' : 'Поставить на аватар'}
        actionDisabled={isSavingAvatar || player?.avatar === lightboxCard?.card_id}
        onAction={setAsAvatar}
      />
    </main>
  )
}

export default CollectionPage
