import React from 'react';

export function MobilePageHeader({ title, subtitle, accent = false }) {
  return (
    <div className="mb-6">
      <h1 className={`text-2xl font-bold text-slate-900 ${accent ? 'border-b-4 border-teal-600 inline-block pb-1' : ''}`}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-slate-600 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
