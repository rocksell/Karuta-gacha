import { useMemo } from 'react'
import { usePlayerData } from '../context/PlayerDataContext'

const CollectionPage = ({ setPage }) => {
  const { collection } = usePlayerData()

  const uniqueCards = useMemo(() => {
    const cardsById = new Map()

    for (const card of collection || []) {
      if (!card.card_id?.startsWith('poem-')) continue
      const current = cardsById.get(card.card_id)
      if (!current || card.rarity > current.rarity) {
        cardsById.set(card.card_id, card)
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

  return (
    <main className="collection-page">
      <section className="collection-hero">
        <div>
          <span className="eyebrow">百人一首 · Собрание поэм</span>
          <h1>Моя коллекция</h1>
          <p>Здесь собраны уникальные карты. Повторы скрыты, а самые редкие находки стоят первыми.</p>
        </div>
        <div className="collection-total">
          <span>✿</span>
          <div><small>Собрано</small><strong>{uniqueCards.length} / 100</strong></div>
        </div>
      </section>

      <section className="collection-toolbar">
        <button className="ghost-button" onClick={() => setPage('gacha')}>← Вернуться к чтению</button>
        <div className="collection-rarity-stats">
          {rarityCounts.map(({ rarity, count }) => (
            <span className={`collection-rarity-count rarity-count-${rarity}`} key={rarity}>
              {'✿'.repeat(rarity)} <strong>{count}</strong>
            </span>
          ))}
        </div>
      </section>

      {uniqueCards.length > 0 ? (
        <section className="collection-gallery">
          {uniqueCards.map(card => {
            const number = Number(card.card_id.replace('poem-', ''))
            return (
              <article className={`collection-card collection-card-${card.rarity}`} key={card.card_id}>
                <div className="collection-card-image">
                  <img
                    src={`/cards/${String(number).padStart(3, '0')}.png`}
                    alt={`Карта Огура Хякунин Иссю № ${number}`}
                  />
                </div>
                <footer>
                  <div>
                    <small>百人一首</small>
                    <strong>Поэма № {String(number).padStart(3, '0')}</strong>
                  </div>
                  <span aria-label={`Редкость: ${card.rarity}`}>{'✿'.repeat(card.rarity)}</span>
                </footer>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="collection-empty">
          <span>🌸</span>
          <h2>Коллекция пока пуста</h2>
          <p>Прочитайте первую карту, и она появится здесь.</p>
          <button className="primary-button" onClick={() => setPage('gacha')}>Начать чтение</button>
        </section>
      )}
    </main>
  )
}

export default CollectionPage
