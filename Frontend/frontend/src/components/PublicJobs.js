import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import Header from './Header';
import heroBg from '../asset/hr_home.jpg';

const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

function PublicJobs() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredVacancies, setFilteredVacancies] = useState([]);

  useEffect(() => {
    fetchPublicVacancies();
  }, []);

  const fetchPublicVacancies = async () => {
    try {
      const data = await vacancyAPI.getPublic();
      setVacancies(data);
      setFilteredVacancies(data);
    } catch (err) {
      setError('Failed to load job openings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = vacancies;
    if (searchTerm) {
      result = result.filter(vacancy =>
        vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stripHtml(vacancy.description).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (locationFilter) {
      result = result.filter(vacancy => vacancy.location === locationFilter);
    }
    if (typeFilter) {
      result = result.filter(vacancy => vacancy.employment_type === typeFilter);
    }
    if (workplaceFilter) {
      result = result.filter(vacancy => vacancy.workplace_type === workplaceFilter);
    }
    if (experienceFilter) {
      result = result.filter(vacancy => vacancy.experience_level === experienceFilter);
    }
    if (categoryFilter) {
      result = result.filter(vacancy => vacancy.category_name === categoryFilter);
    }
    setFilteredVacancies(result);
  }, [searchTerm, locationFilter, typeFilter, workplaceFilter, experienceFilter, categoryFilter, vacancies]);

  const locations = [...new Set(vacancies.map(v => v.location))];
  const employmentTypes = [...new Set(vacancies.map(v => v.employment_type))];
  const workplaceTypes = [...new Set(vacancies.map(v => v.workplace_type).filter(Boolean))];
  const experienceLevels = [...new Set(vacancies.map(v => v.experience_level).filter(Boolean))];
  const categories = [...new Set(vacancies.map(v => v.category_name).filter(Boolean))];

  const formatLabel = (value) => {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setWorkplaceFilter('');
    setExperienceFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = searchTerm || locationFilter || typeFilter || workplaceFilter || experienceFilter || categoryFilter;

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-8"><div className="card p-6 text-red-600">{error}</div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner */}
      <div
        className="relative text-white py-12 md:py-20 px-4 md:px-6"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-primary-900/70" />
        <div className="relative max-w-6xl mx-auto">
          <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest mb-3">We're Hiring</p>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Find Your Next Opportunity</h1>
          <p className="text-primary-100 text-sm md:text-base mb-6 md:mb-8 max-w-lg">Browse {vacancies.length} open position{vacancies.length !== 1 ? 's' : ''} and take the next step in your career.</p>
          {/* Hero search bar */}
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white"
            >
              <option value="">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredVacancies.length}</span> position{filteredVacancies.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg px-3 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filters {hasActiveFilters && <span className="bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{[typeFilter,workplaceFilter,experienceFilter,categoryFilter].filter(Boolean).length}</span>}
          </button>
        </div>

        {/* Mobile filters panel */}
        {filtersOpen && (
          <div className="md:hidden card p-4 mb-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Type', value: typeFilter, setter: setTypeFilter, options: employmentTypes },
              { label: 'Workplace', value: workplaceFilter, setter: setWorkplaceFilter, options: workplaceTypes },
              { label: 'Experience', value: experienceFilter, setter: setExperienceFilter, options: experienceLevels },
              { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: categories },
            ].map(({ label, value, setter, options }) => options.length > 0 && (
              <div key={label}>
                <label className="form-label">{label}</label>
                <select value={value} onChange={(e) => setter(e.target.value)} className="form-input text-xs">
                  <option value="">All</option>
                  {options.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
                </select>
              </div>
            ))}
            {hasActiveFilters && (
              <div className="col-span-2">
                <button onClick={() => { resetFilters(); setFiltersOpen(false); }} className="text-xs text-primary-600 font-medium">Clear all filters</button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-7">

          {/* Sidebar Filters — desktop only */}
          <aside className="hidden md:block w-44 flex-shrink-0">
            <div className="card p-4 space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Clear all</button>
                )}
              </div>

              {[
                { label: 'Employment Type', value: typeFilter, setter: setTypeFilter, options: employmentTypes },
                { label: 'Workplace', value: workplaceFilter, setter: setWorkplaceFilter, options: workplaceTypes },
                { label: 'Experience', value: experienceFilter, setter: setExperienceFilter, options: experienceLevels },
                { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: categories },
              ].map(({ label, value, setter, options }) => options.length > 0 && (
                <div key={label}>
                  <label className="form-label">{label}</label>
                  <select value={value} onChange={(e) => setter(e.target.value)} className="form-input">
                    <option value="">All</option>
                    {options.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </aside>

          {/* Job Listings */}
          <main className="flex-1 min-w-0">
            <div className="hidden md:flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {hasActiveFilters
                  ? <><span className="font-semibold text-gray-900">{filteredVacancies.length}</span> result{filteredVacancies.length !== 1 ? 's' : ''} found</>
                  : <><span className="font-semibold text-gray-900">{filteredVacancies.length}</span> open position{filteredVacancies.length !== 1 ? 's' : ''}</>
                }
              </p>
            </div>

            {filteredVacancies.length === 0 ? (
              <div className="card p-14 text-center col-span-2">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700 mb-1">No positions found</p>
                <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters.</p>
                <button onClick={resetFilters} className="btn-secondary text-sm">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredVacancies.map((v) => {
                  const isExpired = new Date(v.deadline) < new Date();
                  const days = Math.ceil((new Date(v.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/jobs/${v.id}`)}
                      className={`card p-5 cursor-pointer hover:shadow-md hover:border-primary-300 border border-transparent transition-all group flex flex-col ${isExpired ? 'opacity-55' : ''}`}
                    >
                      {/* Card top */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">{v.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{v.department_name}</p>
                          </div>
                        </div>
                        {/* Deadline chip */}
                        {isExpired ? (
                          <span className="badge badge-red flex-shrink-0">Closed</span>
                        ) : days <= 3 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-300 text-gray-900 flex-shrink-0">⚠ {days}d left</span>
                        ) : (
                          <span className="text-xs text-gray-400 flex-shrink-0">Due {new Date(v.deadline).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Description */}
                      {v.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                          {stripHtml(v.description).substring(0, 160)}
                        </p>
                      )}

                      {/* Meta pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {v.location}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {formatLabel(v.employment_type)}
                        </span>
                        {v.workplace_type && (
                          <span className="inline-flex items-center text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">{formatLabel(v.workplace_type)}</span>
                        )}
                        {v.experience_level && (
                          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{formatLabel(v.experience_level)}</span>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">{v.positions_available} position{v.positions_available > 1 ? 's' : ''} available</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${v.id}`); }}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            See Detail
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/apply/${v.id}`); }}
                            disabled={isExpired}
                            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40"
                          >
                            {isExpired ? 'Closed' : 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} HR Portal. All rights reserved.
      </footer>
    </div>
  );
}

export default PublicJobs;