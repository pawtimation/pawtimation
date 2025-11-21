import React from 'react';

export function MobileEmptyState({ icon, title, message }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="text-slate-300">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
