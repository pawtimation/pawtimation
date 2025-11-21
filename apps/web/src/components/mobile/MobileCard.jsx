import React from 'react';

export function MobileCard({ children, onClick, className = '' }) {
  const baseClasses = 'bg-white rounded-xl border border-slate-200 shadow-sm p-4';
  const interactiveClasses = onClick ? 'active:bg-slate-50 transition-colors' : '';
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
