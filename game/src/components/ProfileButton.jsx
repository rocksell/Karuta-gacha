import { useState } from 'react'
import ProfilePanel from './ProfilePanel'
import RewardArtwork from './RewardArtwork'
import { usePlayerData } from '../context/PlayerDataContext'

const ProfileButton = ({ onGetPetals, onOpenCollection }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const { player } = usePlayerData()
  const avatarCard = player?.avatar ? { card_id: player.avatar } : null

  return (
    <div className="profile-actions">
      <button className="petals-button" onClick={onGetPetals}>
        <span className="petals-plus">+</span>
        <span className="petals-label">Получить лепестки</span>
      </button>
      <div className="profile-wrap">
        <button className="profile-trigger" aria-label="Открыть профиль" onClick={() => setIsPanelOpen(!isPanelOpen)}>
          {avatarCard ? <RewardArtwork card={avatarCard} /> : <span>🌸</span>}
        </button>
        {isPanelOpen && (
          <ProfilePanel
            onOpenCollection={() => {
              setIsPanelOpen(false)
              onOpenCollection()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ProfileButton
