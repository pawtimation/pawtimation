import React from "react";
import DashboardCard from "../components/layout/DashboardCard";

function ChartPlaceholder({ title, type = "line" }) {
  const gradients = {
    line: "from-teal-50 to-white",
    bar: "from-emerald-50 to-white",
    stacked: "from-cyan-50 to-white",
    area: "from-teal-100 to-white"
  };

  const icons = {
    line: (
      <svg className="w-full h-32 opacity-40" viewBox="0 0 200 100" fill="none">
        <path d="M10 80 L50 60 L90 70 L130 40 L170 50 L190 30" stroke="currentColor" strokeWidth="3" className="text-teal-500"/>
        <circle cx="10" cy="80" r="4" fill="currentColor" className="text-teal-600"/>
        <circle cx="50" cy="60" r="4" fill="currentColor" className="text-teal-600"/>
        <circle cx="90" cy="70" r="4" fill="currentColor" className="text-teal-600"/>
        <circle cx="130" cy="40" r="4" fill="currentColor" className="text-teal-600"/>
        <circle cx="170" cy="50" r="4" fill="currentColor" className="text-teal-600"/>
        <circle cx="190" cy="30" r="4" fill="currentColor" className="text-teal-600"/>
      </svg>
    ),
    bar: (
      <svg className="w-full h-32 opacity-40" viewBox="0 0 200 100" fill="none">
        <rect x="20" y="60" width="25" height="40" fill="currentColor" className="text-emerald-400"/>
        <rect x="60" y="40" width="25" height="60" fill="currentColor" className="text-emerald-500"/>
        <rect x="100" y="55" width="25" height="45" fill="currentColor" className="text-emerald-400"/>
        <rect x="140" y="30" width="25" height="70" fill="currentColor" className="text-emerald-600"/>
      </svg>
    ),
    stacked: (
      <svg className="w-full h-32 opacity-40" viewBox="0 0 200 100" fill="none">
        <rect x="30" y="50" width="30" height="50" fill="currentColor" className="text-cyan-400"/>
        <rect x="30" y="30" width="30" height="20" fill="currentColor" className="text-cyan-600"/>
        <rect x="80" y="40" width="30" height="60" fill="currentColor" className="text-cyan-400"/>
        <rect x="80" y="20" width="30" height="20" fill="currentColor" className="text-cyan-600"/>
        <rect x="130" y="55" width="30" height="45" fill="currentColor" className="text-cyan-400"/>
        <rect x="130" y="35" width="30" height="20" fill="currentColor" className="text-cyan-600"/>
      </svg>
    ),
    area: (
      <svg className="w-full h-32 opacity-40" viewBox="0 0 200 100" fill="none">
        <path d="M10 70 L50 50 L90 55 L130 35 L170 45 L190 25 L190 100 L10 100 Z" fill="currentColor" className="text-teal-300"/>
        <path d="M10 70 L50 50 L90 55 L130 35 L170 45 L190 25" stroke="currentColor" strokeWidth="2" className="text-teal-600"/>
      </svg>
    )
  };

  return (
    <div className={`rounded-xl p-6 bg-gradient-to-br ${gradients[type]} border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
      <p className="text-lg font-medium text-gray-700 mb-4">{title}</p>
      <div className="flex items-center justify-center">
        {icons[type]}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">Chart visualization coming soon</p>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <div className="w-full bg-[#FAFAFC] min-h-screen px-6 py-8">

      {/* Business Overview Section */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Business Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard>
          <p className="text-sm text-gray-500 mb-1">Staff</p>
          <p className="text-3xl font-bold text-gray-800">1</p>
        </DashboardCard>

        <DashboardCard>
          <p className="text-sm text-gray-500 mb-1">Clients</p>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </DashboardCard>

        <DashboardCard>
          <p className="text-sm text-gray-500 mb-1">Dogs</p>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </DashboardCard>

        <DashboardCard>
          <p className="text-sm text-gray-500 mb-1">Jobs</p>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </DashboardCard>
      </div>

      {/* Insights */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Business Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartPlaceholder title="Jobs over time" type="line" />
        <ChartPlaceholder title="Service breakdown" type="bar" />
        <ChartPlaceholder title="Staff workload" type="stacked" />
        <ChartPlaceholder title="Revenue forecast" type="area" />
      </div>

    </div>
  );
}
