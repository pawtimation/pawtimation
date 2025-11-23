import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from '../components/LazyCharts';
import { getSession, ownerApi } from '../lib/auth';

const FEEDBACK_TYPES = {
  BUG: { label: 'Bug', color: '#DC2626' },
  CONFUSION: { label: 'Confusion', color: '#F59E0B' },
  IDEA: { label: 'Idea', color: '#3F9C9B' },
  PRAISE: { label: 'Praise', color: '#10B981' },
  OTHER: { label: 'Other', color: '#64748B' }
};

const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F59E0B',
  MEDIUM: '#FFA500',
  LOW: '#10B981'
};

const DOMAIN_COLORS = ['#3F9C9B', '#66B2B2', '#A8E6CF', '#7FCF9F', '#006666', '#10B981', '#F59E0B', '#64748B', '#475569', '#6B7280', '#94A3B8'];

const DOMAIN_LABELS = {
  BOOKINGS: 'Bookings',
  STAFF: 'Staff Portal',
  CLIENTS: 'Clients',
  FINANCE: 'Finance',
  ROUTES: 'Routes',
  MOBILE_UI: 'Mobile UI',
  ADMIN: 'Admin Portal',
  CLIENT: 'Client Portal',
  OWNER: 'Owner Portal',
  PUBLIC: 'Public',
  OTHER: 'Other'
};

const STATUS_OPTIONS = {
  OPEN: { label: 'Open', color: '#3F9C9B' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: '#66B2B2' },
  IN_PROGRESS: { label: 'In Progress', color: '#FFA500' },
  RESOLVED: { label: 'Resolved', color: '#4CAF50' },
  WONT_FIX: { label: 'Won\'t Fix', color: '#6B7280' }
};

