import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, clearSession, setSession } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

function ownerApi(endpoint, options = {}) {
  const session = getSession('SUPER_ADMIN');
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.token && { 'Authorization': `Bearer ${session.token}` }),
    ...options.headers
  };

  return fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });
}

export function OwnerDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('businesses');
  const [logFilters, setLogFilters] = useState({ logType: '', severity: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const navigate = useNavigate();
  const session = getSession('SUPER_ADMIN');

  useEffect(() => {
    if (!session || !session.isSuperAdmin) {
      navigate('/owner/login');
      return;
    }
    loadData();
  }, [pagination.page]);

  async function loadData() {
    try {
      const [bizRes, logsRes] = await Promise.all([
        ownerApi(`/owner/businesses?page=${pagination.page}&pageSize=${pagination.pageSize}`),
        ownerApi('/owner/logs?limit=100')
      ]);

      if (!bizRes.ok || !logsRes.ok) {
        // If unauthorized, redirect to login
        if (bizRes.status === 401 || bizRes.status === 403 || logsRes.status === 401 || logsRes.status === 403) {
          navigate('/owner/login');
          return;
        }
      }

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setBusinesses(bizData.businesses || []);
        if (bizData.pagination) {
          // If page was auto-corrected by server, update our local state
          if (bizData.pagination.wasAutoCorrected) {
            setPagination(prev => ({
              ...prev,
              page: bizData.pagination.page,
              totalCount: bizData.pagination.totalCount,
              totalPages: bizData.pagination.totalPages,
              hasMore: bizData.pagination.hasMore
            }));
          } else {
            setPagination(bizData.pagination);
          }
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function reloadLogs() {
    try {
      const params = new URLSearchParams({
        limit: '100',
        ...(logFilters.logType && { logType: logFilters.logType }),
        ...(logFilters.severity && { severity: logFilters.severity })
      });
      
      const logsRes = await ownerApi(`/owner/logs?${params}`);
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to reload logs:', err);
    }
  }

  async function handleMasquerade(businessId, businessName) {
    if (!confirm(`Masquerade as admin for "${businessName}"? This will open in a new tab.`)) {
      return;
    }

    try {
      const response = await ownerApi(`/owner/masquerade/${businessId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Masquerade failed');
      }

      const data = await response.json();
      
      // Get super admin ID reliably from current session or decode JWT
      let superAdminId = session.userSnapshot?.id || session.user?.id;
      
      // If still not found, decode the super admin JWT to get the ID
      if (!superAdminId && session.token) {
        try {
          const base64Url = session.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          const payload = JSON.parse(atob(paddedBase64));
          superAdminId = payload.sub;
        } catch (err) {
          console.error('Failed to decode super admin JWT:', err);
        }
      }
      
      if (!superAdminId) {
        throw new Error('Could not determine super admin ID');
      }
      
      // Persist masquerade context separately so it survives token refreshes
      const masqueradeContext = {
        adminUserId: superAdminId,
        businessId: businessId,
        businessName: businessName
      };
      localStorage.setItem('masqueradeContext', JSON.stringify(masqueradeContext));
      
      // Save masquerade session in ADMIN role (temporary) with guaranteed adminUserId
      setSession('ADMIN', {
        token: data.token,
        user: {
          ...data.user,
          masquerading: true,
          masqueradingFrom: superAdminId,  // Use the guaranteed ID from above
          businessName: businessName
        }
      });

      // Open in new tab
      window.open('/admin', '_blank');
      
      alert(`Masquerading as admin for ${businessName}. Check the new tab.`);
    } catch (err) {
      console.error('Masquerade error:', err);
      alert('Failed to masquerade: ' + err.message);
    }
  }

  async function handleSuspend(businessId, businessName) {
    if (!confirm(`SUSPEND "${businessName}"? This will block all access.`)) {
      return;
    }

    try {
      const response = await ownerApi(`/owner/businesses/${businessId}/suspend`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Suspend failed');
      }

      alert('Business suspended successfully');
      await loadData();
    } catch (err) {
      console.error('Suspend error:', err);
      alert('Failed to suspend: ' + err.message);
    }
  }

  async function handleExtendTrial(businessId, businessName) {
    const days = prompt(`Extend trial for "${businessName}" by how many days?`, '30');
    if (!days || isNaN(days)) return;

    try {
      const response = await ownerApi(`/owner/businesses/${businessId}/extend-trial`, {
        method: 'POST',
        body: JSON.stringify({ days: parseInt(days) })
      });

      if (!response.ok) {
        throw new Error('Extend trial failed');
      }

      const result = await response.json();
      alert(result.message);
      await loadData();
    } catch (err) {
      console.error('Extend trial error:', err);
      alert('Failed to extend trial: ' + err.message);
    }
  }

  async function handleResetPassword(businessId, businessName) {
    const newPassword = prompt(`New password for "${businessName}" admin:`, '');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await ownerApi(`/owner/businesses/${businessId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      alert('Password reset successfully');
    } catch (err) {
      console.error('Reset password error:', err);
      alert('Failed to reset password: ' + err.message);
    }
  }

  function handleLogout() {
    clearSession('SUPER_ADMIN');
    navigate('/owner/login');
  }

  function getPlanBadgeColor(planStatus) {
    switch (planStatus) {
      case 'BETA': return 'bg-purple-100 text-purple-800';
      case 'TRIAL': return 'bg-blue-100 text-blue-800';
      case 'FREE_TRIAL': return 'bg-cyan-100 text-cyan-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'ERROR': return 'text-red-600';
      case 'WARN': return 'text-amber-600';
      case 'INFO': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Super Admin Portal</h1>
              <p className="text-sm text-slate-600">Logged in as {session?.user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTab('businesses')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'businesses'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              All Businesses ({pagination.totalCount})
            </button>
            <button
              onClick={() => navigate('/owner/feedback')}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-colors text-slate-600 hover:text-slate-900"
            >
              💬 User Feedback
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'logs'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              System Logs
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {selectedTab === 'businesses' ? (
          <div className="space-y-4">
            {/* Pagination Info */}
            {pagination.totalCount > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-2">
                <p className="text-sm text-slate-600">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} businesses
                </p>
              </div>
            )}
            
            {businesses.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                {pagination.totalCount === 0 ? (
                  <p className="text-slate-600">No businesses found</p>
                ) : (
                  <div>
                    <p className="text-slate-600 mb-3">No businesses on this page</p>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                      className="px-4 py-2 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                    >
                      Go to Page 1
                    </button>
                  </div>
                )}
              </div>
            ) : (
              businesses.map(biz => (
                <div key={biz.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{biz.name}</h3>
                      <p className="text-sm text-slate-600">{biz.country}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(biz.planStatus)}`}>
                      {biz.planStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Staff</p>
                      <p className="text-lg font-semibold text-slate-900">{biz.activeStaff}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Clients</p>
                      <p className="text-lg font-semibold text-slate-900">{biz.activeClients}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Bookings</p>
                      <p className="text-lg font-semibold text-slate-900">{biz.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Referrals</p>
                      <p className="text-lg font-semibold text-slate-900">{biz.referralConversions}</p>
                    </div>
                  </div>

                  {(biz.trialEndsAt || biz.betaTesterId) && (
                    <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs text-slate-600">
                        {biz.betaTesterId && `Beta Tester ID: ${biz.betaTesterId}`}
                        {biz.trialEndsAt && ` • Trial ends: ${new Date(biz.trialEndsAt).toLocaleDateString()}`}
                      </p>
                      {biz.referralCode && (
                        <p className="text-xs text-slate-600 mt-1">Referral code: {biz.referralCode}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleMasquerade(biz.id, biz.name)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Masquerade
                    </button>
                    <button
                      onClick={() => handleExtendTrial(biz.id, biz.name)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Extend Trial
                    </button>
                    <button
                      onClick={() => handleResetPassword(biz.id, biz.name)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Reset Password
                    </button>
                    {biz.planStatus !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleSuspend(biz.id, biz.name)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex gap-3">
              <select
                value={logFilters.logType}
                onChange={(e) => {
                  setLogFilters({ ...logFilters, logType: e.target.value });
                  setTimeout(reloadLogs, 100);
                }}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
              >
                <option value="">All Types</option>
                <option value="AUTH">Auth</option>
                <option value="ERROR">Errors</option>
                <option value="WEBHOOK">Webhooks</option>
                <option value="EMAIL">Emails</option>
                <option value="ADMIN_ACTION">Admin Actions</option>
              </select>

              <select
                value={logFilters.severity}
                onChange={(e) => {
                  setLogFilters({ ...logFilters, severity: e.target.value });
                  setTimeout(reloadLogs, 100);
                }}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
              >
                <option value="">All Severities</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>
              
              <button
                onClick={reloadLogs}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
              >
                Refresh Logs
              </button>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
              {logs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600">No logs found</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {log.logType}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 mb-2">{log.message}</p>
                    {log.metadata && (
                      <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
