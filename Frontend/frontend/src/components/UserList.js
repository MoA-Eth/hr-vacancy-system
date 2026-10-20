import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api/users';
import Layout from './Layout';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const filters = filter !== 'all' ? { role: filter } : {};
      const data = await userAPI.getAll(filters);
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      if (isActive) {
        await userAPI.deactivate(userId);
      } else {
        await userAPI.activate(userId);
      }
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userAPI.delete(userId);
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const roleBadge = (role) => ({
    admin:       'badge badge-purple',
    recruiter:   'badge badge-blue',
    interviewer: 'badge badge-gray',
  }[role] || 'badge badge-gray');

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    </Layout>
  );
  if (error) return <Layout><div className="card p-6 text-red-600">{error}</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input w-36">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="interviewer">Interviewer</option>
          </select>
          <button onClick={() => navigate('/users/new')} className="btn-primary">+ Create User</button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No users found.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name','Username','Email','Role','Department','Status','Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">{u.first_name} {u.last_name}</td>
                  <td className="table-td text-gray-500">{u.username}</td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td"><span className={roleBadge(u.role)}>{u.role}</span></td>
                  <td className="table-td text-gray-500">{u.department_name || '—'}</td>
                  <td className="table-td">
                    <span className={u.is_active ? 'badge badge-green' : 'badge badge-red'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/users/${u.id}`)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={u.is_active ? 'btn-ghost text-xs py-1 px-2 text-yellow-600' : 'btn-ghost text-xs py-1 px-2 text-green-600'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="btn-danger text-xs py-1 px-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default UserList;
