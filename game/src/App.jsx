import { useAuth } from './hooks/useAuth'
import { usePlayerData } from './hooks/usePlayerData'
import { LoginPage } from './components/LoginPage'
import GachaPage from './components/GachaPage'
import ProfileButton from './components/ProfileButton'
import './App.css'

function App() {
  const { session } = useAuth()
  const { loading } = usePlayerData()

  if (!session) {
    return <LoginPage />
  }

  return (
    <div>
      <ProfileButton />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <GachaPage />
        </>
      )}
    </div>
  )
}

export default App
