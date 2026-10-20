import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import { departmentAPI } from '../api/departments';
import { AuthContext } from '../context/AuthContext';
import Layout from './Layout';

function VacancyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditMode = Boolean(id);
  const isRecruiter = user?.role === 'recruiter';
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    department: '',
    location: '',
    employment_type: 'full_time',
    workplace_type: 'on_site',
    experience_level: 'entry',
    category: 'other',
    salary_min: '',
    salary_max: '',
    positions_available: 1,
    deadline: '',
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchVacancy();
    }
  }, [id]);

  useEffect(() => {
    departmentAPI.getAll()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  useEffect(() => {
    if (isRecruiter && user?.department && !isEditMode) {
      setFormData(prev => ({ ...prev, department: String(user.department) }));
    }
  }, [isRecruiter, user, isEditMode]);

  const fetchVacancy = async () => {
    try {
      const data = await vacancyAPI.getById(id);
      setFormData({
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        department: data.department ? String(data.department) : '',
        location: data.location,
        employment_type: data.employment_type,
        workplace_type: data.workplace_type || 'on_site',
        experience_level: data.experience_level || 'entry',
        category: data.category || 'other',
        salary_min: data.salary_min || '',
        salary_max: data.salary_max || '',
        positions_available: data.positions_available,
        deadline: data.deadline,
        status: data.status
      });
    } catch (err) {
      setError('Failed to load vacancy');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await vacancyAPI.update(id, formData);
      } else {
        await vacancyAPI.create(formData);
      }
      navigate('/vacancies');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || (data?.department && [].concat(data.department).join(' ')) || 'Failed to save vacancy');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">{isEditMode ? 'Edit Vacancy' : 'Create New Vacancy'}</h1>
          <button onClick={() => navigate('/vacancies')} className="btn-secondary">← Back</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Job Title *</label>
              <input type="text" name="title" className="form-input" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Department *</label>
              <select name="department" className="form-input" value={formData.department} onChange={handleChange} disabled={isRecruiter} required>
                <option value="">Select a department</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
              {isRecruiter && <p className="form-error">Locked to your department</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Location *</label>
              <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Employment Type *</label>
              <select name="employment_type" className="form-input" value={formData.employment_type} onChange={handleChange} required>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Workplace Type *</label>
              <select name="workplace_type" className="form-input" value={formData.workplace_type} onChange={handleChange} required>
                <option value="on_site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="form-label">Experience Level *</label>
              <select name="experience_level" className="form-input" value={formData.experience_level} onChange={handleChange} required>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead/Manager</option>
              </select>
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select name="category" className="form-input" value={formData.category} onChange={handleChange} required>
                <option value="software">Software Development</option>
                <option value="project_management">Project Management</option>
                <option value="data">Data & Analytics</option>
                <option value="design">Design & UX</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="hr">Human Resources</option>
                <option value="finance">Finance & Accounting</option>
                <option value="operations">Operations</option>
                <option value="customer_service">Customer Service</option>
                <option value="engineering">Engineering</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Description *</label>
            <textarea name="description" className="form-input" value={formData.description} onChange={handleChange} rows="4" required />
          </div>
          <div>
            <label className="form-label">Requirements *</label>
            <textarea name="requirements" className="form-input" value={formData.requirements} onChange={handleChange} rows="4" required />
          </div>
          <div>
            <label className="form-label">Responsibilities *</label>
            <textarea name="responsibilities" className="form-input" value={formData.responsibilities} onChange={handleChange} rows="4" required />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Min Salary</label>
              <input type="number" name="salary_min" className="form-input" value={formData.salary_min} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <label className="form-label">Max Salary</label>
              <input type="number" name="salary_max" className="form-input" value={formData.salary_max} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <label className="form-label">Positions *</label>
              <input type="number" name="positions_available" className="form-input" value={formData.positions_available} onChange={handleChange} min="1" required />
            </div>
            <div>
              <label className="form-label">Deadline *</label>
              <input type="date" name="deadline" className="form-input" value={formData.deadline} onChange={handleChange} required />
            </div>
          </div>

          <div className="w-48">
            <label className="form-label">Status *</label>
            <select name="status" className="form-input" value={formData.status} onChange={handleChange} required>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="on_hold">On Hold</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Vacancy' : 'Create Vacancy')}
            </button>
            <button type="button" onClick={() => navigate('/vacancies')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default VacancyForm;