import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [status, setStatus] = useState('testing');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .limit(1);
        
        if (error) {
          setStatus('error');
          setError(error.message);
        } else {
          setStatus('connected');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          {status === 'testing' && (
            <div className="text-slate-300">
              <div className="animate-pulse">Testing connection...</div>
            </div>
          )}
          
          {status === 'connected' && (
            <div className="text-emerald-400 text-xl font-semibold">
              Connected ✅
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="text-red-400 text-xl font-semibold mb-2">
                ❌ Connection Failed
              </div>
              {error && (
                <div className="text-sm text-slate-400 bg-black/20 p-3 rounded font-mono">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400">
              This is a hidden test route. Core app is unaffected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
