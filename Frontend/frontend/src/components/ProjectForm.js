import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectAPI } from '../api/projects';
import { departmentAPI } from '../api/departments';
import Layout from './Layout';

function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    is_active: true,
  });

  useEffect(() => {
    departmentAPI.getAll()
      .then(setDepartments)
      .catch(() => console.error('Failed to load departments'));
  }, []);

  useEffect(() => {
    if (isEditMode) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await projectAPI.getById(id);
      setFormData({
        name: data.name,
        description: data.description || '',
        department: data.department ? String(data.department) : '',
        is_active: data.is_active,
      });
    } catch {
      setError('Failed to load project');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        department: formData.department || null,
        is_active: formData.is_active,
      };
      if (isEditMode) {
        await projectAPI.update(id, payload);
      } else {
        await projectAPI.create(payload);
      }
      navigate('/projects');
    } catch (err) {
      setError(
        err.response?.data?.name?.[0] ||
        err.response?.data?.department?.[0] ||
        'Failed to save project'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">{isEditMode ? 'Edit Project' : 'Create New Project'}</h1>
          <button onClick={() => navigate('/projects')} className="btn-secondary">← Back</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Digital Transformation Initiative"
            />
          </div>

          <div>
            <label className="form-label">Department *</label>
            <select
              name="department"
              className="form-input"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description of the project"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Active Project</span>
          </label>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Project' : 'Create Project')}
            </button>
            <button type="button" onClick={() => navigate('/projects')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default ProjectForm;
