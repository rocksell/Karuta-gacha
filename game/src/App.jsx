import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePlayerData } from './context/PlayerDataContext';
import { LoginPage } from './components/LoginPage';
import GachaPage from './components/GachaPage';
import Achievements from './pages/Achievements';
import AdminPage from './pages/AdminPage';
import CollectionPage from './pages/CollectionPage';
import ReadingPage from './pages/ReadingPage';
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
    <div className="app-shell">
      <header className="app-header">
        <button className="brand brand-home-button" onClick={() => setPage('gacha')} aria-label="Перейти на главную">
          <span className="brand-mark">か</span>
          <span>
            Кёги Карута
            <small className="brand-kana">競技かるた</small>
          </span>
        </button>
        <div className="header-actions">
          <button className={`header-reading-button ${page === 'reading' ? 'is-active' : ''}`} onClick={() => setPage('reading')}>
            <span>♪</span> Чтение
          </button>
          {player?.role === 'admin' && (
            <button className="ghost-button admin-button" onClick={() => setPage('admin')}>Админ</button>
          )}
          <ProfileButton
            onGetPetals={() => setPage('achievements')}
            onOpenCollection={() => setPage('collection')}
          />
        </div>
      </header>
      {loading ? (
        <div className="loading-screen"><span className="loading-flower">🌸</span></div>
      ) : (
        <>
          {page === 'gacha' && <GachaPage />}
          {page === 'achievements' && <Achievements setPage={setPage} />}
          {page === 'collection' && <CollectionPage setPage={setPage} />}
          {page === 'reading' && <ReadingPage />}
          {page === 'admin' && <AdminPage setPage={setPage} />}
        </>
      )}
    </div>
  );
}

export default App;
