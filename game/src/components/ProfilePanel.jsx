import { useAuth } from '../hooks/useAuth'
import { usePlayerData } from '../hooks/usePlayerData'

const ProfilePanel = () => {
  const { signOut } = useAuth()
  const { player, gachaProgress, collection } = usePlayerData()

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        right: 0,
        width: 200,
        border: '1px solid black',
        padding: 10,
        backgroundColor: 'white',
      }}
    >
      <p>Username: {player?.username}</p>
      <p>Player level: 1</p> {/* Hardcoded for now */}
      <p>Total wishes: {gachaProgress?.total_wishes}</p>
      <p>Collection progress: {collection?.length} cards</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}

export default ProfilePanel
