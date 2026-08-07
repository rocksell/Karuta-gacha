import { useAuth } from '../hooks/useAuth'
import { usePlayerData } from '../context/PlayerDataContext'
import { isArtReward } from '../lib/gachaRewards'

const ProfilePanel = ({ onOpenCollection }) => {
  const { signOut } = useAuth()
  const { player, collection } = usePlayerData()
  const uniqueCardsCount = new Set(
    (collection || []).filter(isArtReward).map(card => card.card_id)
  ).size

  return (
    <div className="profile-panel">
      <span className="eyebrow">Игрок каруты</span>
      <h3>{player?.username}</h3>
      <div className="profile-grid">
        <button className="profile-collection-link" onClick={onOpenCollection}>
          <span>Коллекция</span>
          <strong>{uniqueCardsCount}</strong>
          <i>Открыть →</i>
        </button>
      </div>
      <button className="ghost-button logout-button" onClick={signOut}>Выйти</button>
    </div>
  )
}

export default ProfilePanel
