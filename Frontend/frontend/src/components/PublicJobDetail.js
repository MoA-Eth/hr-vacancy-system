import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import Header from './Header';
import './PublicJobDetail.css';

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

  if (loading) return <div className="loading">Loading job details...</div>;
  if (error) return (
    <div className="error-container">
      <Header />
      <div className="error-message">
        <h2>{error}</h2>
        <button onClick={() => navigate('/jobs')} className="btn-back">
          ← Back to Jobs
        </button>
      </div>
    </div>
  );
  if (!vacancy) return null;

  const isDeadlinePassed = new Date(vacancy.deadline) < new Date();
  const daysRemaining = Math.ceil((new Date(vacancy.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="public-job-detail-container">
      <Header />
      
      <div className="job-detail-content">
        {/* Back Button */}
        <button onClick={() => navigate('/jobs')} className="btn-back-simple">
          ← Back to All Jobs
        </button>

        {/* Job Header */}
        <div className="job-header-section">
          <div className="job-header-left">
            <h1 className="job-title">{vacancy.title}</h1>
            <div className="job-meta-info">
              <span className="meta-item">
                <span className="meta-icon">🏢</span>
                {vacancy.department}
              </span>
              <span className="meta-item">
                <span className="meta-icon">📍</span>
                {vacancy.location}
              </span>
              <span className="meta-item">
                <span className="meta-icon">💼</span>
                {formatLabel(vacancy.employment_type)}
              </span>
              {vacancy.workplace_type && (
                <span className="meta-item">
                  <span className="meta-icon">🏠</span>
                  {formatLabel(vacancy.workplace_type)}
                </span>
              )}
            </div>
            <div className="job-tags-detail">
              {vacancy.experience_level && (
                <span className="tag-detail tag-experience">
                  {formatLabel(vacancy.experience_level)}
                </span>
              )}
              {vacancy.category && (
                <span className="tag-detail tag-category">
                  {formatLabel(vacancy.category)}
                </span>
              )}
              <span className="tag-detail tag-positions">
                {vacancy.positions_available} Position{vacancy.positions_available > 1 ? 's' : ''} Available
              </span>
            </div>
          </div>

          <div className="job-header-right">
            <div className="salary-box">
              <span className="salary-label">Salary Range</span>
              <span className="salary-amount">
                {formatSalary(vacancy.min_salary, vacancy.max_salary)}
              </span>
            </div>
            <div className={`deadline-box ${isDeadlinePassed ? 'expired' : daysRemaining <= 3 ? 'urgent' : ''}`}>
              {isDeadlinePassed ? (
                <>
                  <span className="deadline-icon">🚫</span>
                  <div>
                    <span className="deadline-label">Deadline Passed</span>
                    <span className="deadline-date">{new Date(vacancy.deadline).toLocaleDateString()}</span>
                  </div>
                </>
              ) : daysRemaining <= 3 ? (
                <>
                  <span className="deadline-icon">⚠️</span>
                  <div>
                    <span className="deadline-label">Closing Soon</span>
                    <span className="deadline-date">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="deadline-icon">⏰</span>
                  <div>
                    <span className="deadline-label">Apply Before</span>
                    <span className="deadline-date">{new Date(vacancy.deadline).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Apply Button Section */}
        <div className="apply-section">
          {isDeadlinePassed ? (
            <button className="btn-apply-large disabled" disabled>
              Application Closed
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/apply/${vacancy.id}`)}
              className="btn-apply-large"
            >
              Apply for this Position →
            </button>
          )}
        </div>

        {/* Job Details */}
        <div className="job-details-grid">
          {/* Description */}
          {vacancy.description && (
            <div className="detail-card">
              <h2 className="detail-title">
                <span className="title-icon">📋</span>
                Job Description
              </h2>
              <div className="detail-content">
                <p className="detail-text">{vacancy.description}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {vacancy.requirements && (
            <div className="detail-card">
              <h2 className="detail-title">
                <span className="title-icon">✅</span>
                Requirements
              </h2>
              <div className="detail-content">
                <p className="detail-text whitespace-pre-line">{vacancy.requirements}</p>
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {vacancy.responsibilities && (
            <div className="detail-card">
              <h2 className="detail-title">
                <span className="title-icon">💡</span>
                Responsibilities
              </h2>
              <div className="detail-content">
                <p className="detail-text whitespace-pre-line">{vacancy.responsibilities}</p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="detail-card">
            <h2 className="detail-title">
              <span className="title-icon">ℹ️</span>
              Additional Information
            </h2>
            <div className="detail-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Posted On:</span>
                  <span className="info-value">{new Date(vacancy.created_at).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employment Type:</span>
                  <span className="info-value">{formatLabel(vacancy.employment_type)}</span>
                </div>
                {vacancy.workplace_type && (
                  <div className="info-item">
                    <span className="info-label">Work Mode:</span>
                    <span className="info-value">{formatLabel(vacancy.workplace_type)}</span>
                  </div>
                )}
                {vacancy.experience_level && (
                  <div className="info-item">
                    <span className="info-label">Experience Level:</span>
                    <span className="info-value">{formatLabel(vacancy.experience_level)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Apply Section */}
        <div className="apply-section-bottom">
          <div className="apply-cta">
            <h3>Interested in this position?</h3>
            <p>Submit your application now and join our team!</p>
            {isDeadlinePassed ? (
              <button className="btn-apply-large disabled" disabled>
                Application Closed
              </button>
            ) : (
              <button 
                onClick={() => navigate(`/apply/${vacancy.id}`)}
                className="btn-apply-large"
              >
                Apply Now →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicJobDetail;
