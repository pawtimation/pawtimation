import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, clearSession, setSession, ownerApi } from '../lib/auth';
import { OwnerFeedbackContent } from './OwnerFeedbackContent';
import { OwnerLogsContent } from './OwnerLogsContent';
import { OwnerSalesContent } from './OwnerSalesContent';
import { OwnerHealthContent } from './OwnerHealthContent';
import { OwnerPayoutsContent } from './OwnerPayoutsContent';

export function OwnerDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [betaApplications, setBetaApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const navigate = useNavigate();
  const session = getSession('SUPER_ADMIN');

  useEffect(() => {
    if (!session || !session.userSnapshot?.isSuperAdmin) {
      navigate('/owner/login');
      return;
    }
    loadData();
  }, [pagination.page]);

  async function loadData() {
    try {
      const [bizRes, statsRes, logsRes, betaRes] = await Promise.all([
        ownerApi(`/owner/businesses?page=${pagination.page}&pageSize=${pagination.pageSize}`),
        ownerApi('/owner/stats'),
        ownerApi('/owner/logs?limit=20&severity=ERROR,WARN'),
        ownerApi('/owner/beta/testers')
      ]);

      if (!bizRes.ok) {
        if (bizRes.status === 401 || bizRes.status === 403) {
          navigate('/owner/login');
          return;
        }
      }

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setBusinesses(bizData.businesses || []);
        if (bizData.pagination) {
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

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logs = logsData.logs || logsData;
        setRecentActivity(logs.slice(0, 10));
        setAlerts(logs.filter(log => log.severity === 'ERROR').slice(0, 5));
      }

      if (betaRes.ok) {
        const betaData = await betaRes.json();
        setBetaApplications(betaData.testers || []);
      }
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivateBeta(testerId, name) {
    if (!confirm(`Activate beta access for "${name}"? This will create their business account and send login credentials.`)) {
      return;
    }

    try {
      const response = await ownerApi(`/owner/beta/activate/${testerId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Activation failed');
      }

      alert(`Beta access activated for ${name}! They will receive an email with login credentials.`);
      await loadData();
    } catch (err) {
      alert(`Failed to activate beta: ${err.message}`);
    }
  }

  async function handleResendEmail(testerId, name) {
    if (!confirm(`Resend activation email to "${name}"? This will generate a new password and send updated login credentials.`)) {
      return;
    }

    try {
      const response = await ownerApi(`/owner/beta/resend/${testerId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend email');
      }

      alert(`Activation email resent to ${name}! They will receive an email with updated login credentials.`);
    } catch (err) {
      alert(`Failed to resend email: ${err.message}`);
    }
  }

  async function refreshData() {
    await loadData();
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

  function getIconForType(type) {
    switch (type) {
      case 'building':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'paw':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'check':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
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
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Super Admin Portal</h1>
              <p className="text-sm text-slate-600 mt-0.5">Logged in as {session?.user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'overview'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('businesses')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'businesses'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Businesses
            </button>
            <button
              onClick={() => setSelectedTab('sales')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'sales'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales & Billing
            </button>
            <button
              onClick={() => setSelectedTab('health')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'health'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              System Health
            </button>
            <button
              onClick={() => navigate('/owner/errors')}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Error Tracking
            </button>
            <button
              onClick={() => setSelectedTab('beta')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'beta'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Beta Applications {betaApplications.filter(t => t.status === 'APPLIED' || t.status === 'WAITLISTED').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                  {betaApplications.filter(t => t.status === 'APPLIED' || t.status === 'WAITLISTED').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('feedback')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'feedback'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'logs'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              System Logs
            </button>
            <button
              onClick={() => setSelectedTab('payouts')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedTab === 'payouts'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Payouts
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedTab === 'overview' ? (
          <div className="space-y-6">
            {/* Platform Health Metrics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Businesses" value={stats.totalBusinesses || 0} icon="building" />
                <StatCard label="Active Businesses" value={stats.activeBusinesses || 0} icon="chart" color="teal" />
                <StatCard label="Total Staff" value={stats.totalStaff || 0} icon="users" />
                <StatCard label="Total Clients" value={stats.totalClients || 0} icon="users" />
                <StatCard label="Total Dogs" value={stats.totalDogs || 0} icon="paw" />
                <StatCard label="Total Bookings" value={stats.totalBookings || 0} icon="calendar" />
                <StatCard label="Bookings (7 days)" value={stats.bookingsLast7Days || 0} icon="clock" color="blue" />
                <StatCard label="Bookings Today" value={stats.bookingsToday || 0} icon="check" color="emerald" />
              </div>
            )}

            {/* Operational Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">Operational Alerts</h2>
                  <p className="text-sm text-slate-600 mt-0.5">{alerts.length} issue{alerts.length === 1 ? '' : 's'} requiring attention</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {alerts.map(alert => (
                    <div key={alert.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                              {alert.severity}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                              {alert.logType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-900 font-medium">{alert.message}</p>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => navigate('/owner/logs?severity=ERROR')}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    View all error logs →
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-600 mt-0.5">Real-time platform events</p>
              </div>
              <div className="divide-y divide-slate-200">
                {recentActivity.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-600">
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map(log => (
                    <div key={log.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                          <p className="text-sm text-slate-900">{log.message}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : selectedTab === 'businesses' ? (
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">{biz.name}</h3>
                        {biz.planType === 'FOUNDING_MEMBER' && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
                            ⭐ FOUNDING MEMBER
                          </span>
                        )}
                      </div>
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

                  {(biz.trialEndsAt || biz.betaTesterId || biz.planType === 'FOUNDING_MEMBER') && (
                    <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                      {biz.planType === 'FOUNDING_MEMBER' && (
                        <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded">
                          <p className="text-xs font-semibold text-amber-900">Founding Member Plan</p>
                          <p className="text-xs text-amber-800">
                            Locked price: £{(biz.lockedPrice / 100).toFixed(2)}/month forever • Billing starts: {biz.billingStartDate ? new Date(biz.billingStartDate).toLocaleDateString() : 'Jan 1, 2026'}
                          </p>
                        </div>
                      )}
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
        ) : selectedTab === 'sales' ? (
          <OwnerSalesContent />
        ) : selectedTab === 'health' ? (
          <OwnerHealthContent />
        ) : selectedTab === 'beta' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Beta Applications</h2>
              <p className="text-sm text-slate-600">
                Review and activate beta testers. Activating creates their business account and sends login credentials.
              </p>
            </div>

            {betaApplications.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-600">No beta applications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {betaApplications.map(app => (
                  <div key={app.id} className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{app.business_name || app.businessName}</h3>
                        <p className="text-sm text-slate-600">Owner: {app.name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        app.status === 'WAITLISTED' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'APPLIED' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {app.status === 'APPLIED' ? 'Pending' : app.status === 'ACTIVE' ? 'Activated' : app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-slate-900">{app.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm text-slate-900">{app.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {(app.location || app.businessSize || app.servicesOffered || app.currentTools || app.website) && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-700 mb-3">Application Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {app.location && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Location</p>
                              <p className="text-sm text-slate-900">{app.location}</p>
                            </div>
                          )}
                          {app.businessSize && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Business Size</p>
                              <p className="text-sm text-slate-900">{app.businessSize}</p>
                            </div>
                          )}
                          {app.servicesOffered && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-500 mb-1">Services Offered</p>
                              <p className="text-sm text-slate-900">{app.servicesOffered}</p>
                            </div>
                          )}
                          {app.currentTools && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-500 mb-1">Current Tools</p>
                              <p className="text-sm text-slate-900">{app.currentTools}</p>
                            </div>
                          )}
                          {app.website && (
                            <div className="col-span-2">
                              <p className="text-xs text-slate-500 mb-1">Website</p>
                              <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline break-all">{app.website}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(app.comments || app.notes) && (
                      <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs font-semibold text-amber-900 mb-2">Additional Comments</p>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{app.comments || app.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
                      <div className="flex flex-col gap-1">
                        <span>Applied: {new Date(app.created_at || app.createdAt).toLocaleDateString()}</span>
                        {app.status === 'ACTIVE' && app.activated_at && (
                          <span className="text-green-600">Activated: {new Date(app.activated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {app.status === 'APPLIED' && (
                          <button
                            onClick={() => handleActivateBeta(app.id, app.name)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Activate Beta Access
                          </button>
                        )}
                        {app.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleResendEmail(app.id, app.name)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Resend Activation Email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedTab === 'feedback' ? (
          <OwnerFeedbackContent />
        ) : selectedTab === 'logs' ? (
          <OwnerLogsContent />
        ) : selectedTab === 'payouts' ? (
          <OwnerPayoutsContent />
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'slate' }) {
  const getColorClasses = () => {
    switch (color) {
      case 'teal':
        return 'bg-teal-100 text-teal-700';
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses()}`}>
          {icon && <OwnerDashboardIcon type={icon} />}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function OwnerDashboardIcon({ type }) {
  switch (type) {
    case 'building':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'paw':
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'check':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
