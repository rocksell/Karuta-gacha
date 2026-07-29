import { useAuth } from '../hooks/useAuth'
import { usePlayerData } from '../context/PlayerDataContext'

const ProfilePanel = () => {
  const { signOut } = useAuth()
  const { player, gachaProgress, collection } = usePlayerData()

  return (
    <div className="profile-panel">
      <span className="eyebrow">Игрок каруты</span>
      <h3>{player?.username}</h3>
      <div className="profile-grid">
        <p><span>Уровень</span><strong>1</strong></p>
        <p><span>Прочитано</span><strong>{gachaProgress?.total_wishes ?? 0}</strong></p>
        <p><span>Коллекция</span><strong>{collection?.length ?? 0}</strong></p>
      </div>
      <button className="ghost-button logout-button" onClick={signOut}>Выйти</button>
    </div>
  )
}

export default ProfilePanel
