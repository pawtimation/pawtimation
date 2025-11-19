import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

export function AdminDashboard({ business }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    unpaidInvoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [jobs, clients, invoices] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
        repo.listInvoicesByBusiness(business.id)
      ]);

      const activeJobs = jobs.filter(j =>
        ['SCHEDULED', 'APPROVED', 'CONFIRMED'].includes(j.status)
      );
      const pendingRequests = jobs.filter(j => j.status === 'REQUESTED');
      const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
      
      const totalRevenue = invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.amountCents || 0), 0);

      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalClients: clients.length,
        totalRevenue: totalRevenue / 100,
        pendingRequests: pendingRequests.length,
        unpaidInvoices: unpaidInvoices.length
      });
      setLoading(false);
    })();
  }, [business]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard…</p>;
  }

  const metrics = [
    { label: 'Total jobs', value: stats.totalJobs, icon: '📋', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active jobs', value: stats.activeJobs, icon: '✓', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Clients', value: stats.totalClients, icon: '👥', color: 'bg-purple-50 text-purple-700' },
    { label: 'Revenue', value: `£${stats.totalRevenue.toFixed(2)}`, icon: '💰', color: 'bg-teal-50 text-teal-700' },
    { label: 'Pending requests', value: stats.pendingRequests, icon: '⏳', color: 'bg-amber-50 text-amber-700' },
    { label: 'Unpaid invoices', value: stats.unpaidInvoices, icon: '📄', color: 'bg-rose-50 text-rose-700' }
  ];

  const quickActions = [
    { label: 'Create job', path: '/admin/jobs/new', icon: '➕' },
    { label: 'View calendar', path: '/admin/calendar', icon: '📅' },
    { label: 'Booking requests', path: '/admin/requests', icon: '📨' },
    { label: 'Manage clients', path: '/admin/clients', icon: '👥' },
    { label: 'View invoices', path: '/admin/invoices', icon: '💳' },
    { label: 'Bulk recurring', path: '/admin/recurring', icon: '🔄' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`rounded-lg border p-4 ${metric.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{metric.icon}</span>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                {metric.label}
              </p>
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-teal-300 transition text-left text-sm"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Getting started</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Add your first client from the Clients menu</li>
          <li>• Set up your services and pricing in Settings</li>
          <li>• Configure staff availability for intelligent job assignment</li>
          <li>• Use the calendar to view your team's schedule</li>
        </ul>
      </div>
    </div>
  );
}
