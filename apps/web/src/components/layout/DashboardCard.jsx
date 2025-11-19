import React from 'react';

export default function DashboardCard({ children }) {
  return (
    <div className="card card-hover p-6 rounded-xl shadow-sm border border-transparent hover:border-teal-300 bg-white">
      {children}
    </div>
  );
}
