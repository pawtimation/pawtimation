import React from 'react';

export function MobileStatCard({ label, value, icon, valueColor = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {icon && (
          <div className="text-teal-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
