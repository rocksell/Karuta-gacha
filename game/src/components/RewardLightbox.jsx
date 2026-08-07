import { useEffect } from 'react'
import { getRewardDetails } from '../lib/gachaRewards'
import RewardArtwork from './RewardArtwork'

const RewardLightbox = ({ card, onClose, theme = 'dark', actionLabel, onAction, actionDisabled = false }) => {
  const reward = getRewardDetails(card)

  useEffect(() => {
    if (!card) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [card, onClose])

  if (!card || !reward) return null

  return (
    <div className={`reward-lightbox is-${theme}`} role="dialog" aria-modal="true" aria-label={reward.name} onClick={onClose}>
      <button className="reward-lightbox-close" aria-label="Закрыть полноэкранный просмотр" onClick={onClose}>×</button>
      <div className="reward-lightbox-content" onClick={event => event.stopPropagation()}>
        <RewardArtwork card={card} className="reward-lightbox-art" />
        <div className="reward-lightbox-caption">
          <span>{'★'.repeat(reward.rarity)} · {reward.collectionLabel ?? reward.typeLabel}</span>
          <strong>{reward.name}</strong>
          {actionLabel && (
            <button
              className="primary-button reward-lightbox-action"
              type="button"
              disabled={actionDisabled}
              onClick={onAction}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardLightbox
