import React from 'react';

export function ServiceCard({ service, onEdit }) {
  const priceInPounds = (service.priceCents || 0) / 100;
  
  return (
    <div className="card text-sm text-slate-700 space-y-2">
      <div className="flex justify-between">
        <div className="font-semibold">{service.name}</div>
        <button
          type="button"
          className="text-xs text-teal-700 hover:underline"
          onClick={() => onEdit(service)}
        >
          Edit
        </button>
      </div>

      {service.description && <div>{service.description}</div>}
      
      <div className="text-xs text-slate-500">
        Duration: {service.durationMinutes} mins · £{priceInPounds.toFixed(2)}
      </div>

      <div className="flex gap-2 flex-wrap">
        {service.active ? (
          <span className="text-emerald-700 text-xs">Active</span>
        ) : (
          <span className="text-amber-700 text-xs">Archived</span>
        )}
        
        {service.group && (
          <span className="text-blue-700 text-xs">Group (max {service.maxDogs} dogs)</span>
        )}
        
        {service.approvalRequired && (
          <span className="text-purple-700 text-xs">Requires approval</span>
        )}
      </div>
    </div>
  );
}
