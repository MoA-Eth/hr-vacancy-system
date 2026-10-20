import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { departmentAPI } from '../api/departments';
import Layout from './Layout';

export default function DepartmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      departmentAPI.getById(id)
        .then(data => setFormData({ name: data.name, description: data.description || '', is_active: data.is_active ?? true }))
        .catch(() => setError('Failed to load department'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await departmentAPI.update(id, formData);
      } else {
        await departmentAPI.create(formData);
      }
      navigate('/departments');
    } catch (err) {
      const data = err.response?.data;
      if (data?.name) setFieldErrors({ name: data.name[0] });
      else setError(data?.detail || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Department' : 'New Department'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Update department details' : 'Create a new department'}</p>
        </div>
        <button onClick={() => navigate('/departments')} className="btn-secondary">
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="card p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              className={`form-input ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Engineering, Human Resources"
              maxLength={100}
            />
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Optional description of this department's responsibilities"
            />
          </div>

          {/* Status */}
          <div>
            <label className="form-label">Status</label>
            <div className="flex gap-6 mt-1">
              {[true, false].map(val => (
                <label key={String(val)} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    className="w-4 h-4"
                    checked={formData.is_active === val}
                    onChange={() => setFormData(p => ({ ...p, is_active: val }))}
                  />
                  {val ? 'Active' : 'Inactive'}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Inactive departments are hidden from dropdowns.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/departments')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