export function OwnerFeedbackContent() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    domain: '',
    feedbackType: '',
    status: ''
  });

  const loadFeedback = async () => {
    try {
      const session = getSession('SUPER_ADMIN');
      
      if (!session || !session.token) {
        navigate('/owner/login');
        return;
      }
      
      const queryParams = new URLSearchParams();
      if (filters.domain) queryParams.append('domain', filters.domain);
      if (filters.feedbackType) queryParams.append('category', filters.feedbackType);
      if (filters.status) queryParams.append('status', filters.status);

      const queryString = queryParams.toString();
      const feedbackUrl = queryString ? `/owner/feedback?${queryString}` : '/owner/feedback';

      const [feedbackRes, analyticsRes] = await Promise.all([
        ownerApi(feedbackUrl),
        ownerApi('/owner/feedback/analytics')
      ]);

      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setFeedback(data.feedback || []);
      } else if (feedbackRes.status === 401 || feedbackRes.status === 403) {
        navigate('/owner/login');
        return;
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [filters]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const session = getSession('SUPER_ADMIN');
      
      if (!session || !session.token) {
        navigate('/owner/login');
        return;
      }
      
      const response = await ownerApi(`/owner/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadFeedback();
      } else if (response.status === 401 || response.status === 403) {
        navigate('/owner/login');
      }
    } catch (error) {
      console.error('Failed to update feedback status:', error);
    }
  };

  const clearFilters = () => {
    setFilters({ domain: '', feedbackType: '', status: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Feedback</h2>
        <p className="text-sm text-slate-600 mt-1">{feedback.length} feedback item{feedback.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Analytics Charts Section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Feedback Over Time */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback Over Time (Last 14 Days)</h3>
            {analytics.feedbackOverTime.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.feedbackOverTime}>
                  <defs>
                    <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3F9C9B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3F9C9B" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value) => [value, 'Feedback Items']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3F9C9B"
                    strokeWidth={3}
                    fill="url(#feedbackGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>No feedback data yet</p>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback by Category</h3>
            {Object.values(analytics.byCategory).some(v => v > 0) ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.byCategory)
                        .filter(([_, value]) => value > 0)
                        .map(([key, value]) => ({
                          name: FEEDBACK_TYPES[key]?.label || key,
                          value,
                          color: FEEDBACK_TYPES[key]?.color || '#2A2D34'
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {Object.entries(analytics.byCategory)
                        .filter(([_, value]) => value > 0)
                        .map(([key], index) => (
                          <Cell key={`cell-${index}`} fill={FEEDBACK_TYPES[key]?.color || '#2A2D34'} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  {Object.entries(analytics.byCategory)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: FEEDBACK_TYPES[key]?.color || '#2A2D34' }}
                        ></div>
                        <span className="text-gray-700">{FEEDBACK_TYPES[key]?.label}: {value}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>No category data yet</p>
              </div>
            )}
          </div>

          {/* Severity Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback by Severity</h3>
            {Object.values(analytics.bySeverity).some(v => v > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(analytics.bySeverity)
                  .filter(([_, value]) => value > 0)
                  .map(([key, value]) => ({
                    severity: key,
                    count: value
                  }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="severity" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {Object.entries(analytics.bySeverity)
                      .filter(([_, value]) => value > 0)
                      .map(([key], index) => (
                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[key] || '#4CAF50'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>No severity data yet</p>
              </div>
            )}
          </div>

          {/* Domain Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback by Domain</h3>
            {Object.values(analytics.byDomain).some(v => v > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(analytics.byDomain)
                  .filter(([_, value]) => value > 0)
                  .map(([key, value]) => ({
                    domain: DOMAIN_LABELS[key] || key,
                    count: value
                  }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="domain" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {Object.entries(analytics.byDomain)
                      .filter(([_, value]) => value > 0)
                      .map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>No domain data yet</p>
              </div>
            )}
          </div>

          {/* Status Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback by Status</h3>
            {Object.values(analytics.byStatus).some(v => v > 0) ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.byStatus)
                        .filter(([_, value]) => value > 0)
                        .map(([key, value]) => ({
                          name: STATUS_OPTIONS[key]?.label || key,
                          value,
                          color: STATUS_OPTIONS[key]?.color || '#6B7280'
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {Object.entries(analytics.byStatus)
                        .filter(([_, value]) => value > 0)
                        .map(([key], index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_OPTIONS[key]?.color || '#6B7280'} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  {Object.entries(analytics.byStatus)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: STATUS_OPTIONS[key]?.color || '#6B7280' }}
                        ></div>
                        <span className="text-gray-700">{STATUS_OPTIONS[key]?.label}: {value}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <p>No status data yet</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <select
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Domains</option>
              {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.feedbackType}
              onChange={(e) => setFilters({ ...filters, feedbackType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Types</option>
              {Object.entries(FEEDBACK_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading feedback...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No feedback found</h3>
          <p className="text-gray-600">No feedback items match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: FEEDBACK_TYPES[item.category]?.color || '#64748B' }}
                  >
                    {item.category?.substring(0, 1) || 'F'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {FEEDBACK_TYPES[item.category]?.label}
                      </span>
                      {item.severity && item.category === 'BUG' && (
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full text-white font-medium"
                          style={{ backgroundColor: SEVERITY_COLORS[item.severity] || '#4CAF50' }}
                        >
                          {item.severity}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {DOMAIN_LABELS[item.domain]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleString()} • ID: {item.id}
                    </div>
                  </div>
                </div>

                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className="px-3 py-1 border-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{
                    borderColor: STATUS_OPTIONS[item.status]?.color,
                    color: STATUS_OPTIONS[item.status]?.color
                  }}
                >
                  {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                {item.title && item.title !== item.description?.substring(0, 100) && (
                  <h4 className="font-semibold text-gray-800 mb-2">{item.title}</h4>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>

              {item.context && (
                <div className="bg-gray-50 rounded p-3 text-xs">
                  <div className="font-medium text-gray-700 mb-1">Context:</div>
                  {item.context.url && (
                    <div className="text-gray-600 truncate">
                      <span className="font-medium">URL:</span> {item.context.url}
                    </div>
                  )}
                  {item.context.userAgent && (
                    <div className="text-gray-600 truncate">
                      <span className="font-medium">Browser:</span> {item.context.userAgent}
                    </div>
                  )}
                  {item.businessId && (
                    <div className="text-gray-600">
                      <span className="font-medium">Business ID:</span> {item.businessId}
                    </div>
                  )}
                  {item.userId && (
                    <div className="text-gray-600">
                      <span className="font-medium">User ID:</span> {item.userId}
                    </div>
                  )}
                  {item.userRole && (
                    <div className="text-gray-600">
                      <span className="font-medium">Role:</span> {item.userRole}
                    </div>
                  )}
                  {item.occurrenceCount && item.occurrenceCount > 1 && (
                    <div className="text-red-600 font-medium">
                      ⚠️ Reported {item.occurrenceCount} times
                    </div>
                  )}
                </div>
              )}

              {item.resolvedAt && (
                <div className="mt-3 text-xs text-green-600">
                  ✓ Resolved on {new Date(item.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
