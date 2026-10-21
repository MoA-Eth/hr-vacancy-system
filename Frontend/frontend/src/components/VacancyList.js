import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import Layout from './Layout';

function VacancyList() {
  const [vacancies, setVacancies] = useState([]);
  const [filteredVacancies, setFilteredVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    filterVacancies();
  }, [vacancies, searchTerm, statusFilter, departmentFilter]);

  const fetchVacancies = async () => {
    try {
      const data = await vacancyAPI.getAll();
      setVacancies(data);
    } catch (err) {
      setError('Failed to load vacancies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterVacancies = () => {
    let filtered = vacancies;

    // Search filter
    if (searchTerm) {
      const stripHtml = (html) => {
        if (!html) return '';
        return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
      };
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stripHtml(v.description).toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(v => v.department_name === departmentFilter);
    }

    setFilteredVacancies(filtered);
  };

  const getDepartments = () => {
    const departments = [...new Set(vacancies.map(v => v.department_name))];
    return departments.filter(d => d);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vacancy?')) {
      try {
        await vacancyAPI.delete(id);
        fetchVacancies();
      } catch (err) {
        alert('Failed to delete vacancy');
      }
    }
  };

  const statusClass = (s) => ({
    open:    'badge badge-green',
    filled:  'badge badge-blue',
    closed:  'badge badge-gray',
    draft:   'badge badge-yellow',
    on_hold: 'badge badge-purple',
  }[s] || 'badge badge-gray');

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
  if (error) return (
    <Layout><div className="card p-6 text-red-600">{error}</div></Layout>
  );

  return (
    <Layout>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Job Vacancies</h1>
        <button onClick={() => navigate('/vacancies/new')} className="btn-primary">
          + New Vacancy
        </button>
      </div>

      {/* Filters */}
      {vacancies.length > 0 && (
        <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-36">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="form-input w-44">
            <option value="all">All Departments</option>
            {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs text-gray-500 ml-auto">{filteredVacancies.length} / {vacancies.length}</span>
        </div>
      )}

      {vacancies.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-3">No vacancies found.</p>
          <button onClick={() => navigate('/vacancies/new')} className="btn-primary">Create your first vacancy</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVacancies.map((v) => (
            <div key={v.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 leading-snug">{v.title}</h3>
                <span className={statusClass(v.status)}>{v.status}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium text-gray-700">Dept:</span> {v.department_name || '—'}</p>
                <p><span className="font-medium text-gray-700">Location:</span> {v.location}</p>
                <p><span className="font-medium text-gray-700">Type:</span> {v.employment_type}</p>
                <p><span className="font-medium text-gray-700">Positions:</span> {v.positions_available}</p>
                <p><span className="font-medium text-gray-700">Deadline:</span> {new Date(v.deadline).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button onClick={() => navigate(`/vacancies/${v.id}/edit`)} className="btn-secondary flex-1">Edit</button>
                <button onClick={() => handleDelete(v.id)} className="btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default VacancyList;