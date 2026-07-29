import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ManageRewards from '../components/ManageRewards';

const AdminPage = ({ setPage }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('players').select('*');
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <h2>Admin - User Management</h2>
      <button onClick={() => setPage('gacha')}>Back to Gacha</button>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => setSelectedUser(user)}>Manage Rewards</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedUser && (
        <ManageRewards user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default AdminPage;
