import { useAuth } from '../hooks/useAuth'
import { usePlayerData } from '../context/PlayerDataContext'

const ProfilePanel = ({ onOpenCollection }) => {
  const { signOut } = useAuth()
  const { player, gachaProgress, collection } = usePlayerData()
  const uniqueCardsCount = new Set(
    (collection || []).filter(card => card.card_id?.startsWith('poem-')).map(card => card.card_id)
  ).size

  return (
    <div className="profile-panel">
      <span className="eyebrow">Игрок каруты</span>
      <h3>{player?.username}</h3>
      <div className="profile-grid">
        <p><span>Уровень</span><strong>1</strong></p>
        <p><span>Прочитано</span><strong>{gachaProgress?.total_wishes ?? 0}</strong></p>
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
