import { useState } from 'react'
import ProfilePanel from './ProfilePanel'

const ProfileButton = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div style={{ position: 'absolute', top: 10, right: 10 }}>
      <button onClick={() => setIsPanelOpen(!isPanelOpen)}>Profile</button>
      {isPanelOpen && <ProfilePanel />}
    </div>
  )
}

export default ProfileButton
