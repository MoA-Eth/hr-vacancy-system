import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { interviewAPI } from '../api/interviews';
import { AuthContext } from '../context/AuthContext';
import Layout from './Layout';

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchApplicationDetail();
  }, [id]);

  const fetchApplicationDetail = async () => {
    try {
      const data = await applicationAPI.getById(id);
      setApplication(data);
      
      // Fetch interviews for this application
      const interviewData = await interviewAPI.getAll({ application: id });
      setInterviews(interviewData);
    } catch (err) {
      setError('Failed to load application details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await applicationAPI.updateStatus(id, newStatus);
      fetchApplicationDetail();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: '#ff9800',
      shortlisted: '#2196f3',
      interview: '#9c27b0',
      offer: '#4caf50',
      hired: '#388e3c',
      rejected: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusProgress = (status) => {
    const steps = ['applied', 'shortlisted', 'interview', 'offer', 'hired'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature - integrate with PDF library');
  };

  const statusBadge = (s) => ({
    applied:     'badge badge-yellow',
    shortlisted: 'badge badge-blue',
    interview:   'badge badge-purple',
    offer:       'badge badge-green',
    hired:       'badge badge-green',
    rejected:    'badge badge-red',
  }[s] || 'badge badge-gray');

  const steps = ['applied','shortlisted','interview','offer','hired'];

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
  if (!application) return <Layout><div className="card p-6 text-red-600">Application not found</div></Layout>;

  const infoRow = (label, value) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-xs text-gray-900 text-right max-w-xs">{value || '—'}</span>
    </div>
  );

  return (
    <Layout>
      {/* Top bar */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700">
            {getInitials(application.candidate.full_name)}
          </div>
          <div>
            <h1 className="page-title">{application.candidate.full_name}</h1>
            <p className="text-sm text-gray-500">Applying for <span className="font-medium text-gray-700">{application.vacancy.title}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== 'interviewer' && (
            <select value={application.status} onChange={(e) => handleStatusChange(e.target.value)} className="form-input w-36">
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
          <span className={statusBadge(application.status)}>{application.status}</span>
          <button onClick={() => navigate('/applications')} className="btn-secondary">← Back</button>
        </div>
      </div>

      {/* Progress steps */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-1">
          {steps.map((step, i) => {
            const idx = steps.indexOf(application.status);
            const active = i <= idx && application.status !== 'rejected';
            return (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-1.5 flex-1 ${ i > 0 ? '' : '' }`}>
                  {i > 0 && <div className={`flex-1 h-0.5 ${ active ? 'bg-primary-400' : 'bg-gray-200' }`} />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    active ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>{i + 1}</div>
                  <span className={`text-xs capitalize hidden sm:block ${ active ? 'text-primary-600 font-medium' : 'text-gray-400' }`}>{step}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {[['overview','Overview'],['education','Education'],['documents','Documents'],['interviews',`Interviews (${interviews.length})`]].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Candidate Information</h2>
            {infoRow('Full Name', application.candidate.full_name)}
            {infoRow('Email', application.candidate.email)}
            {infoRow('Phone', application.candidate.phone)}
            {infoRow('Address', [
              application.candidate.state,
              application.candidate.zone,
              application.candidate.woreda,
              application.candidate.kebele,
              application.candidate.house_number && `House No. ${application.candidate.house_number}`,
            ].filter(Boolean).join(', '))}
            {infoRow('Date of Birth', application.candidate.date_of_birth ? new Date(application.candidate.date_of_birth).toLocaleDateString() : null)}
            {infoRow('Nationality', application.candidate.nationality)}
            {infoRow('Reference', application.reference_code)}
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Vacancy Information</h2>
            {infoRow('Position', application.vacancy.title)}
            {infoRow('Department', application.vacancy.department_name)}
            {infoRow('Location', application.vacancy.location)}
            {infoRow('Type', application.vacancy.employment_type?.replace(/_/g,' '))}
            {infoRow('Workplace', application.vacancy.workplace_type?.replace(/_/g,' '))}
            {infoRow('Experience', application.vacancy.experience_level?.replace(/_/g,' '))}
          </div>
          {application.candidate.cover_letter && (
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Cover Letter</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{application.candidate.cover_letter}</p>
            </div>
          )}
        </div>
      )}

      {/* Education */}
      {activeTab === 'education' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Education</h2>
            {application.candidate.education_history?.length > 0 ? (
              <div className="space-y-3">
                {application.candidate.education_history.map((edu, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{edu.degree || edu.institution || '—'}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {[edu.start_date, edu.end_date].filter(Boolean).join(' — ') || edu.year_of_graduation || '—'}
                      </span>
                    </div>
                    {edu.institution && <p className="text-xs text-gray-500">{edu.institution}</p>}
                    {edu.field_of_study && <p className="text-xs text-gray-400">Field: {edu.field_of_study}</p>}
                    {edu.grade && <p className="text-xs text-gray-400">Grade/CGPA: <span className="font-medium text-gray-600">{edu.grade}</span></p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No education information provided</p>}
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Training & Certifications</h2>
            {application.candidate.training_history?.length > 0 ? (
              <div className="space-y-3">
                {application.candidate.training_history.map((t, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{t.degree || t.course_name || t.title || '—'}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {[t.start_date, t.end_date].filter(Boolean).join(' — ') || t.year || t.completion_date || '—'}
                      </span>
                    </div>
                    {(t.field_of_study || t.institution || t.provider) && (
                      <p className="text-xs text-gray-500">{t.field_of_study || t.institution || t.provider}</p>
                    )}
                    {t.grade && <p className="text-xs text-gray-400">Grade/CGPA: <span className="font-medium text-gray-600">{t.grade}</span></p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No training information provided</p>}
          </div>
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Uploaded Documents</h2>
          <div className="space-y-3">
            {[
              { label: 'Resume/CV', url: application.candidate.resume },
              { label: 'Education Documents', url: application.candidate.education_documents },
              { label: 'Other Documents', url: application.candidate.other_documents },
            ].filter(d => d.url).map(doc => (
              <div key={doc.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1 px-3">Download</a>
              </div>
            ))}
            {!application.candidate.resume && !application.candidate.education_documents && !application.candidate.other_documents && (
              <p className="text-sm text-gray-400">No documents uploaded</p>
            )}
          </div>
        </div>
      )}

      {/* Interviews */}
      {activeTab === 'interviews' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Interviews</h2>
            {user?.role !== 'interviewer' && (
              <button onClick={() => navigate(`/applications/${id}/schedule-interview`)} className="btn-primary">+ Schedule</button>
            )}
          </div>
          {interviews.length === 0 ? (
            <p className="text-sm text-gray-400">No interviews scheduled yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((iv) => (
                <div key={iv.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold">Round {iv.round_number}</p>
                    <span className={iv.result === 'passed' ? 'badge badge-green' : iv.result === 'failed' ? 'badge badge-red' : 'badge badge-gray'}>{iv.result || 'Pending'}</span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(iv.scheduled_at).toLocaleString()}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Interviewer:</span> {iv.interviewer_name}</p>
                    <p><span className="font-medium">Mode:</span> {iv.mode}</p>
                    {iv.location_or_link && <p><span className="font-medium">Location:</span> {iv.location_or_link}</p>}
                    {iv.score !== null && <p><span className="font-medium">Score:</span> {iv.score}/10</p>}
                  </div>
                  {iv.feedback && <p className="text-xs text-gray-600 italic border-t pt-2">{iv.feedback}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default ApplicationDetail;
