import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePlayerData } from '../context/PlayerDataContext'
import RewardArtwork from './RewardArtwork'
import RewardLightbox from './RewardLightbox'
import { isArtReward } from '../lib/gachaRewards'

const ProfilePanel = ({ onOpenCollection }) => {
  const { signOut } = useAuth()
  const { player, collection } = usePlayerData()
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const avatarCard = player?.avatar ? { card_id: player.avatar } : null
  const uniqueCardsCount = new Set(
    (collection || []).filter(isArtReward).map(card => card.card_id)
  ).size

  return (
    <div className="profile-panel">
      <span className="eyebrow">Игрок каруты</span>
      <button
        className={`profile-avatar${avatarCard ? ' has-art' : ''}`}
        type="button"
        aria-label={avatarCard ? 'Посмотреть аватар крупнее' : 'Выбрать аватар'}
        onClick={() => avatarCard ? setIsAvatarOpen(true) : onOpenCollection()}
      >
        {avatarCard ? <RewardArtwork card={avatarCard} /> : <span>🌸</span>}
      </button>
      <h3>{player?.username}</h3>
      <button className="ghost-button change-avatar-button" type="button" onClick={onOpenCollection}>
        Сменить аватарку
      </button>
      <div className="profile-grid">
        <button className="profile-collection-link" onClick={onOpenCollection}>
          <span>Коллекция</span>
          <strong>{uniqueCardsCount}</strong>
          <i>Открыть →</i>
        </button>
      </div>
      <button className="ghost-button logout-button" onClick={signOut}>Выйти</button>
      <RewardLightbox card={isAvatarOpen ? avatarCard : null} onClose={() => setIsAvatarOpen(false)} />
    </div>
  )
}

export default ProfilePanel
