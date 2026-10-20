import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { interviewAPI } from '../api/interviews';
import Layout from './Layout';

function ScheduleInterview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    scheduled_at: '',
    mode: 'in_person',
    location_or_link: '',
    round_number: 1
  });

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const data = await applicationAPI.getById(applicationId);
      setApplication(data);
    } catch (err) {
      setError('Failed to load application');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await interviewAPI.create({
        application: applicationId,
        ...formData
      });
      navigate(`/applications/${applicationId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  if (!application) return (
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
      <div className="max-w-xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Schedule Interview</h1>
          <button onClick={() => navigate(`/applications/${applicationId}`)} className="btn-secondary">← Back</button>
        </div>

        <div className="card p-4 mb-5 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-gray-900">{application.candidate.full_name}</p>
          <p className="text-xs text-gray-500">Applying for: {application.vacancy.title}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date & Time *</label>
              <input type="datetime-local" name="scheduled_at" className="form-input" value={formData.scheduled_at} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Round *</label>
              <input type="number" name="round_number" className="form-input" value={formData.round_number} onChange={handleChange} min="1" required />
            </div>
          </div>

          <div>
            <label className="form-label">Interview Mode *</label>
            <select name="mode" className="form-input" value={formData.mode} onChange={handleChange} required>
              <option value="in_person">In Person</option>
              <option value="video_call">Video Call</option>
              <option value="phone_call">Phone Call</option>
            </select>
          </div>

          <div>
            <label className="form-label">{formData.mode === 'in_person' ? 'Location' : 'Meeting Link'} *</label>
            <input type="text" name="location_or_link" className="form-input" value={formData.location_or_link} onChange={handleChange} placeholder={formData.mode === 'in_person' ? 'Office address' : 'https://...'} required />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
            <button type="button" onClick={() => navigate(`/applications/${applicationId}`)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default ScheduleInterview;
