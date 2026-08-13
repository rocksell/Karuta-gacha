import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import RewardArtwork from './RewardArtwork'
import { getRewardDetails } from '../lib/gachaRewards'

const MarkRewards = ({ user, onClose }) => {
  const [cards, setCards] = useState([])
  const [savingCardId, setSavingCardId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_get_player_art_rewards', { p_player_id: user.id })

      if (error) {
        console.error(error)
        setCards([])
        setErrorMessage('Не удалось загрузить награды. Примените миграцию add_reward_completions.sql в Supabase.')
      } else {
        setCards((data || []).map(item => ({
          card_id: item.card_id,
          rarity: item.rarity,
          obtainedCount: item.obtained_count,
          completedCount: item.completed_count,
        })))
        setErrorMessage('')
      }
      setLoading(false)
    }

    fetchRewards()
  }, [user.id])

  const uniqueRewards = useMemo(() => {
    return [...cards].sort((left, right) => right.rarity - left.rarity || left.card_id.localeCompare(right.card_id))
  }, [cards])

  const incrementCompletion = async (cardId) => {
    setSavingCardId(cardId)
    setErrorMessage('')
    const { data, error } = await supabase.rpc('admin_increment_reward_completion', {
      p_player_id: user.id,
      p_card_id: cardId,
    })

    if (error) {
      console.error(error)
      setErrorMessage('Не удалось отметить награду.')
    } else {
      setCards(current => current.map(card => card.card_id === cardId
        ? { ...card, completedCount: data }
        : card))
    }
    setSavingCardId(null)
  }

  if (loading) {
    return <div className="reward-modal-backdrop"><div className="reward-modal reward-modal-loading">Загружаем награды…</div></div>
  }

  return (
    <div className="reward-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="mark-reward-title">
        <header className="reward-modal-head">
          <div>
            <span className="eyebrow">Отметить награды</span>
            <h3 id="mark-reward-title">Арт-награды игрока</h3>
            <p>{user.username || 'Игрок без имени'}</p>
          </div>
          <button className="modal-close" aria-label="Закрыть" onClick={onClose}>×</button>
        </header>
        <div className="reward-list reward-completion-list">
          {uniqueRewards.map(card => {
            const reward = getRewardDetails(card)
            const count = card.completedCount ?? 0
            const allCompleted = count >= card.obtainedCount
            return (
              <article className="reward-row reward-completion-row" key={card.card_id}>
                <span className="reward-completion-art"><RewardArtwork card={card} /></span>
                <span className="reward-name">
                  {reward?.name}
                  <small>Получено: {card.obtainedCount}</small>
                  <small className="reward-completed-value">Выполнено: {count}</small>
                </span>
                <button
                  className="completion-plus-button"
                  disabled={savingCardId === card.card_id || allCompleted}
                  onClick={() => incrementCompletion(card.card_id)}
                >
                  {savingCardId === card.card_id ? '…' : allCompleted ? 'Готово' : '+1'}
                </button>
              </article>
            )
          })}
          {!errorMessage && uniqueRewards.length === 0 && <p className="reward-completion-empty">У игрока пока нет наград 4★ или 5★.</p>}
        </div>
        {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}
        <footer className="reward-modal-actions"><button className="primary-button" onClick={onClose}>Готово</button></footer>
      </section>
    </div>
  )
}

export default MarkRewards
