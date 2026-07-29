import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ManageRewards from '../components/ManageRewards';

const AdminPage = ({ setPage }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('players').select('*');
      if (error) {
        console.error('Error fetching users:', error);
        setErrorMessage('Не удалось загрузить список игроков.');
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="admin-loading"><span>花</span><p>Открываем судейскую комнату…</p></div>;
  }

  const filteredUsers = users.filter((user) =>
    `${user.username ?? ''} ${user.role ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">運営本部 · Управление турниром</span>
          <h1>Судейская комната</h1>
          <p>Игроки, роли и особые награды весеннего турнира.</p>
        </div>
        <button className="ghost-button" onClick={() => setPage('gacha')}>← Вернуться на татами</button>
      </section>

      <section className="admin-stats">
        <article><span className="admin-stat-icon green">人</span><div><small>Всего игроков</small><strong>{users.length}</strong></div></article>
        <article><span className="admin-stat-icon pink">印</span><div><small>Администраторы</small><strong>{adminCount}</strong></div></article>
        <article><span className="admin-stat-icon cream">花</span><div><small>Сезон</small><strong>Сакура</strong></div></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="eyebrow">Реестр участников</span>
            <h2>Игроки</h2>
          </div>
          <label className="admin-search">
            <span>⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти игрока…"
              aria-label="Найти игрока"
            />
          </label>
        </div>

        {errorMessage && <p className="admin-error" role="alert">{errorMessage}</p>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Участник</th>
                <th>Роль</th>
                <th>ID игрока</th>
                <th><span className="sr-only">Действия</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="player-cell">
                      <span className="player-avatar">{(user.username || 'か').slice(0, 1).toUpperCase()}</span>
                      <div><strong>{user.username || 'Без имени'}</strong><small>Участник турнира</small></div>
                    </div>
                  </td>
                  <td><span className={`role-badge ${user.role === 'admin' ? 'is-admin' : ''}`}>{user.role === 'admin' ? 'Судья' : 'Игрок'}</span></td>
                  <td><code className="player-id">{user.id.slice(0, 8)}…</code></td>
                  <td>
                    <button className="reward-button" onClick={() => setSelectedUser(user)}>Награды <span>→</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="empty-players">🌸 Игроки не найдены</div>}
        </div>
      </section>
      {selectedUser && (
        <ManageRewards user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </main>
  );
};

export default AdminPage;
