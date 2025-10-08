import React, { useState, useEffect } from 'react';

export function AccountAccordion({ id, title, badge, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    // Open section if URL hash matches
    const hash = window.location.hash.slice(1);
    if (hash === id) {
      setIsOpen(true);
      // Scroll into view after a brief delay
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [id]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === id) {
        setIsOpen(true);
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [id]);

  return (
    <div id={id} className="bg-white rounded-lg border border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset rounded-lg"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {badge}
        </div>
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
