import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentAPI } from '../api/departments';
import Layout from './Layout';

export default function DepartmentList() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentAPI.getAll();
      setDepartments(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (dept) => {
    try {
      await departmentAPI.update(dept.id, { is_active: !dept.is_active });
      setDepartments(prev =>
        prev.map(d => d.id === dept.id ? { ...d, is_active: !d.is_active } : d)
      );
    } catch {
      setError('Failed to update department status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await departmentAPI.delete(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Cannot delete department — it may have users or vacancies assigned.');
      setConfirmDelete(null);
    }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{departments.length} department{departments.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/departments/new')} className="btn-primary">
          + New Department
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Search */}
      <div className="card p-4 mb-5">
        <input
          type="text"
          className="form-input max-w-xs"
          placeholder="Search departments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">{search ? 'No departments match your search.' : 'No departments yet.'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Description</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(dept => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium text-gray-900">{dept.name}</td>
                  <td className="table-td text-gray-500 max-w-xs truncate">{dept.description || '—'}</td>
                  <td className="table-td">
                    <button
                      onClick={() => handleToggleActive(dept)}
                      className={`badge cursor-pointer transition-colors ${
                        dept.is_active ? 'badge-green hover:bg-green-200' : 'badge-gray hover:bg-gray-200'
                      }`}
                    >
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="table-td text-gray-400">
                    {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/departments/${dept.id}/edit`)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(dept)}
                        className="btn-danger text-xs py-1 px-3"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Department</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
