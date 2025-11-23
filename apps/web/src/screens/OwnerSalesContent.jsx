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
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));

export function OwnerSalesContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      
      const [statsRes, metricsRes, invoicesRes, paymentsRes, businessesRes, usersRes] = await Promise.all([
        ownerApi('/owner/sales/stats'),
        ownerApi('/owner/sales/metrics?months=6'),
        ownerApi('/owner/sales/invoices?limit=10'),
        ownerApi('/owner/sales/payments'),
        ownerApi('/owner/sales/businesses'),
        ownerApi('/owner/sales/users')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
      }

      if (businessesRes.ok) {
        const data = await businessesRes.json();
        setBusinesses(data.businesses || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }

      if (statsRes.status === 401 || statsRes.status === 403) {
        navigate('/owner/login');
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sales & Billing</h2>
        <p className="text-sm text-slate-600 mt-1">Comprehensive revenue and subscription analytics across all businesses</p>
      </div>

      {/* Executive KPIs */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Executive KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MRR */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.revenue?.mrr || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">ARR: {formatCurrency(stats?.revenue?.arr || 0)}</p>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.subscriptions?.active || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Trialing: {stats?.subscriptions?.trialing || 0}</p>
          </div>

          {/* ARPU */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Average Revenue Per User</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.revenue?.arpu || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Per active subscription</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.revenue?.totalRevenue || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">All-time paid invoices</p>
          </div>
        </div>
      </div>

      {/* Revenue Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Intelligence</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">6-Month Revenue Trend</h4>
            {metrics?.timeSeries && metrics.timeSeries.length > 0 ? (
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => ['£' + value.toFixed(2), 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Suspense>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
            )}
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Subscription Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Active</span>
                <span className="text-lg font-bold text-green-600">{stats?.subscriptions?.active || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Trialing</span>
                <span className="text-lg font-bold text-blue-600">{stats?.subscriptions?.trialing || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Past Due</span>
                <span className="text-lg font-bold text-amber-600">{stats?.subscriptions?.pastDue || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Canceled</span>
                <span className="text-lg font-bold text-slate-600">{stats?.subscriptions?.canceled || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Operations */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing Operations</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Invoice Overview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Paid</p>
                <p className="text-xl font-bold text-green-600">{stats?.invoices?.paid || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Open</p>
                <p className="text-xl font-bold text-blue-600">{stats?.invoices?.open || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Failed</p>
                <p className="text-xl font-bold text-red-600">{stats?.invoices?.failed || 0}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Overdue</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(stats?.invoices?.overdueAmount || 0)}</p>
              </div>
            </div>
          </div>

          {/* Payment Health */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Payment Health (30 Days)</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Success Rate</span>
                  <span className="text-lg font-bold text-slate-900">{payments?.stats?.successRate || 100}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${payments?.stats?.successRate || 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Successful</p>
                  <p className="text-lg font-bold text-green-600">{payments?.stats?.successfulCharges || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Failed</p>
                  <p className="text-lg font-bold text-red-600">{payments?.stats?.failedCharges || 0}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-600 mb-1">Total Processed</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(payments?.stats?.totalProcessed || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business & User Insights */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Business & User Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Users */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Platform Users</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Total Users</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.users?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Admins</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.users?.admins || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Staff</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.users?.staff || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Clients</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{stats?.users?.clients || 0}</span>
              </div>
            </div>
          </div>

          {/* Business Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Business Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Total Businesses</span>
                <span className="text-lg font-bold text-slate-900">{stats?.businesses?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Active</span>
                <span className="text-lg font-bold text-green-600">{stats?.businesses?.active || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Trial</span>
                <span className="text-lg font-bold text-blue-600">{stats?.businesses?.trial || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Suspended</span>
                <span className="text-lg font-bold text-amber-600">{stats?.businesses?.suspended || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Businesses by Revenue */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Businesses by Revenue</h3>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Clients</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Jobs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {businesses.length > 0 ? (
                  businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{business.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{business.plan_tier || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          business.plan_status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          business.plan_status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                          business.plan_status === 'SUSPENDED' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {business.plan_status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">{business.user_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">{business.client_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">{business.job_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">{formatCurrency(business.total_revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">No business data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Invoices</h3>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Invoice ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-slate-600">{invoice.id.substring(0, 16)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{invoice.customer?.substring(0, 16)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'uncollectible' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(invoice.amount_paid || invoice.amount_due)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(invoice.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(invoice.due_date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">No invoices available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
