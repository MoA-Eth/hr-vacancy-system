import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import { candidateAPI, applicationAPI } from '../api/applications';
import Header from './Header';

function ApplyForm() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    state: '',
    zone: '',
    woreda: '',
    kebele: '',
    house_number: '',
    is_available: true,
    reference_name: '',
    reference_phone: '',
    reference_address: '',
    resume: null,
    education_documents: null,
    other_documents: null
  });

  const [educationHistory, setEducationHistory] = useState([
    { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }
  ]);
  const [trainingHistory, setTrainingHistory] = useState([
    { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }
  ]);

  useEffect(() => {
    fetchVacancy();
  }, [vacancyId]);

  const fetchVacancy = async () => {
    try {
      const data = await vacancyAPI.getPublicById(vacancyId);
      
      // Check if deadline has passed
      const deadlineDate = new Date(data.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        setError('Application deadline has passed for this vacancy');
        setVacancy(data); // Still set vacancy to show details
        return;
      }
      
      setVacancy(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load job details or vacancy not available');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: e.target.files[0] }));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...educationHistory];
    updated[index][field] = value;
    setEducationHistory(updated);
  };
  
  const handleTrainingChange = (index, field, value) => {
    const updated = [...trainingHistory];
    updated[index][field] = value;
    setTrainingHistory(updated);
  };

  const addEducationEntry = () => {
    setEducationHistory([...educationHistory, { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }]);
  };
  
  const addTrainingEntry = () => {
    setTrainingHistory([...trainingHistory, { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }]);
  };

  const removeEducationEntry = (index) => {
    if (educationHistory.length > 1) {
      const updated = educationHistory.filter((_, i) => i !== index);
      setEducationHistory(updated);
    }
  };

  const removeTrainingEntry = (index) => {
    if (trainingHistory.length > 1) {
      const updated = trainingHistory.filter((_, i) => i !== index);
      setTrainingHistory(updated);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
      if (!formData.phone.trim()) errors.phone = 'Phone is required';
      if (!formData.state.trim()) errors.state = 'State/Region is required';
    }
    
    if (step === 2) {
      if (educationHistory.length === 0 || !educationHistory[0].institution) {
        errors.education = 'At least one education entry is required';
      }
    }
    
    if (step === 3) {
      if (!formData.resume) {
        errors.resume = 'Resume/CV is required';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Prepare application data with flat candidate fields
      const applicationFormData = new FormData();
      applicationFormData.append('vacancy', vacancyId);
      applicationFormData.append('full_name', formData.full_name);
      applicationFormData.append('email', formData.email);
      applicationFormData.append('phone', formData.phone);
      applicationFormData.append('state', formData.state);
      if (formData.zone) applicationFormData.append('zone', formData.zone);
      if (formData.woreda) applicationFormData.append('woreda', formData.woreda);
      if (formData.kebele) applicationFormData.append('kebele', formData.kebele);
      if (formData.house_number) applicationFormData.append('house_number', formData.house_number);
      applicationFormData.append('is_available', formData.is_available);
      if (!formData.is_available) {
        if (formData.reference_name) applicationFormData.append('reference_name', formData.reference_name);
        if (formData.reference_phone) applicationFormData.append('reference_phone', formData.reference_phone);
        if (formData.reference_address) applicationFormData.append('reference_address', formData.reference_address);
      }
      if (educationHistory.length > 0 && educationHistory[0].institution) {
        applicationFormData.append('education_history', JSON.stringify(educationHistory));
      }
      if (trainingHistory.length > 0 && trainingHistory[0].degree) {
        applicationFormData.append('training_history', JSON.stringify(trainingHistory));
      }
      if (formData.resume) {
        applicationFormData.append('resume', formData.resume);
      }
      if (formData.education_documents) {
        applicationFormData.append('education_documents', formData.education_documents);
      }
      if (formData.other_documents) {
        applicationFormData.append('other_documents', formData.other_documents);
      }

      await applicationAPI.create(applicationFormData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/jobs');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Personal Info', 'Education', 'Documents', 'Review'];

  if (!vacancy) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-gray-600 mb-1">Thank you for applying for <strong>{vacancy.title}</strong>.</p>
        <p className="text-sm text-gray-400 mb-6">Check your email for confirmation and reference number.</p>
        <button onClick={() => navigate('/jobs')} className="btn-secondary">← Back to Jobs</button>
      </div>
    </div>
  );

  const isDeadlinePassed = vacancy && new Date(vacancy.deadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <button onClick={() => navigate('/jobs')} className="btn-ghost mb-4">← Back to Jobs</button>

        {/* Job banner */}
        <div className="card p-4 mb-5">
          <p className="font-semibold text-gray-900">{vacancy.title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-1">
            <span>{vacancy.location}</span>
            <span>{vacancy.employment_type?.replace(/_/g,' ')}</span>
            <span>{vacancy.department_name}</span>
            {vacancy.deadline && (
              <span className={isDeadlinePassed ? 'text-red-500' : ''}>
                Deadline: {new Date(vacancy.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isDeadlinePassed ? (
          <div className="card p-8 text-center">
            <p className="font-medium text-gray-700 mb-2">Application Deadline Has Passed</p>
            <p className="text-sm text-gray-500 mb-4">The deadline was {new Date(vacancy.deadline).toLocaleDateString()}.</p>
            <button onClick={() => navigate('/jobs')} className="btn-secondary">View Open Positions</button>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-6">
              {stepLabels.map((label, i) => {
                const step = i + 1;
                const done = currentStep > step;
                const active = currentStep === step;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && <div className={`flex-1 h-0.5 ${done ? 'bg-primary-400' : 'bg-gray-200'}`} />}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        done ? 'bg-primary-500 text-white' : active ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>{done ? '✓' : step}</div>
                      <span className={`text-xs hidden sm:block ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{label}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-800">{stepLabels[currentStep-1]}</h2>

              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input type="text" name="full_name" className={`form-input ${fieldErrors.full_name ? 'border-red-400' : ''}`} value={formData.full_name} onChange={handleChange} />
                    {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Email *</label>
                      <input type="email" name="email" className={`form-input ${fieldErrors.email ? 'border-red-400' : ''}`} value={formData.email} onChange={handleChange} />
                      {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
                    </div>
                    <div>
                      <label className="form-label">Phone *</label>
                      <input type="tel" name="phone" className={`form-input ${fieldErrors.phone ? 'border-red-400' : ''}`} value={formData.phone} onChange={handleChange} />
                      {fieldErrors.phone && <p className="form-error">{fieldErrors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">State/Region *</label>
                    <input type="text" name="state" className={`form-input ${fieldErrors.state ? 'border-red-400' : ''}`} value={formData.state} onChange={handleChange} placeholder="e.g., Addis Ababa, Oromia" />
                    {fieldErrors.state && <p className="form-error">{fieldErrors.state}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="form-label">Zone</label><input type="text" name="zone" className="form-input" value={formData.zone} onChange={handleChange} placeholder="Optional" /></div>
                    <div><label className="form-label">Woreda</label><input type="text" name="woreda" className="form-input" value={formData.woreda} onChange={handleChange} placeholder="Optional" /></div>
                    <div><label className="form-label">Kebele</label><input type="text" name="kebele" className="form-input" value={formData.kebele} onChange={handleChange} placeholder="Optional" /></div>
                    <div><label className="form-label">House No.</label><input type="text" name="house_number" className="form-input" value={formData.house_number} onChange={handleChange} placeholder="Optional" /></div>
                  </div>
                  <div>
                    <label className="form-label">Available at job location?</label>
                    <div className="flex gap-6 mt-1">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="radio" name="is_available" checked={formData.is_available === val} onChange={() => setFormData(p => ({...p, is_available: val}))} className="w-4 h-4" />
                          {val ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                  {!formData.is_available && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reference Information</p>
                      <div><label className="form-label">Reference Name *</label><input type="text" name="reference_name" className="form-input" value={formData.reference_name} onChange={handleChange} /></div>
                      <div><label className="form-label">Reference Phone *</label><input type="tel" name="reference_phone" className="form-input" value={formData.reference_phone} onChange={handleChange} /></div>
                      <div><label className="form-label">Reference Address *</label><textarea name="reference_address" className="form-input" value={formData.reference_address} onChange={handleChange} rows="2" /></div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {fieldErrors.education && <p className="form-error">{fieldErrors.education}</p>}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Education History</p>
                    <div className="space-y-3">
                      {educationHistory.map((edu, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Entry {i+1}</span>
                            {educationHistory.length > 1 && <button type="button" onClick={() => removeEducationEntry(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                          </div>
                          <input type="text" className="form-input" placeholder="Institution" value={edu.institution} onChange={(e) => handleEducationChange(i,'institution',e.target.value)} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input type="text" className="form-input" placeholder="Degree" value={edu.degree} onChange={(e) => handleEducationChange(i,'degree',e.target.value)} />
                            <input type="text" className="form-input" placeholder="Field of Study" value={edu.field_of_study} onChange={(e) => handleEducationChange(i,'field_of_study',e.target.value)} />
                            <input type="month" className="form-input" value={edu.start_date} onChange={(e) => handleEducationChange(i,'start_date',e.target.value)} />
                            <input type="month" className="form-input" value={edu.end_date} onChange={(e) => handleEducationChange(i,'end_date',e.target.value)} />
                          </div>
                          <input type="text" className="form-input" placeholder="Grade/GPA" value={edu.grade} onChange={(e) => handleEducationChange(i,'grade',e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addEducationEntry} className="btn-secondary mt-3 text-xs">+ Add Education</button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Training History</p>
                    <div className="space-y-3">
                      {trainingHistory.map((t, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Entry {i+1}</span>
                            {trainingHistory.length > 1 && <button type="button" onClick={() => removeTrainingEntry(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input type="text" className="form-input" placeholder="Training Name" value={t.degree} onChange={(e) => handleTrainingChange(i,'degree',e.target.value)} />
                            <input type="text" className="form-input" placeholder="Institution" value={t.field_of_study} onChange={(e) => handleTrainingChange(i,'field_of_study',e.target.value)} />
                            <input type="month" className="form-input" value={t.start_date} onChange={(e) => handleTrainingChange(i,'start_date',e.target.value)} />
                            <input type="month" className="form-input" value={t.end_date} onChange={(e) => handleTrainingChange(i,'end_date',e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addTrainingEntry} className="btn-secondary mt-3 text-xs">+ Add Training</button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {[
                    { name: 'resume', label: 'Resume/CV *', hint: null },
                    { name: 'education_documents', label: 'Education Documents', hint: 'Transcripts, certificates, diplomas' },
                    { name: 'other_documents', label: 'Other Documents (a cover letter, work experience credentials,certificates..etc)', hint: 'References, portfolio, certificates' },
                  ].map(({ name, label, hint }) => (
                    <div key={name}>
                      <label className="form-label">{label}</label>
                      <input type="file" name={name} onChange={handleFileChange} accept=".pdf,.doc,.docx" className={`form-input ${fieldErrors[name] ? 'border-red-400' : ''}`} />
                      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
                      {fieldErrors[name] && <p className="form-error">{fieldErrors[name]}</p>}
                      {formData[name] && <p className="text-xs text-green-600 mt-1">✓ {formData[name].name}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4 */}
              {currentStep === 4 && (
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Personal</p>
                    <p><span className="text-gray-400">Name:</span> {formData.full_name}</p>
                    <p><span className="text-gray-400">Email:</span> {formData.email}</p>
                    <p><span className="text-gray-400">Phone:</span> {formData.phone}</p>
                    <p><span className="text-gray-400">State:</span> {formData.state}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
                    {educationHistory.filter(e => e.institution).map((edu, i) => (
                      <p key={i}>{edu.degree || 'Degree'} — {edu.institution}</p>
                    ))}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</p>
                    {formData.resume && <p className="text-green-700">✓ {formData.resume.name}</p>}
                    {formData.education_documents && <p className="text-green-700">✓ {formData.education_documents.name}</p>}
                    {formData.other_documents && <p className="text-green-700">✓ {formData.other_documents.name}</p>}
                  </div>
                </div>
              )}

              {/* Nav */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                {currentStep > 1 ? (
                  <button type="button" onClick={prevStep} className="btn-secondary">← Previous</button>
                ) : <div />}
                {currentStep < 4 ? (
                  <button type="button" onClick={nextStep} className="btn-primary">Next →</button>
                ) : (
                  <button type="button" onClick={handleSubmit} className="btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ApplyForm;