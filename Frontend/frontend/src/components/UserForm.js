import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../api/users';
import { departmentAPI } from '../api/departments';
import Layout from './Layout';

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'recruiter',
    department: '',
    is_active: true
  });

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  useEffect(() => {
    departmentAPI.getAll()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  const fetchUser = async () => {
    try {
      const data = await userAPI.getById(id);
      setFormData({
        username: data.username,
        email: data.email,
        password: '', // Don't populate password
        password2: '',
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        department: data.department ? String(data.department) : '',
        is_active: data.is_active
      });
    } catch (err) {
      setError('Failed to load user');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };
      
      // Validate passwords match (only for create or if password is being changed)
      if (!isEditMode || submitData.password) {
        if (submitData.password !== submitData.password2) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
      }
      
      // Remove password fields if empty in edit mode
      if (isEditMode && !submitData.password) {
        delete submitData.password;
        delete submitData.password2;
      }

      if (isEditMode) {
        await userAPI.update(id, submitData);
      } else {
        await userAPI.create(submitData);
      }
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.password?.[0] || 'Failed to save user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">{isEditMode ? 'Edit User' : 'Create New User'}</h1>
          <button onClick={() => navigate('/users')} className="btn-secondary">← Back</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input type="text" name="first_name" className="form-input" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input type="text" name="last_name" className="form-input" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="form-label">Username *</label>
            <input type="text" name="username" className="form-input" value={formData.username} onChange={handleChange} required />
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Password {!isEditMode && '*'}</label>
              <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required={!isEditMode} minLength="8" placeholder={isEditMode ? 'Leave blank to keep' : ''} />
            </div>
            <div>
              <label className="form-label">Confirm Password {!isEditMode && '*'}</label>
              <input type="password" name="password2" className="form-input" value={formData.password2} onChange={handleChange} required={!isEditMode} minLength="8" placeholder={isEditMode ? 'Leave blank to keep' : ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Role *</label>
              <select name="role" className="form-input" value={formData.role} onChange={handleChange} required>
                <option value="recruiter">Recruiter</option>
                <option value="interviewer">Interviewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="form-label">Department{formData.role === 'recruiter' && ' *'}</label>
              <select name="department" className="form-input" value={formData.department} onChange={handleChange} required={formData.role === 'recruiter'}>
                <option value="">No department</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
              {formData.role === 'recruiter' && <p className="form-error">Required for recruiters</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Active User</span>
          </label>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
            </button>
            <button type="button" onClick={() => navigate('/users')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default UserForm;
