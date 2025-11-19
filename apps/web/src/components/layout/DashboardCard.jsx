import React from 'react';

export default function DashboardCard({ children }) {
  return (
    <div
      className="
        transition-all duration-200 
        rounded-xl bg-white 
        shadow-sm border border-gray-200 
        hover:-translate-y-1 hover:shadow-md 
        hover:border-teal-500
        p-6
      "
    >
      {children}
    </div>
  );
}
