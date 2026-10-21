import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../api/projects';
import { departmentAPI } from '../api/departments';
import Layout from './Layout';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    departmentAPI.getAll()
      .then(setDepartments)
      .catch(() => console.error('Failed to load departments'));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [search, deptFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const data = await projectAPI.getAll(params);
      setProjects(data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (project) => {
    try {
      await projectAPI.update(project.id, { is_active: !project.is_active });
      fetchProjects();
    } catch {
      alert('Failed to update project status');
    }
  };

  const handleDelete = async () => {
    try {
      await projectAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } catch {
      alert('Failed to delete project.');
      setDeleteTarget(null);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Project Management</h1>
        <button onClick={() => navigate('/projects/new')} className="btn-primary">+ Add Project</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            className="form-input pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input sm:w-52"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : error ? (
        <div className="card p-6 text-red-600">{error}</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No projects found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Department', 'Description', 'Vacancies', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">{p.name}</td>
                  <td className="table-td">
                    <span className="badge badge-blue">{p.department_name || '—'}</span>
                  </td>
                  <td className="table-td text-gray-500 max-w-xs truncate">{p.description || '—'}</td>
                  <td className="table-td text-gray-500">{p.vacancy_count}</td>
                  <td className="table-td">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={p.is_active ? 'badge badge-green cursor-pointer' : 'badge badge-red cursor-pointer'}
                      title="Click to toggle"
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/projects/${p.id}/edit`)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                      <button onClick={() => setDeleteTarget(p)} className="btn-danger text-xs py-1 px-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Delete "{deleteTarget.name}"?</p>
            <p className="text-sm text-gray-500 mb-5">Linked vacancies will keep their data but lose the project link.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleDelete} className="btn-danger">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ProjectList;
