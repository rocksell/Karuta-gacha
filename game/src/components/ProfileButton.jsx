import { useState } from 'react'
import ProfilePanel from './ProfilePanel'

const ProfileButton = ({ onGetPetals }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div className="profile-actions">
      <button className="petals-button" onClick={onGetPetals}>
        <span className="petals-plus">+</span>
        <span className="petals-label">Получить лепестки</span>
      </button>
      <div className="profile-wrap">
        <button className="profile-trigger" aria-label="Открыть профиль" onClick={() => setIsPanelOpen(!isPanelOpen)}>
          <span>🌸</span>
        </button>
        {isPanelOpen && <ProfilePanel />}
      </div>
    </div>
  )
}

export default ProfileButton
