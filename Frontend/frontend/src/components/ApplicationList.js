import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { AuthContext } from '../context/AuthContext';
import Layout from './Layout';

function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, departmentFilter, dateFrom, dateTo, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredApplications]);

  const fetchApplications = async () => {
    try {
      const data = await applicationAPI.getAll();
      setApplications(data);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.vacancy_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(app => app.vacancy_department === departmentFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(app => new Date(app.applied_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(app => new Date(app.applied_at) <= new Date(dateTo));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.applied_at) - new Date(a.applied_at);
        case 'oldest':
          return new Date(a.applied_at) - new Date(b.applied_at);
        case 'name-asc':
          return a.candidate_name.localeCompare(b.candidate_name);
        case 'name-desc':
          return b.candidate_name.localeCompare(a.candidate_name);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Reference Code', 'Candidate Name', 'Email', 'Vacancy', 'Department', 'Status', 'Applied Date'];
    const csvData = filteredApplications.map(app => [
      app.reference_code,
      app.candidate_name,
      app.candidate_email,
      app.vacancy_title,
      app.vacancy_department,
      app.status,
      new Date(app.applied_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationAPI.updateStatus(appId, newStatus);
      fetchApplications();
    } catch (err) {
      alert('Failed to update application status');
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

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'applied').length,
      interview: applications.filter(a => a.status === 'interview').length,
      hired: applications.filter(a => a.status === 'hired').length
    };
  };

  const getDepartments = () => {
    const depts = [...new Set(applications.map(app => app.vacancy_department).filter(Boolean))];
    return depts.sort();
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const stats = getStats();
  const departments = getDepartments();

  const statusBadge = (s) => ({
    applied:     'badge badge-yellow',
    shortlisted: 'badge badge-blue',
    interview:   'badge badge-purple',
    offer:       'badge badge-green',
    hired:       'badge badge-green',
    rejected:    'badge badge-red',
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
  if (error) return <Layout><div className="card p-6 text-red-600">{error}</div></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-sm text-gray-500">Manage and review all candidate applications</p>
        </div>
        <button onClick={exportToCSV} className="btn-secondary" disabled={filteredApplications.length === 0}>
          Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total',      value: stats.total,     color: 'text-primary-600' },
          { label: 'Pending',    value: stats.pending,   color: 'text-yellow-600' },
          { label: 'Interview',  value: stats.interview, color: 'text-purple-600' },
          { label: 'Hired',      value: stats.hired,     color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {applications.length > 0 && (
        <div className="card p-4 mb-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search name, email, vacancy..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-9" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-36">
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="form-input w-44">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input w-36" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input w-36" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input w-36">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
            <button onClick={clearFilters} className="btn-ghost text-xs">Clear filters</button>
            <div className="ml-auto flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[['table','Table'],['cards','Cards']].map(([key,label]) => (
                <button key={key} onClick={() => setViewMode(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}>{label}</button>
              ))}
            </div>
            <span className="text-xs text-gray-500">{filteredApplications.length} results</span>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium text-gray-700">No Applications Yet</p>
          <p className="text-sm text-gray-400 mt-1">Applications will appear here once candidates start applying.</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No results match your filters.</p>
          <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Candidate','Email','Vacancy','Department','Date','Status','Actions'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {currentItems.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                            {getInitials(app.candidate_name)}
                          </div>
                          <span className="font-medium text-gray-900">{app.candidate_name}</span>
                        </div>
                      </td>
                      <td className="table-td text-gray-500">{app.candidate_email}</td>
                      <td className="table-td">{app.vacancy_title}</td>
                      <td className="table-td text-gray-500">{app.vacancy_department}</td>
                      <td className="table-td text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td className="table-td"><span className={statusBadge(app.status)}>{app.status}</span></td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/applications/${app.id}`)} className="btn-secondary text-xs py-1 px-2">View</button>
                          {user?.role !== 'interviewer' && (
                            <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className="form-input text-xs py-1 w-28">
                              <option value="applied">Applied</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interview">Interview</option>
                              <option value="offer">Offer</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentItems.map((app) => (
                <div key={app.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 flex-shrink-0">
                      {getInitials(app.candidate_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{app.candidate_name}</p>
                      <p className="text-xs text-gray-500 truncate">{app.candidate_email}</p>
                    </div>
                    <span className={statusBadge(app.status)}>{app.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-700">Vacancy:</span> {app.vacancy_title}</p>
                    <p><span className="font-medium text-gray-700">Dept:</span> {app.vacancy_department}</p>
                    <p><span className="font-medium text-gray-700">Applied:</span> {new Date(app.applied_at).toLocaleDateString()}</p>
                    <p><span className="font-medium text-gray-700">Ref:</span> {app.reference_code}</p>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                    <button onClick={() => navigate(`/applications/${app.id}`)} className="btn-secondary flex-1">View Details</button>
                    {user?.role !== 'interviewer' && (
                      <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className="form-input text-xs w-28">
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="form-input w-20 text-xs">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="btn-ghost py-1 px-2 disabled:opacity-40">«</button>
                <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage === 1} className="btn-ghost py-1 px-2 disabled:opacity-40">‹</button>
                <span className="text-sm text-gray-600 px-2">Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage === totalPages} className="btn-ghost py-1 px-2 disabled:opacity-40">›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="btn-ghost py-1 px-2 disabled:opacity-40">»</button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default ApplicationList;