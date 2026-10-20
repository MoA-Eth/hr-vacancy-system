import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { departmentAPI } from '../api/departments';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    departmentAPI.getAll()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'recruiter',
    department: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card p-10 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500">Your account has been created. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">HR Vacancy System</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="form-label">Password *</label>
                <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength="8" />
              </div>
              <div>
                <label className="form-label">Confirm Password *</label>
                <input type="password" name="password2" className="form-input" value={formData.password2} onChange={handleChange} required minLength="8" />
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
                <label className="form-label">Department</label>
                <select name="department" className="form-input" value={formData.department} onChange={handleChange}>
                  <option value="">No department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={String(dept.id)}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
