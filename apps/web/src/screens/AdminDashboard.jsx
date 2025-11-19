import React from 'react';

function DashboardCard({ title, value }) {
  return (
    <div className="card card-hover p-6 rounded-xl shadow-sm border border-transparent hover:border-teal-300">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function DashboardChart({ title }) {
  return (
    <div className="chart-placeholder">
      {title}
    </div>
  );
}

export function AdminDashboard() {
  // For now we show simple placeholder metrics.
  // Later we can wire this up to real data from repo / store.
  const metrics = {
    staff: 1,
    clients: 0,
    dogs: 0,
    jobs: 0,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-slate-600">
          A high-level view of your business across staff, clients and bookings.
        </p>
      </header>

      <div className="dashboard-grid">
        <DashboardCard title="Staff" value={metrics.staff} />
        <DashboardCard title="Clients" value={metrics.clients} />
        <DashboardCard title="Dogs" value={metrics.dogs} />
        <DashboardCard title="Jobs" value={metrics.jobs} />
      </div>

      <div className="dashboard-charts">
        <DashboardChart title="Jobs over time" />
        <DashboardChart title="Service breakdown" />
        <DashboardChart title="Staff workload" />
        <DashboardChart title="Revenue forecast" />
      </div>
    </div>
  );
}
