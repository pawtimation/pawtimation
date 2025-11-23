import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../lib/auth';

const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })));

export function OwnerHealthContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState([]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      
      const [statusRes, alertsRes, metricsRes, activityRes, integrityRes, onboardingRes] = await Promise.all([
        ownerApi('/owner/health/status'),
        ownerApi('/owner/health/alerts'),
        ownerApi('/owner/health/metrics?days=7'),
        ownerApi('/owner/health/activity'),
        ownerApi('/owner/health/integrity'),
        ownerApi('/owner/health/onboarding-progress')
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data);
      }

      if (integrityRes.ok) {
        const data = await integrityRes.json();
        setIntegrity(data);
      }

      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        setOnboardingProgress(data.businesses || []);
      }

      if (statusRes.status === 401 || statusRes.status === 403) {
        navigate('/owner/login');
      }
    } catch (err) {
      console.error('Failed to load health data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status === 'Healthy' || status === 'healthy' || status === 'good') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'Warnings' || status === 'warning') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') return 'bg-red-100 text-red-700 border-red-300';
    if (severity === 'warning') return 'bg-amber-100 text-amber-700 border-amber-300';
    if (severity === 'high') return 'bg-orange-100 text-orange-700 border-orange-300';
    if (severity === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (severity === 'low') return 'bg-blue-100 text-blue-700 border-blue-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Health Dashboard</h2>
        <p className="text-sm text-slate-600 mt-1">Real-time monitoring of system performance, errors, and data integrity</p>
      </div>

      {/* Business Onboarding Progress Tracking */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Business Onboarding Progress</h3>
          <p className="text-sm text-slate-600 mt-1">Monitor beta tester adoption across all businesses</p>
        </div>
        
        <div className="p-6">
          {onboardingProgress.length === 0 ? (
            <p className="text-sm text-slate-500">No businesses found</p>
          ) : (
            <div className="space-y-4">
              {onboardingProgress.map(business => {
                const statusColor = business.status === 'green' 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : business.status === 'amber' 
                  ? 'bg-amber-100 text-amber-700 border-amber-300' 
                  : 'bg-red-100 text-red-700 border-red-300';
                
                return (
                  <div key={business.businessId} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{business.businessName}</h4>
                        <p className="text-sm text-slate-600">{business.ownerEmail}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Joined {new Date(business.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                          {business.completionPercent}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{business.completedSteps.length} of {business.totalSteps} complete</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          business.status === 'green' ? 'bg-green-600' : 
                          business.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${business.completionPercent}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(business.steps).map(([step, completed]) => {
                        const stepLabel = step.replace(/([A-Z])/g, ' $1').replace(/^first/, 'First');
                        return (
                          <div key={step} className={`px-2 py-1 rounded ${completed ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {completed ? '✓' : '○'} {stepLabel}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top-Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`bg-white rounded-lg border p-5 ${getStatusColor(status?.systemStatus)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">System Status</p>
              <p className="text-2xl font-bold mt-1">{status?.systemStatus || 'Healthy'}</p>
            </div>
            <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className={`bg-white rounded-lg border p-5 ${getStatusColor(status?.apiResponseTime?.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">API Response Time</p>
              <p className="text-2xl font-bold mt-1">{status?.apiResponseTime?.avgMs || 0} ms</p>
              <p className="text-xs mt-1 opacity-75">Last 60 minutes avg</p>
            </div>
            <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Errors (24h)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{status?.errors24h || 0}</p>
              <p className="text-xs text-slate-500 mt-1">High severity only</p>
            </div>
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className={`bg-white rounded-lg border p-5 ${getStatusColor(status?.billingHealth?.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Billing Health</p>
              <p className="text-2xl font-bold mt-1">
                {((status?.billingHealth?.failedInvoices || 0) + (status?.billingHealth?.pastDueSubscriptions || 0))}
              </p>
              <p className="text-xs mt-1 opacity-75">Issues detected</p>
            </div>
            <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Live System Alerts */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Live System Alerts</h3>
          <button
            onClick={loadAllData}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">All systems operating normally</p>
              <p className="text-xs text-slate-400 mt-1">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityBadge(alert.severity)}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {alert.severity === 'critical' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alert.severity === 'warning' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alert.severity === 'info' && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">{formatTimestamp(alert.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">API Error Rate (7 days)</h3>
          {metrics?.errorTrends?.length > 0 ? (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics.errorTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="errors_500" stackId="1" stroke="#ef4444" fill="#fee2e2" name="500 Errors" />
                  <Area type="monotone" dataKey="errors_404" stackId="1" stroke="#f59e0b" fill="#fef3c7" name="404 Errors" />
                  <Area type="monotone" dataKey="errors_401" stackId="1" stroke="#eab308" fill="#fef9c3" name="401 Errors" />
                  <Area type="monotone" dataKey="errors_400" stackId="1" stroke="#3b82f6" fill="#dbeafe" name="400 Errors" />
                </AreaChart>
              </ResponsiveContainer>
            </Suspense>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No error data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">API Latency Trend</h3>
          {metrics?.latencyTrends?.length > 0 ? (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.latencyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_latency_ms" stroke="#0d9488" strokeWidth={2} name="Avg Latency" />
                  <Line type="monotone" dataKey="p95_latency_ms" stroke="#f59e0b" strokeWidth={2} name="P95 Latency" />
                </LineChart>
              </ResponsiveContainer>
            </Suspense>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No latency data available</div>
          )}
        </div>
      </div>

      {/* Business Activity Monitoring */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Activity Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
            <p className="text-sm font-medium text-teal-900">Walk Volume (7d)</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">
              {activity?.walkVolume?.reduce((sum, day) => sum + (day.walk_count || 0), 0) || 0}
            </p>
            <p className="text-xs text-teal-600 mt-1">
              {activity?.walkVolume?.reduce((sum, day) => sum + (day.completed_count || 0), 0) || 0} completed
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-blue-900">Active Users (24h)</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {(activity?.userActivity?.activeClients24h || 0) + (activity?.userActivity?.activeStaff24h || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {activity?.userActivity?.activeClients24h || 0} clients, {activity?.userActivity?.activeStaff24h || 0} staff
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <p className="text-sm font-medium text-purple-900">Messages (24h)</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{activity?.messaging?.messages24h || 0}</p>
            <p className="text-xs text-purple-600 mt-1">{activity?.messaging?.messages7d || 0} this week</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <p className="text-sm font-medium text-amber-900">Security Alerts</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{activity?.security?.failedLogins24h || 0}</p>
            <p className="text-xs text-amber-600 mt-1">Failed logins (24h)</p>
          </div>
        </div>
      </div>

      {/* Data Integrity Checks */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Data Integrity Checks</h3>
            <p className="text-sm text-slate-500 mt-1">
              Last checked: {integrity?.lastChecked ? new Date(integrity.lastChecked).toLocaleString('en-GB') : 'Never'}
            </p>
          </div>
          {integrity?.summary && (
            <div className="flex gap-3">
              {integrity.summary.high > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {integrity.summary.high} High
                </span>
              )}
              {integrity.summary.medium > 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {integrity.summary.medium} Medium
                </span>
              )}
              {integrity.summary.low > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {integrity.summary.low} Low
                </span>
              )}
              {integrity.summary.total === 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  All Clear
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {integrity?.issues?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg className="mx-auto h-12 w-12 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No data integrity issues detected</p>
              <p className="text-xs text-slate-400 mt-1">All database records are properly linked and valid</p>
            </div>
          ) : (
            integrity.issues.map((issue, index) => (
              <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityBadge(issue.severity)}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">{issue.category.replace(/_/g, ' ')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">{issue.severity}</span>
                  </div>
                  <p className="text-sm font-medium">{issue.message}</p>
                  {issue.action && (
                    <p className="text-xs opacity-75 mt-2">
                      <span className="font-medium">Action needed:</span> {issue.action.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
