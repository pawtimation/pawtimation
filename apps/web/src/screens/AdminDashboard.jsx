import React from 'react';

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

      {/* Top metrics row */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Staff" value={metrics.staff} />
        <StatCard label="Clients" value={metrics.clients} />
        <StatCard label="Dogs" value={metrics.dogs} />
        <StatCard label="Jobs" value={metrics.jobs} />
      </section>

      {/* Chart placeholders – minimal, flat style */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card h-48 flex items-center justify-center text-sm text-slate-500">
          Jobs over time (chart)
        </div>
        <div className="card h-48 flex items-center justify-center text-sm text-slate-500">
          Service breakdown (chart)
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card h-48 flex items-center justify-center text-sm text-slate-500">
          Staff workload (chart)
        </div>
        <div className="card h-48 flex items-center justify-center text-sm text-slate-500">
          Revenue forecast (chart)
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}
