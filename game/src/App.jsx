import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePlayerData } from './context/PlayerDataContext';
import { LoginPage } from './components/LoginPage';
import GachaPage from './components/GachaPage';
import Achievements from './pages/Achievements';
import AdminPage from './pages/AdminPage';
import ProfileButton from './components/ProfileButton';
import './App.css';

function App() {
  const { session } = useAuth();
  const { loading, player } = usePlayerData();
  const [page, setPage] = useState('gacha');

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div>
      <ProfileButton />
      {player?.role === 'admin' && (
        <button onClick={() => setPage('admin')}>Admin</button>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {page === 'gacha' && <GachaPage setPage={setPage} />}
          {page === 'achievements' && <Achievements setPage={setPage} />}
          {page === 'admin' && <AdminPage setPage={setPage} />}
        </>
      )}
    </div>
  );
}

export default App;
