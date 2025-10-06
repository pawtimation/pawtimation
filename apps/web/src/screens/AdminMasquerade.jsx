import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function AdminMasquerade() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!search.trim()) return;
    
    setSearching(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/admin/search-users?q=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.users || []);
    } catch (err) {
      setError('Failed to search users');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleMasquerade(user, role) {
    localStorage.setItem('pt_masquerade', JSON.stringify({
      originalUser: auth.user,
      actingAs: user
    }));
    
    auth.user = user;
    localStorage.setItem('pt_user', JSON.stringify(user));
    
    navigate(role === 'owner' ? '/owner' : '/companion');
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Masquerade</h2>
        <button onClick={() => navigate('/admin')} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm text-yellow-800">
            <strong>Use responsibly:</strong> You'll have full access to the user's account. Always obtain permission before masquerading in production.
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium mb-2">Search by email or user ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="user@example.com or u_1234567890"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-sm text-rose-600">{error}</div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Search Results</h3>
          <div className="space-y-3">
            {results.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-slate-600">{user.email}</div>
                    <div className="text-xs text-slate-400 mt-1">ID: {user.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMasquerade(user, 'owner')}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                    >
                      Act as Owner
                    </button>
                    <button
                      onClick={() => handleMasquerade(user, 'companion')}
                      className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
                    >
                      Act as Companion
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && search && !searching && (
        <div className="text-center text-slate-500 py-8">
          No users found matching "{search}"
        </div>
      )}
    </div>
  );
}
