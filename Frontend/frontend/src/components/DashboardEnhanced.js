import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vacancyAPI } from '../api/vacancies';
import { applicationAPI } from '../api/applications';
import { userAPI } from '../api/users';
import Layout from './Layout';

function DashboardEnhanced() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vacancies: { total: 0, open: 0, filled: 0, closed: 0, draft: 0, on_hold: 0 },
    applications: { total: 0, pending: 0, reviewing: 0, shortlisted: 0, rejected: 0, accepted: 0 },
    users: { total: 0, admins: 0, recruiters: 0, interviewers: 0 },
    recentApplications: [],
    urgentVacancies: [],
    topVacancies: [],
    trends: { applicationsThisWeek: 0, applicationsLastWeek: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [vacancies, applications, users] = await Promise.all([
        vacancyAPI.getAll(),
        applicationAPI.getAll(),
        user?.role === 'admin' ? userAPI.getAll() : Promise.resolve([])
      ]);

      // Calculate vacancy stats
      const vacancyStats = {
        total: vacancies.length,
        open: vacancies.filter(v => v.status === 'open').length,
        filled: vacancies.filter(v => v.status === 'filled').length,
        closed: vacancies.filter(v => v.status === 'closed').length,
        draft: vacancies.filter(v => v.status === 'draft').length,
        on_hold: vacancies.filter(v => v.status === 'on_hold').length
      };

      // Calculate application stats
      const applicationStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        accepted: applications.filter(a => a.status === 'accepted').length
      };

      // Calculate user stats (admin only)
      const userStats = user?.role === 'admin' ? {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        recruiters: users.filter(u => u.role === 'recruiter').length,
        interviewers: users.filter(u => u.role === 'interviewer').length
      } : { total: 0, admins: 0, recruiters: 0, interviewers: 0 };

      // Applications sorted newest first (filtered by date range in the Activity tab)
      const recentApplications = [...applications]
        .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));

      // Get urgent vacancies (deadline within 7 days)
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const urgentVacancies = vacancies
        .filter(v => v.status === 'open' && new Date(v.deadline) <= sevenDaysFromNow && new Date(v.deadline) >= today)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

      // Get top vacancies by application count
      const vacancyApplicationCounts = vacancies.map(v => ({
        ...v,
        applicationCount: applications.filter(a => a.vacancy === v.id).length
      }));
      const topVacancies = vacancyApplicationCounts
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5);

      // Calculate trends
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const applicationsThisWeek = applications.filter(a => new Date(a.applied_at) >= oneWeekAgo).length;
      const applicationsLastWeek = applications.filter(a => 
        new Date(a.applied_at) >= twoWeeksAgo && new Date(a.applied_at) < oneWeekAgo
      ).length;

      setStats({
        vacancies: vacancyStats,
        applications: applicationStats,
        users: userStats,
        recentApplications,
        urgentVacancies,
        topVacancies,
        trends: { applicationsThisWeek, applicationsLastWeek }
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Helper function to calculate trend
  const calculateTrend = () => {
    const { applicationsThisWeek, applicationsLastWeek } = stats.trends;
    if (applicationsLastWeek === 0) return { direction: 'up', percentage: 100 };
    const change = ((applicationsThisWeek - applicationsLastWeek) / applicationsLastWeek) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(Math.round(change))
    };
  };

  // Helper function to get days remaining
  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm font-medium">Loading dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  const trend = calculateTrend();

  const rangeStart = new Date();
  if (dateRange === 'today') {
    rangeStart.setHours(0, 0, 0, 0);
  } else if (dateRange === 'week') {
    rangeStart.setDate(rangeStart.getDate() - 7);
  } else {
    rangeStart.setMonth(rangeStart.getMonth() - 1);
  }
  const activityApplications = stats.recentApplications
    .filter(app => new Date(app.applied_at) >= rangeStart)
    .slice(0, 20);

  const statusBadge = (status) => {
    const map = {
      pending:     'badge badge-yellow',
      reviewing:   'badge badge-blue',
      shortlisted: 'badge badge-purple',
      accepted:    'badge badge-green',
      rejected:    'badge badge-red',
    };
    return map[status] || 'badge badge-gray';
  };

  return (
    <Layout>
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge badge-blue capitalize">{user?.role}</span>
              {user?.department_name && <span className="badge badge-gray">{user.department_name}</span>}
            </div>
            {user?.role === 'recruiter' && user?.department_name && (
              <p className="text-xs text-amber-600 mt-1">📌 Viewing {user.department_name} department data only</p>
            )}
          </div>
        </div>
        <button onClick={fetchDashboardStats} className="btn-ghost" title="Refresh">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[['overview','Overview'],['analytics','Analytics'],['activity','Activity']].map(([key,label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Vacancies</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.vacancies.total}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs text-green-600 font-medium">{stats.vacancies.open} open</span>
                <span className="text-xs text-blue-600 font-medium">{stats.vacancies.filled} filled</span>
              </div>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.applications.total}</p>
              <p className="text-xs mt-2">
                <span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'} style={{fontWeight:500}}>
                  {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
                </span>
                <span className="text-gray-400"> vs last week</span>
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgent</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.urgentVacancies.length}</p>
              <p className="text-xs text-gray-400 mt-2">Closing within 7 days</p>
            </div>
            {user?.role === 'admin' && (
              <div className="card p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.users.total}</p>
                <p className="text-xs text-gray-400 mt-2">{stats.users.recruiters} recruiters</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-5">
              {/* Quick Actions */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(user?.role === 'admin' || user?.role === 'recruiter') && (
                    <button className="btn-primary justify-start gap-2" onClick={() => navigate('/vacancies/new')}>+ New Vacancy</button>
                  )}
                  <button className="btn-secondary justify-start gap-2" onClick={() => navigate('/vacancies')}>Vacancies</button>
                  <button className="btn-secondary justify-start gap-2" onClick={() => navigate('/applications')}>Applications</button>
                  {user?.role === 'admin' && (
                    <button className="btn-secondary justify-start gap-2" onClick={() => navigate('/users')}>Users</button>
                  )}
                </div>
              </div>

              {/* Pipeline */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Application Pipeline</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Pending',     count: stats.applications.pending,     color: 'bg-yellow-400' },
                    { label: 'Reviewing',   count: stats.applications.reviewing,   color: 'bg-blue-400' },
                    { label: 'Shortlisted', count: stats.applications.shortlisted, color: 'bg-purple-400' },
                    { label: 'Accepted',    count: stats.applications.accepted,    color: 'bg-green-400' },
                  ].map(({ label, count, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{label}</span><strong>{count}</strong>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${calculatePercentage(count, stats.applications.total)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-5">
              {/* Urgent vacancies */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Urgent Vacancies</h2>
                  {stats.urgentVacancies.length > 0 && (
                    <span className="badge badge-red">{stats.urgentVacancies.length}</span>
                  )}
                </div>
                {stats.urgentVacancies.length === 0 ? (
                  <p className="text-sm text-gray-400">No urgent vacancies</p>
                ) : (
                  <div className="space-y-2">
                    {stats.urgentVacancies.map(v => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => navigate(`/vacancies/${v.id}/edit`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{v.title}</p>
                          <p className="text-xs text-gray-500">{v.department_name}</p>
                        </div>
                        <span className="badge badge-red">{getDaysRemaining(v.deadline)}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top vacancies */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Vacancies</h2>
                {stats.topVacancies.length === 0 ? (
                  <p className="text-sm text-gray-400">No vacancies yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topVacancies.map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/vacancies/${v.id}/edit`)}
                      >
                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                          <p className="text-xs text-gray-500">{v.department_name}</p>
                        </div>
                        <span className="badge badge-blue">{v.applicationCount} apps</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vacancy Status */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Vacancy Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Open',   count: stats.vacancies.open,   color: 'bg-green-400' },
                { label: 'Filled', count: stats.vacancies.filled, color: 'bg-blue-400' },
                { label: 'Closed', count: stats.vacancies.closed, color: 'bg-gray-400' },
                { label: 'Draft',  count: stats.vacancies.draft,  color: 'bg-yellow-400' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span><strong>{count}</strong>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${calculatePercentage(count, stats.vacancies.total)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Funnel */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Application Funnel</h2>
            <div className="space-y-2">
              {[
                { label: 'Total',       count: stats.applications.total,                                               pct: 100 },
                { label: 'Under Review',count: stats.applications.reviewing + stats.applications.shortlisted,          pct: calculatePercentage(stats.applications.reviewing + stats.applications.shortlisted, stats.applications.total) },
                { label: 'Shortlisted', count: stats.applications.shortlisted,                                         pct: calculatePercentage(stats.applications.shortlisted, stats.applications.total) },
                { label: 'Accepted',    count: stats.applications.accepted,                                            pct: calculatePercentage(stats.applications.accepted, stats.applications.total) },
              ].map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28">{label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-primary-400 rounded flex items-center px-2" style={{ width: `${pct}%` }}>
                      <span className="text-xs text-white font-medium">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance metrics */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Acceptance Rate', count: stats.applications.accepted,  color: 'bg-green-500' },
                { label: 'Rejection Rate',  count: stats.applications.rejected,  color: 'bg-red-500' },
                { label: 'Pending Rate',    count: stats.applications.pending,   color: 'bg-yellow-500' },
              ].map(({ label, count, color }) => {
                const pct = calculatePercentage(count, stats.applications.total);
                return (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{pct}%</p>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[['today','Today'],['week','This Week'],['month','This Month']].map(([key,label]) => (
                <button
                  key={key}
                  onClick={() => setDateRange(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    dateRange === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>

          {activityApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-medium text-gray-700">No Recent Activity</p>
              <p className="text-xs text-gray-400 mt-1">Applications will appear here as they come in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.candidate_name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Applied for <span className="font-medium text-gray-700">{app.vacancy_title}</span></p>
                    <div className="mt-1">
                      <span className={statusBadge(app.status)}>{app.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default DashboardEnhanced;
