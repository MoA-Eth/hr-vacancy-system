import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../api/categories';
import Layout from './Layout';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description, is_active: cat.is_active });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await categoryAPI.update(editing.id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.name?.[0] || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      alert('Failed to delete category. It may be in use by a vacancy.');
      setDeleteTarget(null);
    }
  };

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
        <h1 className="page-title">Category Management</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Category</button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          No categories yet. <button onClick={openCreate} className="text-primary-600 font-medium hover:underline">Add the first one</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Description', 'Vacancies', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">{cat.name}</td>
                  <td className="table-td text-gray-500 max-w-xs truncate">{cat.description || '—'}</td>
                  <td className="table-td">
                    <span className="badge badge-blue">{cat.vacancy_count}</span>
                  </td>
                  <td className="table-td">
                    <span className={cat.is_active ? 'badge badge-green' : 'badge badge-red'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(cat)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                      <button onClick={() => setDeleteTarget(cat)} className="btn-danger text-xs py-1 px-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {editing ? 'Edit Category' : 'Add Category'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Software Development"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Delete "{deleteTarget.name}"?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleDelete} className="btn-danger">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default CategoryList;
