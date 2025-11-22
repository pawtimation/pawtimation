import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEEDBACK_TYPES = {
  BUG: { label: 'Bug', icon: '🐛', color: '#E63946' },
  IDEA: { label: 'Idea', icon: '💡', color: '#3F9C9B' },
  PRAISE: { label: 'Praise', icon: '👍', color: '#4CAF50' },
  OTHER: { label: 'Other', icon: '💬', color: '#2A2D34' }
};

const DOMAIN_LABELS = {
  ADMIN: 'Admin Portal',
  STAFF: 'Staff Portal',
  CLIENT: 'Client Portal',
  OWNER: 'Owner Portal',
  PUBLIC: 'Public/Logged Out'
};

const STATUS_OPTIONS = {
  NEW: { label: 'New', color: '#3F9C9B' },
  IN_REVIEW: { label: 'In Review', color: '#FFA500' },
  RESOLVED: { label: 'Resolved', color: '#4CAF50' },
  DISMISSED: { label: 'Dismissed', color: '#6B7280' }
};

export function OwnerFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    domain: '',
    feedbackType: '',
    status: ''
  });

  const loadFeedback = async () => {
    try {
      const token = localStorage.getItem('pawtimation_super_admin_session');
      
      const queryParams = new URLSearchParams();
      if (filters.domain) queryParams.append('domain', filters.domain);
      if (filters.feedbackType) queryParams.append('feedbackType', filters.feedbackType);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/feedback?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      } else if (response.status === 401 || response.status === 403) {
        navigate('/owner/login');
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
      const token = localStorage.getItem('pawtimation_super_admin_session');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/feedback/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        loadFeedback();
      }
    } catch (error) {
      console.error('Failed to update feedback status:', error);
    }
  };

  const clearFilters = () => {
    setFilters({ domain: '', feedbackType: '', status: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-md sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/owner')}
                className="text-white hover:text-red-100 font-medium flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white">User Feedback</h1>
            </div>
            <div className="text-white/90 text-sm">
              {feedback.length} feedback item{feedback.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Types</option>
                {Object.entries(FEEDBACK_TYPES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600"></div>
            <p className="text-gray-600 mt-4">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No feedback found</h3>
            <p className="text-gray-600">No feedback items match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{FEEDBACK_TYPES[item.feedbackType]?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {FEEDBACK_TYPES[item.feedbackType]?.label}
                        </span>
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
                    className="px-3 py-1 border-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  <p className="text-gray-800 whitespace-pre-wrap">{item.message}</p>
                </div>

                {item.metadata && (
                  <div className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium text-gray-700 mb-1">Metadata:</div>
                    {item.metadata.url && (
                      <div className="text-gray-600 truncate">
                        <span className="font-medium">URL:</span> {item.metadata.url}
                      </div>
                    )}
                    {item.metadata.userAgent && (
                      <div className="text-gray-600 truncate">
                        <span className="font-medium">Browser:</span> {item.metadata.userAgent}
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
    </div>
  );
}
