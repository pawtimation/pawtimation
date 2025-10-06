import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminRibbon({ masqueradingAs, onExit }) {
  const navigate = useNavigate();

  if (!masqueradingAs) return null;

  function handleExit() {
    if (onExit) onExit();
    navigate('/admin');
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👤</span>
        <div>
          <div className="font-semibold">Admin Mode</div>
          <div className="text-xs text-purple-200">Acting as: {masqueradingAs.name} ({masqueradingAs.email})</div>
        </div>
      </div>
      <button
        onClick={handleExit}
        className="px-4 py-1.5 bg-white text-purple-700 rounded hover:bg-purple-50 transition-colors font-medium"
      >
        Exit masquerade
      </button>
    </div>
  );
}
