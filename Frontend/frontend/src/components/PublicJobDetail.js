import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import Header from './Header';

function PublicJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const data = await vacancyAPI.getPublicById(id);
      setVacancy(data);
    } catch (err) {
      setError('Job not found or no longer available');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (value) => {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => navigate('/jobs')} className="btn-secondary">← Back to Jobs</button>
      </div>
    </div>
  );
  if (!vacancy) return null;

  const isDeadlinePassed = new Date(vacancy.deadline) < new Date();
  const daysRemaining = Math.ceil((new Date(vacancy.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero banner */}
      <div className="bg-primary-600 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-primary-100 hover:text-white text-sm mb-5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Jobs
          </button>
          <h1 className="text-2xl font-bold mb-1">{vacancy.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-primary-100 text-sm mt-2">
            <span>{vacancy.department_name}</span>
            <span>{vacancy.location}</span>
            <span>{formatLabel(vacancy.employment_type)}</span>
            {vacancy.workplace_type && <span>{formatLabel(vacancy.workplace_type)}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-7 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Quick info bar */}
            <div className="card p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-gray-100">
                {[
                  { label: 'Salary', value: formatSalary(vacancy.min_salary, vacancy.max_salary) },
                  { label: 'Experience', value: formatLabel(vacancy.experience_level) || '—' },
                  { label: 'Positions', value: `${vacancy.positions_available} open` },
                  { label: 'Posted', value: new Date(vacancy.created_at).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="px-2">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {vacancy.description && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary-600 rounded-full inline-block"></span>
                  Job Description
                </h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{vacancy.description}</p>
              </div>
            )}

            {vacancy.responsibilities && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary-600 rounded-full inline-block"></span>
                  Responsibilities
                </h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{vacancy.responsibilities}</p>
              </div>
            )}

            {vacancy.requirements && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary-600 rounded-full inline-block"></span>
                  Requirements
                </h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{vacancy.requirements}</p>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <div className="w-64 flex-shrink-0 sticky top-20 space-y-4">
            <div className="card p-5">
              {/* Deadline */}
              <div className={`text-center mb-4 pb-4 border-b border-gray-100`}>
                {isDeadlinePassed ? (
                  <span className="badge badge-red text-sm px-3 py-1">Application Closed</span>
                ) : daysRemaining <= 3 ? (
                  <div>
                    <span className="badge badge-yellow text-sm px-3 py-1">⚠ Closing Soon</span>
                    <p className="text-xs text-gray-400 mt-1">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400">Deadline</p>
                    <p className="font-semibold text-gray-800">{new Date(vacancy.deadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(`/apply/${vacancy.id}`)}
                disabled={isDeadlinePassed}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {isDeadlinePassed ? 'Application Closed' : 'Apply Now →'}
              </button>

              {!isDeadlinePassed && (
                <p className="text-xs text-center text-gray-400 mt-2">Takes about 5–10 minutes</p>
              )}
            </div>

            {/* Tags */}
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</p>
              {[
                { label: 'Department', value: vacancy.department_name },
                { label: 'Location', value: vacancy.location },
                { label: 'Type', value: formatLabel(vacancy.employment_type) },
                vacancy.workplace_type && { label: 'Work Mode', value: formatLabel(vacancy.workplace_type) },
                vacancy.experience_level && { label: 'Experience', value: formatLabel(vacancy.experience_level) },
                vacancy.category && { label: 'Category', value: formatLabel(vacancy.category) },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-700 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} HR Portal. All rights reserved.
      </footer>
    </div>
  );
}

export default PublicJobDetail;
